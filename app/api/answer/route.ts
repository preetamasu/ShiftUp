import { writeFeedback } from "@/lib/llm"
import { configured } from "@/lib/config"
import { analyseDelivery, deliveryFlags, THRESHOLDS } from "@/lib/delivery"
import { FAKE_FEEDBACK, FAKE_TRANSCRIPT, FAKE_WORDS } from "@/lib/fake"
import { listen, type Impression } from "@/lib/gemini"
import { rememberTurn } from "@/lib/memory"
import { asksToRepeat } from "@/lib/rescue"
import { findAsked, getSession } from "@/lib/session"
import { logAnswer } from "@/lib/sessionLog"
import { isNotSubscribed, transcribe } from "@/lib/transcribe"
import type { AnswerResponse, Feedback, Language, RepeatResponse, Word } from "@/lib/types"

// Multipart form: sessionId, questionId, language, and either
//   audio       her spoken answer as 16 kHz mono 16-bit PCM, or
//   transcript  a typed answer (no delivery numbers).
// With neither, or while a service is unavailable, a stand-in is used and the
// response carries `fake: true`.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  const sessionId = form?.get("sessionId")
  const questionId = form?.get("questionId")
  if (typeof sessionId !== "string" || typeof questionId !== "string") {
    return Response.json({ error: "sessionId and questionId are required" }, { status: 400 })
  }
  const session = getSession(sessionId)
  if (!session) return Response.json({ error: "unknown sessionId" }, { status: 404 })
  const question = findAsked(session, questionId)
  if (!question) return Response.json({ error: "that question was not asked in this session" }, { status: 400 })

  const language: Language = form?.get("language") === "es-US" ? "es-US" : "en-US"
  const typed = form?.get("transcript")
  const audio = form?.get("audio")

  let transcript = FAKE_TRANSCRIPT
  let words: Word[] = FAKE_WORDS
  let fake = true
  let listener: Impression | null = null
  if (typeof typed === "string" && typed.trim()) {
    transcript = typed.trim()
    words = []
    fake = false
  } else if (audio instanceof Blob && audio.size > 0 && configured.aws()) {
    const pcm = new Uint8Array(await audio.arrayBuffer())
    // Gemini listens to the same recording while Transcribe works, so it adds no waiting.
    const listening = language === "en-US" && configured.gemini() ? listen(pcm) : null
    try {
      ;({ transcript, words } = await transcribe(pcm, language))
      fake = false
      // A request to repeat is answered at once, without waiting for the second listener.
      if (!asksToRepeat(transcript)) listener = await listening
    } catch (err) {
      // An AWS account without access to Transcribe is treated like a missing key:
      // keep the stand-in transcript. Any other failure is reported.
      if (!isNotSubscribed(err)) {
        const message = err instanceof Error ? `${err.name}: ${err.message}` : "transcription failed"
        return Response.json({ error: "transcription_unavailable", message }, { status: 502 })
      }
      console.warn("Transcribe is not enabled on this AWS account; using the stand-in transcript.")
    }
    if (!fake && !transcript.trim()) return Response.json({ error: "no_speech", message: "No speech was heard in the recording." }, { status: 422 })
  }

  // Asking the interviewer to say it again is the right move in a real interview, so it is
  // treated as one: the screen replays the question slowly. Nothing is graded or remembered.
  if (!fake && asksToRepeat(transcript)) {
    const repeat: RepeatResponse = { repeat: true, transcript }
    return Response.json(repeat)
  }
  // Kept so the interviewer can follow up on what she said. An answer the speech software was
  // unsure of in more than a third of its words is left out: the interviewer would be quoting
  // back words she may never have said.
  const unsure = words.filter((w) => w.confidence < THRESHOLDS.unclearConfidence).length
  if (!fake && unsure * 3 <= words.length) (session.answers ??= {})[question.id] = transcript

  // Delivery is only assessed on spoken answers given in English.
  const delivery = words.length > 0 && language === "en-US" ? analyseDelivery(words) : undefined
  const flags = delivery ? deliveryFlags(delivery) : undefined

  let feedback: Feedback
  let story: string | null = null
  let struggled = false
  if (configured.llm()) {
    try {
      const result = await writeFeedback({ question, transcript, language, delivery, listener, profile: session.profile, jobPosting: session.jobPosting, resume: session.resume })
      const d = result.delivery
      feedback = {
        content: result.content,
        // No delivery feedback without delivery numbers, whatever the model returned.
        delivery: d && delivery ? { ...d, practiseNext: { ...d.practiseNext, word: d.practiseNext.word ?? undefined } } : undefined,
      }
      story = result.story
      struggled = result.struggled
    } catch (err) {
      // The screen can still show her transcript and numbers, with a retry button.
      const message = err instanceof Error ? err.message : "feedback failed"
      return Response.json({ error: "feedback_unavailable", message, transcript, words, delivery }, { status: 502 })
    }
  } else {
    feedback = delivery ? FAKE_FEEDBACK : { content: FAKE_FEEDBACK.content }
    fake = true
  }

  const weakSpot = struggled || flags?.slowStart || flags?.manyPauses ? question.type : null
  if (story && !session.profile.stories.includes(story)) session.profile.stories.push(story)

  await rememberTurn(session.learnerId, {
    sessionId: session.id,
    story,
    weakSpot,
    record: [
      `Interview practice with ${session.name}. Question type: ${question.type}. Question: ${question.textEn}`,
      `${session.name}'s answer (${language === "es-US" ? "in Spanish" : "in English"}): ${transcript}`,
      story ? `Work story from this answer: ${story}` : "",
      weakSpot ? `${session.name} struggled with this ${question.type.replace(/_/g, " ")} question.` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  })
  // Answers without delivery numbers stay out of the progress averages.
  if (delivery) await logAnswer(session.learnerId, session.id, delivery, weakSpot)

  const response: AnswerResponse = { transcript, words, delivery, feedback, weakSpot, ...(listener ? { listener } : {}), ...(fake ? { fake: true } : {}) }
  return Response.json(response)
}
