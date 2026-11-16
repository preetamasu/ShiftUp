import { askCoach } from "@/lib/llm"
import { configured } from "@/lib/config"
import { fakeCoach } from "@/lib/fake"
import { rememberTurn } from "@/lib/memory"
import { speak } from "@/lib/polly"
import { findAsked, getSession } from "@/lib/session"
import { transcribe } from "@/lib/transcribe"
import type { CoachResponse, CoachTurn } from "@/lib/types"

// The Spanish side conversation. Multipart form: sessionId, questionId, stage
// ("question" or "feedback"), thread (JSON array of the side conversation so
// far), optionally lastAnswer and lastFeedback, and her question as either
//   text   what she typed, or
//   audio  what she said, as 16 kHz mono 16-bit PCM.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  if (!form) return Response.json({ error: "send a multipart form" }, { status: 400 })
  const field = (name: string) => {
    const value = form.get(name)
    return typeof value === "string" && value.trim() ? value.trim() : undefined
  }

  let text = field("text")
  const audio = form.get("audio")
  if (!text && audio instanceof Blob && audio.size > 0 && configured.aws()) {
    try {
      text = (await transcribe(new Uint8Array(await audio.arrayBuffer()), "es-US")).transcript.trim() || undefined
    } catch (err) {
      const message = err instanceof Error ? `${err.name}: ${err.message}` : "transcription failed"
      return Response.json({ error: "transcription_unavailable", message }, { status: 502 })
    }
  }
  if (!text) return Response.json({ error: "no_question", message: "Send text, or audio with speech in it." }, { status: 400 })

  let response: CoachResponse
  if (configured.llm()) {
    const session = getSession(field("sessionId") ?? "")
    if (!session) return Response.json({ error: "unknown sessionId" }, { status: 404 })
    let thread: CoachTurn[] = []
    try {
      thread = JSON.parse(field("thread") ?? "[]") as CoachTurn[]
    } catch {
      return Response.json({ error: "thread must be a JSON array" }, { status: 400 })
    }
    try {
      const result = await askCoach({
        question: findAsked(session, field("questionId") ?? ""),
        stage: field("stage") === "feedback" ? "feedback" : "question",
        lastAnswer: field("lastAnswer"),
        lastFeedback: field("lastFeedback"),
        profile: session.profile,
        thread,
        text,
      })
      if (result.note) {
        await rememberTurn(session.learnerId, { sessionId: session.id, record: `While practising, ${session.name} asked the coach for help. ${result.note}` })
      }
      response = { heard: text, reply: { es: result.es, phrasesEn: result.phrasesEn } }
    } catch (err) {
      const message = err instanceof Error ? err.message : "coach failed"
      return Response.json({ error: "coach_unavailable", message }, { status: 502 })
    }
  } else {
    response = fakeCoach(text)
  }

  // Speak the reply in Spanish. If the voice fails, the text reply still goes out.
  if (configured.aws()) {
    try {
      const speech = await speak(response.reply.es, "normal", "es-US")
      response = { ...response, audioBase64: speech.audioBase64, audioMime: speech.audioMime, visemes: speech.visemes }
    } catch (err) {
      console.warn("Coach voice failed; sending the text reply only.", err instanceof Error ? err.message : err)
    }
  }
  return Response.json(response)
}
