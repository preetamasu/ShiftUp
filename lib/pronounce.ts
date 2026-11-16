import { dictionary } from "cmu-pronouncing-dictionary"

// "Sounds like" spellings for English words, written the way a Spanish speaker
// would write the sounds: "medication" becomes "me-da-KEI-shan", with the
// stressed syllable in capitals. Phonetic symbols are exact but most learners
// cannot read them; this is what people write in the margins of their notes.
//
// The sounds come from the CMU Pronouncing Dictionary (American English), so
// this is a lookup, not a guess. The Spanish spelling of each sound is our own
// approximation and should be reviewed by a Spanish speaker.

const VOWELS: Record<string, string> = {
  AA: "a", AE: "a", AH: "a", AO: "o", AW: "au", AY: "ai", EH: "e", ER: "er",
  EY: "ei", IH: "i", IY: "i", OW: "ou", OY: "oi", UH: "u", UW: "u",
}
const CONSONANTS: Record<string, string> = {
  B: "b", CH: "ch", D: "d", DH: "d", F: "f", G: "g", HH: "j", JH: "y", K: "k", L: "l",
  M: "m", N: "n", NG: "ng", P: "p", R: "r", S: "s", SH: "sh", T: "t", TH: "th",
  V: "v", W: "u", Y: "y", Z: "s", ZH: "sh",
}

const isVowel = (p: string) => /\d$/.test(p)
const sound = (p: string) => p.replace(/\d$/, "")

/** Two consonants that begin a syllable together, as in "GRID" or "SKE". */
function startsTogether(a: string, b: string) {
  return (["L", "R", "W", "Y"].includes(b) && ["P", "B", "T", "D", "K", "G", "F", "TH"].includes(a)) || (a === "S" && ["P", "T", "K", "M", "N", "L", "W"].includes(b))
}

/** Turns dictionary phonemes such as "M EH2 D AH0 K EY1 SH AH0 N" into "me-da-KEI-shan". */
export function respell(phonemes: string): string {
  const ps = phonemes.trim().split(/\s+/)
  const vowelAt = ps.flatMap((p, i) => (isVowel(p) ? [i] : []))
  if (vowelAt.length === 0) return ps.map((p) => CONSONANTS[p] ?? "").join("")

  // Cut the word into syllables: consonants between two vowels mostly join the vowel that follows.
  const starts = vowelAt.map((v, n) => {
    if (n === 0) return 0
    const between = v - vowelAt[n - 1] - 1
    const onset = between >= 2 && startsTogether(ps[v - 2], ps[v - 1]) ? 2 : Math.min(between, 1)
    return v - onset
  })
  const stressed = vowelAt.findIndex((v) => ps[v].endsWith("1"))

  const syllables = starts.map((start, n) => {
    const part = ps.slice(start, starts[n + 1] ?? ps.length)
    const text = part
      .map((p, i) => {
        if (isVowel(p)) return VOWELS[sound(p)] ?? ""
        const next = part[i + 1]
        // In Spanish "ge" and "gi" are read with a throaty sound, so a hard g needs "gu".
        if (p === "G" && next && isVowel(next) && /^[ei]/.test(VOWELS[sound(next)] ?? "")) return "gu"
        return CONSONANTS[p] ?? ""
      })
      .join("")
    return vowelAt.length > 1 && n === stressed ? text.toUpperCase() : text
  })
  return syllables.join("-")
}

/** The "sounds like" spelling of one word, or null if the dictionary does not have it. */
export function soundsLike(word: string): string | null {
  const key = word.toLowerCase().replace(/[^a-z']/g, "").replace(/^'+|'+$/g, "")
  if (!key) return null
  const phonemes = dictionary[key] ?? dictionary[key.replace(/'s$/, "")]
  return phonemes ? respell(phonemes) : null
}
