// Spotting when the learner, instead of answering, asks the interviewer to say
// the question again. Asking is the right move in a real interview, so the app
// treats it as one: the interviewer repeats the question slowly and no feedback
// is written.
//
// The patterns are strict on purpose. Mistaking a real answer for a request
// would throw the answer away, so each one needs the shape of a request (a "you"
// question, a "please", or nothing else in the sentence), not just the words.

const NOT = "(?:do not|don't|dont|did not|didn't|didnt|could not|couldn't|cannot|can't)"

const ENGLISH = [
  // "Could you say that again more slowly?", "Can you repeat the question?", "Can you explain the question?"
  /\b(?:can|could|would|will|may) you\b.{0,40}\b(?:repeat|again|slow|slower|slowly|one more time|once more|rephrase|explain)\b/,
  // "Repeat, please.", "Sorry, say that again?", "One more time."
  /^(?:(?:i'm |i am )?(?:sorry|excuse me|pardon)[, ]+)?(?:please )?(?:repeat|say (?:that|it) again|come again|one more time|once more)\b/,
  // "More slowly, please.", "Again, please."
  /\b(?:slower|more slowly|slow down|slowly|again|one more time|once more|repeat)[, ]*please\b/,
  /\bplease[, ]*(?:repeat|say (?:that|it) again|speak (?:more )?slowly|slow down|go slower)\b/,
  /\brepeat the question\b/,
  // "I didn't understand.", "I don't understand the question.", "Sorry, I didn't catch that."
  new RegExp(`\\b${NOT}\\s+(?:quite\\s+|really\\s+)?(?:understand|understood|catch|hear)(?:\\s+(?:you|that|the question|your question|what you (?:said|mean|are asking))\\b|\\s*[.?!,]|\\s*$)`),
  /\bwhat (?:do|did) you (?:mean|say)\b/,
  /\bwhat does (?:that|it|this) mean\b/,
  // "Pardon?", "Sorry?"
  /^(?:pardon|sorry|excuse me|what|come again|huh)[.?! ]*$/,
]

// In "answer in Spanish first" mode she will ask in Spanish.
const SPANISH = [
  /\b(?:puede|podr[ií]a)\b.{0,30}\b(?:repetir|repetirlo|decirlo|hablar)\b/,
  /^(?:(?:perd[oó]n|disculpe)[, ]+)?(?:rep[ií]ta|rep[ií]talo|repite)\b/,
  /(?:otra vez|m[aá]s despacio|m[aá]s lento|repita)[, ]*por favor/,
  /por favor[, ]*(?:repita|otra vez|m[aá]s despacio|m[aá]s lento)/,
  /\bno (?:le |la |lo )?(?:entend[ií]|entiendo|comprend[ií]|comprendo)(?:\s+(?:la pregunta|bien))?\s*(?:[.?!,]|$)/,
  /^(?:c[oó]mo|perd[oó]n)[.?! ]*$/,
]

/** A request to repeat is short. A longer answer that happens to contain one is an answer. */
const MAX_WORDS = 16

export function asksToRepeat(transcript: string): boolean {
  const said = transcript
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[¿¡]/g, "")
    .replace(/\s+/g, " ")
    .trim()
  if (!said || said.split(" ").length > MAX_WORDS) return false
  return [...ENGLISH, ...SPANISH].some((pattern) => pattern.test(said))
}
