import { StartStreamTranscriptionCommand, TranscribeStreamingClient } from "@aws-sdk/client-transcribe-streaming"
import type { Language, Word } from "./types"

// Voice in. The streaming interface takes 16 kHz mono 16-bit PCM and returns each
// word with its start time, end time and a confidence from 0 to 1.
//
// NOT YET VERIFIED END TO END: our AWS account currently answers every Transcribe
// call with SubscriptionRequiredException, so the response handling below (in
// particular that item times are in seconds) has not been checked on real output.

let client: TranscribeStreamingClient | undefined
const transcribeClient = () => (client ??= new TranscribeStreamingClient({})) // region and keys come from the environment

const CHUNK_BYTES = 6400 // 200 ms of 16 kHz 16-bit mono

/** True when the AWS account has not been given access to Transcribe (new accounts on the free plan). */
export const isNotSubscribed = (err: unknown) => err instanceof Error && err.name === "SubscriptionRequiredException"

export async function transcribe(pcm: Uint8Array, language: Language): Promise<{ transcript: string; words: Word[] }> {
  async function* audio() {
    for (let i = 0; i < pcm.length; i += CHUNK_BYTES) {
      yield { AudioEvent: { AudioChunk: pcm.subarray(i, i + CHUNK_BYTES) } }
    }
  }
  const response = await transcribeClient().send(
    new StartStreamTranscriptionCommand({
      LanguageCode: language,
      MediaEncoding: "pcm",
      MediaSampleRateHertz: 16000,
      AudioStream: audio(),
    }),
  )

  const parts: string[] = []
  const words: Word[] = []
  for await (const event of response.TranscriptResultStream ?? []) {
    for (const result of event.TranscriptEvent?.Transcript?.Results ?? []) {
      if (result.IsPartial) continue
      const best = result.Alternatives?.[0]
      if (best?.Transcript) parts.push(best.Transcript)
      for (const item of best?.Items ?? []) {
        if (item.Type !== "pronunciation" || !item.Content) continue
        words.push({
          text: item.Content,
          startMs: Math.round((item.StartTime ?? 0) * 1000),
          endMs: Math.round((item.EndTime ?? 0) * 1000),
          confidence: item.Confidence ?? 1,
        })
      }
    }
  }
  return { transcript: parts.join(" "), words }
}
