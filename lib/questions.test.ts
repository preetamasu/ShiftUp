import { describe, expect, it } from "vitest"
import { pickNextQuestion, QUESTION_BANK } from "./questions"
import { QUESTION_TYPES } from "./types"

describe("question bank", () => {
  it("has unique ids, a known type, and both languages on every question", () => {
    expect(new Set(QUESTION_BANK.map((q) => q.id)).size).toBe(QUESTION_BANK.length)
    for (const q of QUESTION_BANK) {
      expect(QUESTION_TYPES).toContain(q.type)
      expect(q.textEn.length).toBeGreaterThan(10)
      expect(q.textEs.length).toBeGreaterThan(10)
    }
  })

  it("covers every question type", () => {
    for (const type of QUESTION_TYPES) {
      expect(QUESTION_BANK.some((q) => q.type === type)).toBe(true)
    }
  })
})

describe("pickNextQuestion", () => {
  it("starts with the first bank question when there are no weak spots", () => {
    expect(pickNextQuestion([], []).id).toBe(QUESTION_BANK[0].id)
  })

  it("asks a weak-spot type first", () => {
    expect(pickNextQuestion(["conflict"], []).type).toBe("conflict")
  })

  it("ignores weak spots that are not question types", () => {
    expect(pickNextQuestion(["long pauses"], []).id).toBe(QUESTION_BANK[0].id)
  })

  it("does not repeat a question until the bank is used up, then starts again", () => {
    const asked: string[] = []
    for (let i = 0; i < QUESTION_BANK.length; i++) {
      const q = pickNextQuestion(["conflict"], asked)
      expect(asked).not.toContain(q.id)
      asked.push(q.id)
    }
    expect(pickNextQuestion(["conflict"], asked).type).toBe("conflict")
  })
})
