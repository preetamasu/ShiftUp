import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { z } from "zod"
import { deliveryFlags, THRESHOLDS } from "./delivery"
import type { Impression } from "./gemini"
import type { CoachTurn, Delivery, Profile, Question } from "./types"

// The language model that writes everything the learner reads: the feedback on
// an answer and the coach's replies. Grok is used when GROK_API_KEY (or
// XAI_API_KEY) is set; otherwise Claude, if ANTHROPIC_API_KEY is.

// Grok's non-reasoning model answers in about two seconds. Its larger models
// took 12 to 16 seconds on the same request, too slow for a spoken conversation.
const GROK_MODEL = process.env.GROK_MODEL || "grok-4.20-0309-non-reasoning"
const CLAUDE_MODEL = "claude-opus-5-5"

const grokKey = () => process.env.GROK_API_KEY || process.env.XAI_API_KEY

async function askGrok<T extends z.ZodType>(name: string, schema: T, system: string, user: string): Promise<z.infer<T>> {
  const { $schema: _dialect, ...jsonSchema } = z.toJSONSchema(schema) as Record<string, unknown>
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${grokKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_schema", json_schema: { name, schema: jsonSchema, strict: true } },
    }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`Grok API error ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error("Grok returned an empty reply.")
  return schema.parse(JSON.parse(content))
}

let anthropic: Anthropic | undefined

/** Not yet run against the real service: the Anthropic account had no credit when this was written. */
async function askClaude<T extends z.ZodType>(schema: T, system: string, user: string): Promise<z.infer<T>> {
  // If the model declines a request on policy grounds, the API re-runs it on a
  // fallback model inside the same call (server-side fallbacks).
  const response = await (anthropic ??= new Anthropic()).beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: zodOutputFormat(schema) },
    system,
    messages: [{ role: "user", content: user }],
  })
  if (response.stop_reason === "refusal") throw new Error("The model declined this request.")
  if (response.stop_reason === "max_tokens") throw new Error("The reply was cut off before it finished.")
  const text = response.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("")
  return schema.parse(JSON.parse(text))
}

const ask = <T extends z.ZodType>(name: string, schema: T, system: string, user: string) =>
  grokKey() ? askGrok(name, schema, system, user) : askClaude(schema, system, user)

const Bilingual = z.object({ es: z.string(), en: z.string() })

const FeedbackSchema = z.object({
  content: z.object({
    wrongWay: z.boolean(),
    good: Bilingual,
    fix: Bilingual,
    sampleAnswerEn: z.string(),
    usedDetails: z.array(z.string()),
  }),
  delivery: z
    .object({
      clarity: Bilingual,
      confidence: Bilingual,
      naturalness: Bilingual,
      practiseNext: z.object({
        kind: z.enum(["word", "start", "pace", "phrase"]),
        word: z.string().nullable(),
        es: z.string(),
        en: z.string(),
      }),
    })
    .nullable(),
  story: z.string().nullable(),
  struggled: z.boolean(),
})
export type FeedbackResult = z.infer<typeof FeedbackSchema>

// The learner can be anyone, so the prompts say "the learner" and "they", and the
// Spanish is asked to avoid words that change with the person's gender.
const FEEDBACK_SYSTEM = `You are the feedback writer inside an interview-practice app for people who are still learning English and are preparing for interviews for hourly jobs such as home health aide. The learner hears an interview question in English, answers out loud, and then reads your feedback. Their first language is Spanish. Many learners using this are nervous, so the feedback should leave the learner knowing exactly one thing to do better and feeling able to do it.

What you receive: the interview question, a transcript of the learner's spoken answer, the language they answered in, delivery notes measured from the recording when there are any, what we remember about the learner from earlier sessions, and the job posting and the learner's resume if they pasted them.

What you return:

content.wrongWay: true only when the answer clearly goes the wrong way, which means one of two things. Either it does not answer the question that was asked: it answers a different question, or shows the question was misunderstood. Or it says something that would count against the learner with a real interviewer: speaking badly of a client, a family, a coworker or an employer; describing something unsafe or against the rules; saying they are often late or unreliable without saying what they changed; or giving money as the only reason for wanting the job. Money, hours or distance mentioned as one reason beside a real interest in the work is fine. A thin, short or imperfect answer that goes in the right direction is not a wrong one, and when in doubt this is false.
When content.wrongWay is true, three things change. content.fix says so plainly and kindly instead of anything else: what is wrong with answering this way, that they should not answer like this in a real interview, and what the interviewer wants to hear instead. content.good praises only something that deserves it, such as being honest or answering in English, never the part that goes wrong. And the sample answer shows the right direction as a frame: keep only what is true and helpful in their answer, write every other part as a blank in square brackets, such as "I make sure I am on time by [your plan]", and never repeat the part that goes wrong. Do not fill those blanks from the job posting or with ideas of your own, because you do not know what is true for this learner.
content.good: one specific thing the learner did well in this answer, naming what they actually said.
content.fix: the single most useful change to the content of the answer. One thing only. Interviewers in the United States expect people to say what they did themselves and how it ended, and many learners are too modest to do either. So when the question asks about a time something happened and the answer tells a story, check two things before anything else.
First, look at who does the actions in the story. If the learner tells every one of their own actions as "we" and never says "I" did anything, the fix is to say "I" for their own part: quote their words and give the "I" version. In the Spanish, write "lo que usted hizo", never "usted misma" or "usted mismo". If the transcript says "I" for at least one thing the learner did, this check passes: leave every "we" exactly as it is, because "we found a solution together" is the right way to describe something done with another person, and do not mention "I" or "we" at all.
Second, does the answer say how things ended? Any sentence about what happened afterwards counts as the ending, such as "After that she trusted me", "she was happy", "he took the medication" or "we changed the schedule". Only if there is no such sentence is the fix to add one saying how it ended. You do not know how it ended, so never make up an ending, not even as an example: describe what to add, or give a sentence with a blank in square brackets such as "In the end, [what happened]".
If both checks pass, say nothing about "I" or about the ending. Choose another fix instead, such as one detail that is missing (who it was, or what exactly was agreed) or a link from the story to this job.
content.sampleAnswerEn: a stronger version of the answer in English that the learner could say out loud in an interview. First decide whether there is a story to build on. When the question asks about a time something happened, and the learner told no such story in this answer or in the remembered stories, the sample answer is exactly a frame of blanks and nothing else: "One time [what happened]. I [what you did]. In the end, [how it ended]." A made-up story is the worst mistake you can make here, because the learner may repeat it in a real interview as if it were true. Otherwise, build it only from details given in this answer, in the remembered stories, or in the learner's resume. The job posting describes the job, not the learner, so never take a detail about the learner from it. A resume states facts, not stories: when one is provided, take one or two facts that fit this question and say them in plain words. Never recite it, never add a detail to one of its facts, and never join its facts into an event it does not describe. Do not invent facts about the learner, such as years of experience, employers, feelings, reasons, or outcomes they did not mention. When the question asks for something the answer, the stories and the resume do not contain, leave a blank to fill in, written in square brackets, for example "I want this job because [your reason]". The same goes for a story that leaves out who it was or what it was about: keep those as blanks, as in "One time I disagreed with [who] about [what]", and never fill them in yourself. Keep it at the learner's English level: short sentences and words they already use or very common ones, four sentences at most, built around one story rather than several. If they answered in Spanish, this is how they could say their own answer in simple English.
content.usedDetails: the details from the answer, the stories or the resume that the sample answer is built from, as short phrases.

delivery: fill this in only when delivery notes are provided. Otherwise return null.
delivery.clarity: whether a listener could catch the words. If the delivery notes list words the speech software was unsure of, pick at most two that matter to the answer and name them. Phrase it as the software not catching the word, because speech software is less accurate for non-native speakers and the fault may be the software's. If nothing was unclear, say so plainly.
delivery.confidence: how sure the learner sounded. Use what the delivery notes mark as worth mentioning (a long wait before starting, long pauses, filler sounds, a very short answer) and what the transcript shows (restarting a sentence, hedging, apologising). Only if the transcript contains an apology for their English, say kindly that there is no need to apologise and that they can simply begin with the answer; never mention apologising otherwise. Pausing to find a word in a second language is normal, so mention pauses only when the notes mark them. If nothing is marked and the transcript shows no hesitation, say they sounded sure.
delivery.naturalness: whether it sounded like talking. Check the verb tenses first, because this is the most common slip: a story about something that already happened should be told in the past tense. Then look for a phrase that reads as translated word for word from Spanish. If you find a problem, point out the one most useful fix, quoting the exact words from the transcript and giving the natural version. Only correct words that are really in the transcript: if the tenses and phrasing are already right, say it sounds natural and suggest nothing.
delivery.practiseNext: the one delivery thing to practise next. kind is "word" (set word to one English word from the answer to repeat slowly), "start" (begin sooner), "pace" (slow down), or "phrase" (a phrase to rehearse, copied exactly from the answer or from your sample answer, never a new one). Set word to null unless kind is "word".

story: if this answer contains a real work story worth remembering for future sessions, one English sentence summarising it, beginning "The learner". Otherwise null.
struggled: true if the answer did not really answer the question or was too thin to be useful in an interview.

Rules that matter here:
Never comment on the learner's accent, their origin, or sounding native, and never suggest reducing an accent. There is no pronunciation score. The goal is being understood, not sounding like someone else.
Speak to the learner directly, as "you" in English and "usted" in Spanish. Every "es" field is the feedback in natural Latin American Spanish, and every "en" field says the same thing in plain English. You do not know whether the learner is a man or a woman, so in Spanish avoid adjectives that change with gender when describing them: write "con seguridad" rather than "segura" or "seguro", and "usted" rather than "usted misma" or "usted mismo". Quote English words and phrases they should say in English inside both versions.
Write the way a kind teacher talks. Give times in plain words such as "about six seconds", never in milliseconds, and never mention notes, flags, words per minute, or what the software marked.
Keep each field to one or two sentences. It is read on a phone between questions.`

// Sent with a question that does not ask for a story. Without it, the story checks leaked into
// such questions: "why do you want this job" got a made-up "In the end, the families feel calmer".
const NOT_A_STORY = `This question does not ask about a time something happened. So skip the two story checks for content.fix, and do not add an ending such as "In the end, ..." to the sample answer unless the learner or their resume states it.`

// The last thing the model reads. The interview question and the job posting kept supplying "facts"
// about the learner, such as who they disagreed with or that they have reliable transportation.
const SOURCE_CHECK = `Before you answer, check the sample answer sentence by sentence. Every fact about the learner in it must appear in the transcript, in the remembered stories, or in the resume if one is given above. The interview question and the job posting are not sources of facts about the learner: if the learner did not say who it was, what it was about, or how it ended, that part stays a blank in square brackets.`

export async function writeFeedback(input: {
  question: Question
  transcript: string
  language: "en-US" | "es-US"
  delivery?: Delivery
  /** What a second listener (Gemini) heard in the recording, when available. */
  listener?: Impression | null
  profile: Profile
  jobPosting?: string
  resume?: string
}): Promise<FeedbackResult> {
  const { question, transcript, language, delivery, listener, profile, jobPosting, resume } = input
  // A resume gives facts, not stories. On a question that asks for a story the model kept writing
  // an event around resume facts however it was told not to, so there the resume is left out and
  // the story has to be the learner's own.
  const asksForStory = /\btell me about a time\b/i.test(question.textEn)
  const parts = [
    `Interview question (type: ${question.type}): ${question.textEn}`,
    `The learner answered in ${language === "es-US" ? "Spanish, to practise the content first" : "English"}.`,
    `Transcript of the answer:\n${transcript}`,
    delivery ? describeDelivery(delivery, listener) : "No delivery notes for this answer, so return null for delivery.",
    `Stories the learner has told in earlier sessions:\n${profile.stories.length ? profile.stories.map((s) => `- ${s}`).join("\n") : "(none yet)"}`,
    jobPosting ? `The job posting they are preparing for:\n${jobPosting}` : "",
    resume && !asksForStory ? `The learner's resume, as they pasted it:\n${resume}` : "",
    asksForStory ? "" : NOT_A_STORY,
    SOURCE_CHECK,
  ]
  return ask("feedback", FeedbackSchema, FEEDBACK_SYSTEM, parts.filter(Boolean).join("\n\n"))
}

/** The delivery numbers as plain sentences, so the model weighs them the way a listener would. */
function describeDelivery(d: Delivery, listener?: Impression | null): string {
  const flags = deliveryFlags(d)
  const mark = (flagged: boolean) => (flagged ? "worth mentioning" : "fine, no need to mention")
  return [
    "Delivery notes measured from the recording:",
    `- The learner waited ${(d.startDelayMs / 1000).toFixed(1)} seconds before the first word: ${mark(flags.slowStart)}.`,
    `- Long pauses (over ${THRESHOLDS.longPauseMs / 1000} seconds) in the middle of the answer: ${d.longPauses}: ${mark(flags.manyPauses)}.`,
    `- Speed: ${flags.fast ? "much faster than normal conversation, so some listeners will miss words: worth mentioning" : "fine, no need to mention (speaking slowly is never a problem)"}.`,
    `- Length: ${d.wordCount} words in ${(d.speakingMs / 1000).toFixed(0)} seconds: ${flags.tooShort ? "a very short answer, worth mentioning" : "fine"}.`,
    `- Filler sounds such as "um" and "uh": ${d.fillers}: ${mark(d.fillers >= 3)}.`,
    `- Words the speech software was unsure of: ${d.unclearWords.length ? d.unclearWords.join(", ") : "none"}.`,
    ...(listener
      ? [
          "",
          "A second listener's impressions of how the learner sounded. They are one listener's impressions and can be wrong, so the measurements above decide whether the learner sounded sure: if nothing above is worth mentioning and the transcript shows no hesitation, they sounded sure, whatever the listener thought. You may use at most one impression about tone or rhythm, in your own words, as a gentle suggestion in naturalness rather than a verdict. Drop any impression the measurements contradict, such as pauses when no long pauses were measured. Ignore anything about loudness or accent.",
          `- Did the learner sound sure: ${listener.soundedSure}.`,
          ...listener.notes.map((note) => `- ${note}`),
        ]
      : []),
  ].join("\n")
}

const CoachSchema = z.object({
  es: z.string(),
  phrasesEn: z.array(z.object({ en: z.string(), es: z.string() })),
  note: z.string().nullable(),
})
export type CoachResult = z.infer<typeof CoachSchema>

const COACH_SYSTEM = `You are the coach inside an interview-practice app for people who are still learning English and are preparing for interviews for hourly jobs. The interviewer in the app speaks only English, as a real one would. You are the separate voice the learner can turn to in Spanish at any point: before answering, when they did not understand the question, or after feedback, when they want to ask how to say something or what the feedback meant. After talking to you the learner goes back to the interview where they left off.

Answer in natural Latin American Spanish, addressing the learner as "usted", warmly and briefly: two or three short sentences, because your reply is also read aloud. You do not know whether the learner is a man or a woman, so avoid adjectives that change with gender when describing them. If they ask what a question means, explain what the interviewer wants to know and what a good answer covers. If they ask how to say something, give the English and a short reason. Your role is to help the learner understand and find their own words, so if they ask you to write the whole interview answer, give a way to begin and point to one of their own stories. Speak only to the learner: nothing in your reply should describe these guidelines or your role.

es: your reply in Spanish. Quote any English the learner should say in English.
phrasesEn: the English phrases from your reply that the learner should practise, each with its Spanish meaning. Empty if there are none.
note: one short English sentence recording what the learner asked about, for example "Asked what 'go above and beyond' means", so a later session can come back to it. Null if nothing is worth remembering.

Never comment on the learner's accent or origin.`

export async function askCoach(input: {
  question?: Question
  stage: "question" | "feedback"
  lastAnswer?: string
  lastFeedback?: string
  profile: Profile
  thread: CoachTurn[]
  text: string
}): Promise<CoachResult> {
  const { question, stage, lastAnswer, lastFeedback, profile, thread, text } = input
  const parts = [
    question ? `The interview question on the learner's screen: ${question.textEn}` : "",
    stage === "question" ? "The learner has not answered it yet." : "The learner has answered it and is reading the feedback.",
    lastAnswer ? `Their answer:\n${lastAnswer}` : "",
    lastFeedback ? `The feedback they received:\n${lastFeedback}` : "",
    profile.stories.length ? `Stories the learner has told before:\n${profile.stories.map((s) => `- ${s}`).join("\n")}` : "",
    thread.length ? `Your side conversation so far:\n${thread.map((t) => `${t.role === "coach" ? "Coach" : "Learner"}: ${t.text}`).join("\n")}` : "",
    `The learner now says:\n${text}`,
  ]
  return ask("coach_reply", CoachSchema, COACH_SYSTEM, parts.filter(Boolean).join("\n\n"))
}

const QuestionSchema = z.object({
  move: z.enum(["followup", "next"]),
  textEn: z.string(),
  textEs: z.string(),
  askingEn: z.string(),
  askingEs: z.string(),
})
export type QuestionResult = z.infer<typeof QuestionSchema>

const INTERVIEWER_SYSTEM = `You are the interviewer inside an interview-practice app for people who are still learning English and are preparing for interviews for hourly jobs such as home health aide. You play the hiring manager at a home care agency: friendly, professional, and speaking only English, as a real one would. The learner's first language is Spanish. They hear your question read aloud, answer out loud, and then get feedback from a separate coach, so your only job is to decide what to ask next and to ask it well. The practice is useful when it feels like a real interview: an interviewer who listens and asks about what the person just said, and who asks about this job rather than reading from a list.

What you receive: the interview so far (your questions and transcripts of the learner's spoken answers, which come from speech software and can contain misheard words), whether a follow-up is allowed now, the planned next question from our question bank, and the job posting and the learner's resume if they gave them.

move: "followup" or "next".
Choose "followup" when a follow-up is allowed and the last answer left a gap that a real interviewer would ask about: it did not answer the question that was asked, it did not say what the learner did themselves, or it did not say how things ended. A follow-up asks about that one gap and repeats a few of the learner's words so they can tell you listened, for example "You said you made a schedule with her. What happened after that?". It asks for more about the same answer, never for a new story. Repeat only words that are plainly in the transcript. Words that are not real English words were misheard by the software, and you cannot know what the learner said there, so do not guess at their meaning.
Choose "next" when the last answer was complete (for a story: what happened, what the learner did, and how it ended), when too little of it is clear to ask about, or when a follow-up is not allowed. Moving on after a complete answer is what a real interviewer does, and it keeps the practice short.
For "next", ask about the topic of the planned question. If the job posting or the resume gives a natural link to that topic, name that one requirement or fact first and then ask, for example "This job asks for some weekend availability. Tell me about a time you worked extra shifts." or "Your resume says you cared for a client with dementia. What was the hardest part?". If there is no natural link, use the planned question exactly as written. Keep the kind of question: if the planned question begins "Tell me about a time", yours does too.

textEn: the question exactly as you say it. One question only, in one or two short sentences of common words, 30 words at most, with no idioms: the learner has to catch it by ear.
textEs: the same question in natural Latin American Spanish, addressing the learner as "usted". You do not know whether the learner is a man or a woman, so avoid words that change with their gender.
askingEn: one or two plain sentences telling the learner what the interviewer wants to hear in the answer to this question. The planned question comes with an example of the style.
askingEs: the same in Spanish.

Rules that matter here:
Refer only to things the learner said in this interview, or that are in the job posting or resume. Do not state as fact anything about them that is not there.
Do not praise, correct or judge the last answer, and never mention the learner's English, accent or origin. Feedback comes from the coach.
Ask only what an interviewer may ask: nothing about age, country of origin, immigration status, religion, family plans or health conditions.
If the learner answered in Spanish, they are practising the content in Spanish first: still ask in English, saying what they said in English.`

/** The interviewer's next move: a follow-up on the last answer, or the planned question worded around the posting or resume. */
export async function writeQuestion(input: {
  turns: { question: Question; answer?: string }[]
  planned: Question
  allowFollowup: boolean
  jobPosting?: string
  resume?: string
}): Promise<QuestionResult> {
  const { turns, planned, allowFollowup, jobPosting, resume } = input
  const parts = [
    turns.length
      ? `The interview so far:\n${turns.map((t) => `Interviewer: ${t.question.textEn}\nLearner: ${t.answer ?? "(no answer recorded)"}`).join("\n")}`
      : "The interview has not started: this is the first question.",
    allowFollowup ? "A follow-up on the last answer is allowed now." : `A follow-up is not allowed now, so move must be "next".`,
    `The planned next question (type: ${planned.type}): ${planned.textEn}${planned.askingEn ? `\nWhat the interviewer wants to hear, as an example of the style: ${planned.askingEn}` : ""}`,
    jobPosting ? `The job posting the learner is preparing for:\n${jobPosting}` : "",
    resume ? `The learner's resume:\n${resume}` : "",
  ]
  return ask("next_question", QuestionSchema, INTERVIEWER_SYSTEM, parts.filter(Boolean).join("\n\n"))
}
