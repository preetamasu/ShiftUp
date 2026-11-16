import bank from "../data/questions.hha.json"
import { QUESTION_TYPES, type Question, type QuestionType } from "./types"

export const QUESTION_BANK = bank as Question[]

const isType = (s: string): s is QuestionType => (QUESTION_TYPES as readonly string[]).includes(s)

/**
 * Picks the next question: a type she struggled with before comes first, then the
 * rest of the bank in order. When every question has been asked, it starts again.
 */
export function pickNextQuestion(weakSpots: string[], askedIds: string[], questions: Question[] = QUESTION_BANK): Question {
  let unasked = questions.filter((q) => !askedIds.includes(q.id))
  if (unasked.length === 0) unasked = questions

  for (const spot of weakSpots.filter(isType)) {
    const match = unasked.find((q) => q.type === spot)
    if (match) return match
  }
  return unasked[0]
}
