import { PollyClient, SynthesizeSpeechCommand, type Engine, type SynthesizeSpeechCommandInput } from "@aws-sdk/client-polly"
import type { Language, SpeakResponse, TimedMark } from "./types"

// Voice out. Polly returns the audio and, in a second call, the timing of each
// mouth shape and word ("speech marks"). Both calls must use the same voice and
// text or the mouth drifts out of sync.

const VOICES: Record<Language, string> = { "en-US": "Joanna", "es-US": "Lupe" }
const RATES = { normal: undefined, slow: "slow", "x-slow": "x-slow" } as const
export type Speed = keyof typeof RATES

let client: PollyClient | undefined
const polly = () => (client ??= new PollyClient({})) // region and keys come from the environment

// Neural voices sound more natural but are not offered in every region
// (us-east-2, for one). Start with neural and drop to standard if the region refuses it.
let engine: Engine = "neural"

const cache = ((globalThis as { __speech?: Map<string, SpeakResponse> }).__speech ??= new Map<string, SpeakResponse>())

const escapeXml = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!)

async function synthesize(input: SynthesizeSpeechCommandInput): Promise<Buffer> {
  const res = await polly().send(new SynthesizeSpeechCommand(input))
  if (!res.AudioStream) throw new Error("Polly returned no audio")
  return Buffer.from(await res.AudioStream.transformToByteArray())
}

async function speakWith(chosen: Engine, text: string, speed: Speed, language: Language): Promise<SpeakResponse> {
  const rate = RATES[speed]
  const base: SynthesizeSpeechCommandInput = {
    Engine: chosen,
    VoiceId: VOICES[language] as SynthesizeSpeechCommandInput["VoiceId"],
    OutputFormat: "mp3",
    ...(rate
      ? { TextType: "ssml", Text: `<speak><prosody rate="${rate}">${escapeXml(text)}</prosody></speak>` }
      : { TextType: "text", Text: text }),
  }
  const [audio, marks] = await Promise.all([
    synthesize(base),
    synthesize({ ...base, OutputFormat: "json", SpeechMarkTypes: ["viseme", "word"] }),
  ])

  // Speech marks arrive as one JSON object per line.
  const visemes: TimedMark[] = []
  const words: TimedMark[] = []
  for (const line of marks.toString("utf8").split("\n")) {
    if (!line.trim()) continue
    const mark = JSON.parse(line) as { time: number; type: string; value: string }
    if (mark.type === "viseme") visemes.push({ timeMs: mark.time, value: mark.value })
    else if (mark.type === "word") words.push({ timeMs: mark.time, value: mark.value })
  }
  return { audioBase64: audio.toString("base64"), audioMime: "audio/mpeg", visemes, words }
}

export async function speak(text: string, speed: Speed = "normal", language: Language = "en-US"): Promise<SpeakResponse> {
  const key = `${language}|${speed}|${text}`
  const cached = cache.get(key)
  if (cached) return cached

  let result: SpeakResponse
  try {
    result = await speakWith(engine, text, speed, language)
  } catch (err) {
    const unsupported = engine === "neural" && err instanceof Error && err.name === "ValidationException" && /engine/i.test(err.message)
    if (!unsupported) throw err
    engine = "standard"
    result = await speakWith(engine, text, speed, language)
  }
  cache.set(key, result)
  return result
}

/** 16 kHz mono 16-bit PCM of a line of speech. Used by scripts to make test recordings. */
export async function speakPcm(text: string, language: Language = "en-US"): Promise<Buffer> {
  return synthesize({ Engine: "standard", VoiceId: VOICES[language] as SynthesizeSpeechCommandInput["VoiceId"], OutputFormat: "pcm", SampleRate: "16000", Text: text })
}
