import { configured } from "./config"
import { writeQuestion } from "./llm"
import { pickNextQuestion } from "./questions"
import type { Profile, Question } from "./types"

// Interview sessions live in server memory: enough for a demo on one machine.
export type Session = {
  id: string
  learnerId: string
  /** The name the learner typed, used when writing memories about them. */
  name: string
  role: string
  jobPosting?: string
  /** Her resume as pasted text. Kept for this session only: it is never written to memory. */
  resume?: string
  /** The profile as read at session start, updated as the learner tells new stories. */
  profile: Profile
  asked: Question[]
  /** What she answered, by question id, so the interviewer can follow up on it. */
  answers?: Record<string, string>
}

// Survives hot reloads in development.
const store = ((globalThis as { __sessions?: Map<string, Session> }).__sessions ??= new Map<string, Session>())

export function createSession(input: Omit<Session, "id" | "asked">): Session {
  const id = `s_${new Date().toLocaleDateString("en-CA")}_${Math.random().toString(36).slice(2, 8)}`
  const session: Session = { ...input, id, asked: [] }
  store.set(id, session)
  return session
}

export const getSession = (id: string) => store.get(id)

const WRITE_TIMEOUT_MS = 8000

/**
 * The interviewer's next question. The bank supplies the planned question (a weak spot first).
 * With a language model, the interviewer may instead follow up on her last answer, never twice
 * in a row, or word the planned question around her job posting or resume. If the model fails
 * or is slow, the planned question is asked as written.
 */
export async function nextQuestion(session: Session): Promise<Question> {
  const planned = pickNextQuestion(session.profile.weakSpots, session.asked.map((q) => q.id))
  const last = session.asked.at(-1)
  const allowFollowup = Boolean(last && last.source !== "followup" && session.answers?.[last.id])
  const tailored = Boolean(session.jobPosting || session.resume)

  let question = planned
  if (configured.llm() && (allowFollowup || tailored)) {
    try {
      const written = await Promise.race([
        writeQuestion({
          turns: session.asked.map((q) => ({ question: q, answer: session.answers?.[q.id] })),
          planned,
          allowFollowup,
          jobPosting: session.jobPosting,
          resume: session.resume,
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timed out")), WRITE_TIMEOUT_MS)),
      ])
      const text = { textEn: written.textEn, textEs: written.textEs, askingEn: written.askingEn, askingEs: written.askingEs }
      if (written.move === "followup") {
        if (allowFollowup && last) question = { ...text, id: `${last.id}_f${session.asked.length}`, type: last.type, source: "followup" }
      } else if (tailored) {
        question = { ...planned, ...text, source: "posting" }
      }
    } catch (err) {
      console.warn("The interviewer could not write a question; asking the planned one.", err instanceof Error ? err.message : err)
    }
  }
  session.asked.push(question)
  return question
}

export const findAsked = (session: Session, questionId: string) => session.asked.find((q) => q.id === questionId)
