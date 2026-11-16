import { describe, expect, it } from "vitest"
import { asksToRepeat } from "./rescue"

describe("asksToRepeat", () => {
  it.each([
    "Could you say that again more slowly?",
    "Can you repeat the question, please?",
    "Sorry, I didn't understand. Can you repeat?",
    "I'm sorry, could you please say that again a little more slowly?",
    "Repeat, please.",
    "Sorry, I didn't catch that.",
    "One more time, please.",
    "More slowly, please.",
    "Pardon?",
    "I don't understand the question.",
    "What does that mean?",
    "Can you explain the question?",
    "¿Puede repetir la pregunta, por favor?",
    "Más despacio, por favor.",
    "No entendí la pregunta.",
  ])("hears a request to repeat in: %s", (said) => {
    expect(asksToRepeat(said)).toBe(true)
  })

  // Real answers that use the same words. Mistaking one for a request would throw her answer away.
  it.each([
    "I talked with her in private and we found a solution together.",
    "I move the client more slowly and carefully.",
    "If she does not hear me, I say it again slowly.",
    "I repeat the instructions again and I write a schedule.",
    "I was late one time because I didn't hear the alarm.",
    "I didn't understand the family at first, so I asked them to explain.",
    "I ask the client to please walk slowly.",
    "Le repito las instrucciones otra vez y hago un horario.",
    "No entendí a la familia al principio.",
    "",
  ])("treats this as an answer: %s", (said) => {
    expect(asksToRepeat(said)).toBe(false)
  })

  it("treats a long answer as an answer, even when it quotes the request", () => {
    const said = "When the client's daughter spoke too fast I asked her, could you say that again more slowly, and then I wrote it down for the nurse."
    expect(asksToRepeat(said)).toBe(false)
  })
})
