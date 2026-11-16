import type { Delivery, Word } from "./types"

// Starting points, not tested on real answers yet. Keep them generous:
// pausing to find a word in a second language is normal.
export const THRESHOLDS = {
  slowStartMs: 4000,
  // Polly's own voice at normal speed measures about 225 to 245 words a minute here,
  // so a lower bar would call ordinary speech rushed.
  fastWpm: 250,
  longPauseMs: 1500,
  manyPauses: 3,
  tooShortWords: 12,
  unclearConfidence: 0.6,
  maxUnclearCandidates: 5,
}

const FUNCTION_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "so", "to", "of", "in", "on", "at", "for", "with",
  "i", "me", "my", "we", "you", "he", "she", "it", "they", "her", "him", "them", "is", "am",
  "are", "was", "were", "be", "do", "did", "have", "had", "that", "this", "um", "uh",
])

const FILLERS = new Set(["um", "uh", "er", "erm", "eh", "hmm", "mm", "ah"])

const clean = (text: string) => text.toLowerCase().replace(/[^a-z']/g, "")

/** Turns Transcribe's word timings into delivery numbers. Times are measured from the start of the recording. */
export function analyseDelivery(words: Word[]): Delivery {
  if (words.length === 0) {
    return { paceWpm: 0, startDelayMs: 0, longPauses: 0, speakingMs: 0, wordCount: 0, fillers: 0, unclearWords: [] }
  }
  const first = words[0]
  const last = words[words.length - 1]
  const speakingMs = Math.max(0, last.endMs - first.startMs)

  let longPauses = 0
  for (let i = 1; i < words.length; i++) {
    if (words[i].startMs - words[i - 1].endMs > THRESHOLDS.longPauseMs) longPauses++
  }

  // Candidates only. The feedback model keeps at most two that matter to the answer,
  // and they are shown as words to practise, never as a score.
  const unclear = new Map<string, number>()
  for (const w of words) {
    const text = clean(w.text)
    if (text.length < 3 || FUNCTION_WORDS.has(text)) continue
    if (w.confidence >= THRESHOLDS.unclearConfidence) continue
    unclear.set(text, Math.min(w.confidence, unclear.get(text) ?? 1))
  }
  const unclearWords = [...unclear.entries()]
    .sort((a, b) => a[1] - b[1])
    .slice(0, THRESHOLDS.maxUnclearCandidates)
    .map(([text]) => text)

  return {
    paceWpm: speakingMs > 0 ? Math.round((words.length / speakingMs) * 60000) : 0,
    startDelayMs: first.startMs,
    longPauses,
    speakingMs,
    wordCount: words.length,
    fillers: words.filter((w) => FILLERS.has(clean(w.text))).length,
    unclearWords,
  }
}

/** Which numbers are worth mentioning. Slow speech is never flagged. */
export function deliveryFlags(d: Delivery) {
  return {
    slowStart: d.startDelayMs > THRESHOLDS.slowStartMs,
    fast: d.paceWpm > THRESHOLDS.fastWpm,
    manyPauses: d.longPauses >= THRESHOLDS.manyPauses,
    // Judged by how much she said, not how long it took: a fast talker can say plenty in a few seconds.
    tooShort: d.wordCount > 0 && d.wordCount < THRESHOLDS.tooShortWords,
  }
}
