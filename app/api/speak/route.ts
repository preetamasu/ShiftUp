import { configured } from "@/lib/config"
import { fakeSpeak } from "@/lib/fake"
import { speak, type Speed } from "@/lib/polly"
import type { SpeakRequest } from "@/lib/types"

const SPEEDS: Speed[] = ["normal", "slow", "x-slow"]

// Returns the audio for a line of speech plus the timing of each mouth shape and word.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Partial<SpeakRequest> | null
  if (!body?.text) return Response.json({ error: "text is required" }, { status: 400 })
  if (!configured.aws()) return Response.json(fakeSpeak(body.text))

  const speed = SPEEDS.includes(body.speed as Speed) ? (body.speed as Speed) : "normal"
  const language = body.language === "es-US" ? "es-US" : "en-US"
  try {
    return Response.json(await speak(body.text, speed, language))
  } catch (err) {
    // The screen falls back to showing the caption without a voice.
    const message = err instanceof Error ? `${err.name}: ${err.message}` : "speech failed"
    return Response.json({ error: "speech_unavailable", message }, { status: 502 })
  }
}
