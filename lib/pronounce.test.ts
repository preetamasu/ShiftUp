import { describe, expect, it } from "vitest"
import { respell, soundsLike } from "./pronounce"

describe("respell", () => {
  it("writes the stressed syllable in capitals", () => {
    expect(respell("M EH2 D AH0 K EY1 SH AH0 N")).toBe("me-da-KEI-shan") // medication
    expect(respell("B IH0 K AO1 Z")).toBe("bi-KOS") // because
  })

  it("keeps consonants that start a syllable together", () => {
    expect(respell("S K EH1 JH UH0 L")).toBe("SKE-yul") // schedule
    expect(respell("D IH0 S AH0 G R IY1 D")).toBe("di-sa-GRID") // disagreed
    expect(respell("K L AY1 AH0 N T")).toBe("KLAI-ant") // client
  })

  it("leaves one-syllable words in lower case", () => {
    expect(respell("N ER1 S")).toBe("ners") // nurse
    expect(respell("HH AW1 S")).toBe("jaus") // house
  })

  it("spells a hard g before e or i the Spanish way", () => {
    expect(respell("G EH1 T")).toBe("guet") // get
    expect(respell("G OW1 IH0 NG")).toBe("GOU-ing") // going
  })
})

describe("soundsLike", () => {
  it("looks a word up whatever its capitals or punctuation", () => {
    expect(soundsLike("Medication,")).toBe("me-da-KEI-shan")
    expect(soundsLike("client's")).not.toBeNull()
  })

  it("returns null for words it does not know and for non-words", () => {
    expect(soundsLike("zzxqv")).toBeNull()
    expect(soundsLike("[...]")).toBeNull()
  })
})
