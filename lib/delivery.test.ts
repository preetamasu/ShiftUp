import { describe, expect, it } from "vitest"
import { analyseDelivery, deliveryFlags } from "./delivery"
import type { Word } from "./types"

/** Builds words of a fixed length with a fixed gap between them. */
function speak(texts: string[], opts: { startMs?: number; wordMs?: number; gapMs?: number; confidence?: number } = {}): Word[] {
  const { startMs = 500, wordMs = 300, gapMs = 100, confidence = 0.95 } = opts
  let t = startMs
  return texts.map((text) => {
    const w = { text, startMs: t, endMs: t + wordMs, confidence }
    t += wordMs + gapMs
    return w
  })
}

describe("analyseDelivery", () => {
  it("returns zeros for an empty answer", () => {
    expect(analyseDelivery([])).toEqual({ paceWpm: 0, startDelayMs: 0, longPauses: 0, speakingMs: 0, wordCount: 0, fillers: 0, unclearWords: [] })
  })

  it("measures start delay, speaking time and pace", () => {
    // 10 words, 300ms each with 100ms gaps: 3900ms of speaking
    const d = analyseDelivery(speak(Array(10).fill("word"), { startMs: 6000 }))
    expect(d.startDelayMs).toBe(6000)
    expect(d.speakingMs).toBe(3900)
    expect(d.paceWpm).toBe(154)
  })

  it("counts only gaps longer than 1.5 seconds as long pauses", () => {
    const words = speak(["one", "two", "three", "four"])
    words[2].startMs += 2000
    words[2].endMs += 2000
    words[3].startMs += 2000
    words[3].endMs += 2000
    expect(analyseDelivery(words).longPauses).toBe(1)
  })

  it("lists low-confidence content words, lowest first, and skips function words", () => {
    const words = speak(["I", "gave", "the", "medication", "on", "schedule"])
    words[0].confidence = 0.2 // function word: ignored
    words[3].confidence = 0.41
    words[5].confidence = 0.55
    expect(analyseDelivery(words).unclearWords).toEqual(["medication", "schedule"])
  })

  it("tells a rushed answer from a halting one", () => {
    const rushed = analyseDelivery(speak(Array(40).fill("word"), { wordMs: 150, gapMs: 30 }))
    const halting = analyseDelivery(speak(Array(12).fill("word"), { startMs: 6500, gapMs: 1800 }))
    expect(deliveryFlags(rushed)).toMatchObject({ fast: true, slowStart: false, manyPauses: false })
    expect(deliveryFlags(halting)).toMatchObject({ fast: false, slowStart: true, manyPauses: true })
  })

  it("counts filler sounds", () => {
    const d = analyseDelivery(speak(["Um,", "I", "want", "uh", "this", "job"]))
    expect(d.fillers).toBe(2)
    expect(d.wordCount).toBe(6)
  })

  it("calls an answer too short by its words, not its seconds", () => {
    const fewWords = analyseDelivery(speak(Array(6).fill("word"), { wordMs: 900, gapMs: 900 }))
    const fastButFull = analyseDelivery(speak(Array(45).fill("word"), { wordMs: 100, gapMs: 30 }))
    expect(deliveryFlags(fewWords).tooShort).toBe(true)
    expect(deliveryFlags(fastButFull).tooShort).toBe(false)
  })

  it("never flags slow speech", () => {
    const slow = analyseDelivery(speak(Array(30).fill("word"), { wordMs: 500, gapMs: 400 }))
    expect(deliveryFlags(slow)).toEqual({ slowStart: false, fast: false, manyPauses: false, tooShort: false })
  })
})
