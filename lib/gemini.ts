import { z } from "zod"

// A second listener. Transcribe gives the words and their timing; Gemini hears
// the recording itself and says whether she sounded sure, and notes hesitation
// and tone. It is an optional layer: if it is slow or fails, the feedback is
// written from the measurements alone.
//
// What it is trusted for comes from testing it on four recordings. It told a
// hesitant answer from a steady one every time. It did not notice a recording
// played at 4% volume or a voice fading out, so it is not asked about loudness.

// The fast model replies in about 2.5 seconds, inside the time Transcribe takes
// anyway. The larger gemini-4-hydrogen took about 5 seconds.
const MODEL = "gemini-3.5-flash-lite"
const TIME_LIMIT_MS = 4000

const Impression = z.object({
  notes: z.array(z.string()).max(3),
  soundedSure: z.enum(["yes", "somewhat", "no", "unclear"]),
})
export type Impression = z.infer<typeof Impression>

const PROMPT = `This is a recording of a person who is learning English, answering a job-interview question out loud. Listen to how the speaker sounds, not to what they say. Give up to three short notes, under 20 words each, about the delivery that a transcript would not show: hesitating or halting, rushing, stopping mid-sentence, a flat voice or a lively one, sounding as if reading or reciting. Begin each note with "The speaker". Only note what you actually hear. If the delivery is ordinary, give fewer notes or none. Do not judge how loud the speaker is, because recordings vary. Do not comment on their accent, where they are from, or how native they sound. Also say whether the speaker sounded sure.`

/** Wraps 16 kHz mono 16-bit PCM in a WAV header. */
function wav(pcm: Uint8Array): Buffer {
  const header = Buffer.alloc(44)
  header.write("RIFF", 0)
  header.writeUInt32LE(36 + pcm.length, 4)
  header.write("WAVEfmt ", 8)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(16000, 24)
  header.writeUInt32LE(32000, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write("data", 36)
  header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

/** Never throws: returns null when Gemini is unavailable, too slow, or replies with something unusable. */
export async function listen(pcm: Uint8Array): Promise<Impression | null> {
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY ?? "", "Content-Type": "application/json", "Api-Revision": "2026-05-20" },
      body: JSON.stringify({
        model: MODEL,
        input: [
          { type: "text", text: PROMPT },
          { type: "audio", data: wav(pcm).toString("base64"), mime_type: "audio/wav" },
        ],
        response_format: { type: "text", mime_type: "application/json", schema: z.toJSONSchema(Impression) },
      }),
      signal: AbortSignal.timeout(TIME_LIMIT_MS),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
    // The reply is a list of steps; the answer is the text inside the "model_output" step.
    const data = (await res.json()) as { steps?: { type: string; content?: { type: string; text?: string }[] }[] }
    const text = (data.steps ?? [])
      .filter((step) => step.type === "model_output")
      .flatMap((step) => step.content ?? [])
      .map((part) => part.text ?? "")
      .join("")
    return Impression.parse(JSON.parse(text))
  } catch (err) {
    console.warn("Gemini listening skipped:", err instanceof Error ? err.message : err)
    return null
  }
}
