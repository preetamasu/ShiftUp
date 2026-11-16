import type {
  AnswerResponse,
  CoachResponse,
  CoachTurn,
  Language,
  NextQuestionResponse,
  RepeatResponse,
  ProgressResponse,
  SessionStartRequest,
  SessionStartResponse,
  SpeakRequest,
  SpeakResponse,
} from "@/lib/types"

/** A failed API call. `body` carries whatever the server sent, such as the transcript when only the feedback step failed. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public body: Record<string, unknown>,
  ) {
    super(typeof body.message === "string" ? body.message : typeof body.error === "string" ? body.error : `Request failed (${status})`)
  }
}

async function send<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init)
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) throw new ApiError(res.status, body)
  return body as T
}
const json = (body: unknown): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
const form = (fields: Record<string, string | Blob | undefined>): RequestInit => {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) if (value !== undefined) data.set(key, value)
  return { method: "POST", body: data }
}

export const api = {
  startSession: (body: SessionStartRequest) => send<SessionStartResponse>("/api/session/start", json(body)),
  nextQuestion: (sessionId: string) => send<NextQuestionResponse>("/api/question/next", json({ sessionId })),
  speak: (body: SpeakRequest) => send<SpeakResponse>("/api/speak", json(body)),
  answer: (fields: { sessionId: string; questionId: string; language: Language; audio?: Blob; transcript?: string }) =>
    send<AnswerResponse | RepeatResponse>("/api/answer", form(fields)),
  coach: (fields: { sessionId: string; questionId: string; stage: "question" | "feedback"; text?: string; audio?: Blob; thread: CoachTurn[]; lastAnswer?: string; lastFeedback?: string }) =>
    send<CoachResponse>("/api/coach", form({ ...fields, thread: JSON.stringify(fields.thread) })),
  readResume: (file: File) => send<{ text: string }>("/api/resume", form({ file })),
  seed: (body: { learnerId: string; name: string }) => send<{ ok: boolean; learnerId: string; jobPosting: string; memory: string }>("/api/demo/seed", json(body)),
  progress: (learnerId: string) => send<ProgressResponse>(`/api/progress?learnerId=${encodeURIComponent(learnerId)}`),
}

/** What the setup page hands to the interview page. */
export type Setup = { learnerId: string; name: string; role: string; jobPosting?: string; resume?: string; spanishFirst: boolean }
const SETUP_KEY = "ipl.setup"
export const saveSetup = (setup: Setup) => sessionStorage.setItem(SETUP_KEY, JSON.stringify(setup))
export function loadSetup(): Setup {
  try {
    const raw = sessionStorage.getItem(SETUP_KEY)
    const saved = raw ? (JSON.parse(raw) as Setup) : null
    if (saved && saved.name !== OLD_DEFAULT_NAME) return saved
  } catch {
    // fall through to the default
  }
  const name = loadName()
  return { learnerId: learnerIdFor(name), name, role: "home_health_aide", spanishFirst: false }
}

// The learner's name is kept in this browser so they are recognised next time.
// Memory is stored under the name, so the same name on another device finds it too.
export const DEFAULT_NAME = "Jaciel"
// The default was first misspelt "Haciel". A browser that saved the old default gets the new one.
const OLD_DEFAULT_NAME = "Haciel"
const NAME_KEY = "ipl.name"
export function loadName(): string {
  try {
    const saved = localStorage.getItem(NAME_KEY)?.trim()
    return saved && saved !== OLD_DEFAULT_NAME ? saved : DEFAULT_NAME
  } catch {
    return DEFAULT_NAME
  }
}
export const saveName = (name: string) => localStorage.setItem(NAME_KEY, name.trim())
/** "Ana María" becomes "ana-maria": the key her memory and progress are stored under. */
export const learnerIdFor = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "guest"
