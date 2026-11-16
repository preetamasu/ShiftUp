import { readJson, removeJson, writeJson } from "./localStore"
import type { Delivery, SessionSummary } from "./types"

// One row per answer. The progress view compares her only with her own earlier sessions.
export type AnswerRow = {
  sessionId: string
  date: string // YYYY-MM-DD
  startDelayMs: number
  longPauses: number
  paceWpm: number
  weakSpot: string | null
}

const key = (learnerId: string) => `sessions_${learnerId}`

export async function logAnswer(learnerId: string, sessionId: string, delivery: Delivery, weakSpot: string | null): Promise<void> {
  const rows = await readJson<AnswerRow[]>(key(learnerId), [])
  rows.push({
    sessionId,
    date: new Date().toLocaleDateString("en-CA"), // YYYY-MM-DD in local time, not UTC
    startDelayMs: delivery.startDelayMs,
    longPauses: delivery.longPauses,
    paceWpm: delivery.paceWpm,
    weakSpot,
  })
  await writeJson(key(learnerId), rows)
}

export function summarise(rows: AnswerRow[]): SessionSummary[] {
  const bySession = new Map<string, AnswerRow[]>()
  for (const row of rows) bySession.set(row.sessionId, [...(bySession.get(row.sessionId) ?? []), row])

  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  return [...bySession.entries()]
    .map(([sessionId, answers]) => ({
      sessionId,
      date: answers[0].date,
      answers: answers.length,
      avgStartDelayMs: Math.round(mean(answers.map((a) => a.startDelayMs))),
      longPausesPerAnswer: Math.round(mean(answers.map((a) => a.longPauses)) * 10) / 10,
      paceWpm: Math.round(mean(answers.map((a) => a.paceWpm))),
      weakSpots: [...new Set(answers.map((a) => a.weakSpot).filter((w): w is string => Boolean(w)))],
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getProgress(learnerId: string): Promise<SessionSummary[]> {
  return summarise(await readJson<AnswerRow[]>(key(learnerId), []))
}

export async function setLog(learnerId: string, rows: AnswerRow[]): Promise<void> {
  await writeJson(key(learnerId), rows)
}

export async function clearLog(learnerId: string): Promise<void> {
  await removeJson(key(learnerId))
}
