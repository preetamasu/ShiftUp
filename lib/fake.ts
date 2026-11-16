import type { CoachResponse, Feedback, SpeakResponse, TimedMark, Word } from "./types"

// Stand-ins used while a service has no key. Every fake response carries `fake: true`.

/** Silent audio of the right length with plausible mouth and word timings, so the face can be built before Polly is connected. */
export function fakeSpeak(text: string): SpeakResponse {
  const tokens = text.split(/\s+/).filter(Boolean)
  const mouths = ["p", "a", "t", "i", "s", "o", "f", "E", "k", "u"]
  const words: TimedMark[] = []
  const visemes: TimedMark[] = []
  let t = 0
  tokens.forEach((token, n) => {
    words.push({ timeMs: t, value: token })
    const shapes = Math.max(2, Math.ceil(token.length / 2))
    for (let i = 0; i < shapes; i++) visemes.push({ timeMs: t + i * 90, value: mouths[(n + i) % mouths.length] })
    t += shapes * 90 + 60
  })
  visemes.push({ timeMs: t, value: "sil" })
  return { audioBase64: silentWav(t + 200), audioMime: "audio/wav", visemes, words, fake: true }
}

/** A 16 kHz mono 16-bit WAV of silence, base64-encoded. */
function silentWav(ms: number): string {
  const sampleRate = 16000
  const dataBytes = Math.round((ms / 1000) * sampleRate) * 2
  const buf = Buffer.alloc(44 + dataBytes)
  buf.write("RIFF", 0)
  buf.writeUInt32LE(36 + dataBytes, 4)
  buf.write("WAVEfmt ", 8)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20) // PCM
  buf.writeUInt16LE(1, 22) // mono
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(sampleRate * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write("data", 36)
  buf.writeUInt32LE(dataBytes, 40)
  return buf.toString("base64")
}

export const FAKE_TRANSCRIPT = "I talk with her and we make a schedule for the medication."

/** Word timings for the fake transcript: a slow start, one long pause, two low-confidence words. */
export const FAKE_WORDS: Word[] = [
  { text: "I", startMs: 6100, endMs: 6250, confidence: 0.98 },
  { text: "talk", startMs: 6300, endMs: 6650, confidence: 0.93 },
  { text: "with", startMs: 6700, endMs: 6900, confidence: 0.97 },
  { text: "her", startMs: 6950, endMs: 7200, confidence: 0.95 },
  { text: "and", startMs: 9100, endMs: 9300, confidence: 0.96 },
  { text: "we", startMs: 9350, endMs: 9500, confidence: 0.97 },
  { text: "make", startMs: 9550, endMs: 9900, confidence: 0.91 },
  { text: "a", startMs: 9950, endMs: 10050, confidence: 0.99 },
  { text: "schedule", startMs: 10100, endMs: 10800, confidence: 0.52 },
  { text: "for", startMs: 10850, endMs: 11050, confidence: 0.96 },
  { text: "the", startMs: 11100, endMs: 11250, confidence: 0.98 },
  { text: "medication", startMs: 11300, endMs: 12100, confidence: 0.41 },
]

export const FAKE_FEEDBACK: Required<Feedback> = {
  content: {
    good: {
      es: "Explicó lo que hizo: habló con ella y juntas hicieron un horario.",
      en: "You explained what you did: you talked with her and made a schedule together.",
    },
    fix: {
      es: "Diga también qué pasó después. ¿Tomó ella sus medicamentos?",
      en: "Also say what happened next. Did she take her medication?",
    },
    sampleAnswerEn:
      "My client did not want to take her medication. I talked with her, and we made a schedule together. After that, she took it every day.",
    usedDetails: ["talked with her", "made a schedule for the medication"],
  },
  delivery: {
    clarity: {
      es: "El programa no captó bien dos palabras: 'schedule' y 'medication'.",
      en: "The software didn't catch two words well: 'schedule' and 'medication'.",
    },
    confidence: {
      es: "Esperó seis segundos antes de empezar. Puede empezar con 'In my last job…' mientras piensa.",
      en: "You waited six seconds before starting. You can begin with 'In my last job…' while you think.",
    },
    naturalness: {
      es: "'I talk with her' suena más natural como 'I talked with her', porque ya pasó.",
      en: "'I talk with her' sounds more natural as 'I talked with her', because it already happened.",
    },
    practiseNext: {
      kind: "word",
      word: "medication",
      es: "Mire la boca y repita 'medication' despacio.",
      en: "Watch the mouth and repeat 'medication' slowly.",
    },
  },
}

export function fakeCoach(heard: string): CoachResponse {
  return {
    heard: heard || "¿Qué significa 'go above and beyond'?",
    reply: {
      es: "Significa hacer más de lo que le piden. Le están preguntando por una vez que usted hizo algo extra por un cliente.",
      phrasesEn: [{ en: "go above and beyond", es: "hacer más de lo esperado" }],
    },
    fake: true,
  }
}
