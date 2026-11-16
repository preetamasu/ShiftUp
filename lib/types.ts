// The API contract shared by the screen and the server. See ARCHITECTURE.md.

export const QUESTION_TYPES = [
  "conflict",
  "reliability",
  "client_care",
  "safety_physical",
  "why_this_job",
  "availability",
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

export type Question = {
  id: string
  type: QuestionType
  source: "bank" | "posting" | "followup"
  textEn: string
  textEs: string
  /** One line on what the interviewer wants to hear, shown when she asks. Written by hand for the bank. */
  askingEn?: string
  askingEs?: string
}

export type Profile = {
  /** Real work stories she has told. */
  stories: string[]
  /** Question types (and habits) to come back to, most recent first. */
  weakSpots: string[]
  /** What Supermemory remembers about her struggles, as sentences. Absent without a Supermemory key. */
  remembered?: string[]
}

export type Language = "en-US" | "es-US"
export type Bilingual = { es: string; en: string }

// POST /api/session/start
export type SessionStartRequest = { learnerId: string; name?: string; role: string; jobPosting?: string; resume?: string }
export type SessionStartResponse = { sessionId: string; profile: Profile; question: Question }

// POST /api/question/next
export type NextQuestionRequest = { sessionId: string }
export type NextQuestionResponse = { question: Question }

// POST /api/speak
export type TimedMark = { timeMs: number; value: string }
export type SpeakRequest = { text: string; speed?: "normal" | "slow" | "x-slow"; language?: Language }
export type SpeakResponse = {
  audioBase64: string
  audioMime: string
  visemes: TimedMark[]
  words: TimedMark[]
  fake?: boolean
}

// POST /api/answer
export type Word = { text: string; startMs: number; endMs: number; confidence: number }
export type Delivery = {
  paceWpm: number
  startDelayMs: number
  longPauses: number
  speakingMs: number
  /** How many words she said. */
  wordCount: number
  /** How many filler sounds (um, uh) were heard. */
  fillers: number
  unclearWords: string[]
}
export type ContentFeedback = {
  /** The answer went the wrong way: it did not answer the question, or it would count against her. `fix` then says so. */
  wrongWay?: boolean
  good: Bilingual
  fix: Bilingual
  sampleAnswerEn: string
  usedDetails: string[]
}
export type PractiseNext = Bilingual & { kind: "word" | "start" | "pace" | "phrase"; word?: string }
export type DeliveryFeedback = {
  clarity: Bilingual
  confidence: Bilingual
  naturalness: Bilingual
  practiseNext: PractiseNext
}
export type Feedback = { content: ContentFeedback; delivery?: DeliveryFeedback }
export type AnswerResponse = {
  transcript: string
  words: Word[]
  delivery?: Delivery
  feedback: Feedback
  weakSpot: QuestionType | null
  /** What Gemini heard in the recording. Passed to the feedback writer; not shown to her as it is. */
  listener?: { notes: string[]; soundedSure: "yes" | "somewhat" | "no" | "unclear" }
  fake?: boolean
}

/** Sent instead of feedback when she asked the interviewer to say the question again. */
export type RepeatResponse = { repeat: true; transcript: string }

// POST /api/coach
export type CoachTurn = { role: "learner" | "coach"; text: string }
export type CoachResponse = {
  heard: string
  reply: { es: string; phrasesEn: { en: string; es: string }[] }
  audioBase64?: string
  audioMime?: string
  visemes?: TimedMark[]
  fake?: boolean
}

// GET /api/progress
export type SessionSummary = {
  sessionId: string
  date: string
  answers: number
  avgStartDelayMs: number
  longPausesPerAnswer: number
  paceWpm: number
  weakSpots: string[]
}
export type ProgressResponse = { sessions: SessionSummary[] }
