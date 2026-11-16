"use client"

import { useCallback, useRef, useState } from "react"

const TARGET_RATE = 16000

/** Records the microphone as 16 kHz mono 16-bit PCM, the format the server's speech-to-text expects. */
export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [level, setLevel] = useState(0) // 0..1, for the "I can hear you" ring
  const session = useRef<{ ctx: AudioContext; stream: MediaStream; chunks: Float32Array[] } | null>(null)

  const teardown = useCallback(async () => {
    const s = session.current
    session.current = null
    setRecording(false)
    setLevel(0)
    if (!s) return null
    s.stream.getTracks().forEach((t) => t.stop())
    await s.ctx.close().catch(() => {})
    return s
  }, [])

  const start = useCallback(async () => {
    await teardown()
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
    const ctx = new AudioContext({ sampleRate: TARGET_RATE })
    await ctx.audioWorklet.addModule("/pcm-recorder.js")
    const chunks: Float32Array[] = []
    const node = new AudioWorkletNode(ctx, "pcm-recorder")
    let lastLevelAt = 0
    node.port.onmessage = (e: MessageEvent<Float32Array>) => {
      chunks.push(e.data)
      const now = performance.now()
      if (now - lastLevelAt < 80) return
      lastLevelAt = now
      let sum = 0
      for (const v of e.data) sum += v * v
      setLevel(Math.min(1, Math.sqrt(sum / e.data.length) * 6))
    }
    // The node must reach the output to be processed; the silent gain stops her hearing herself.
    const mute = ctx.createGain()
    mute.gain.value = 0
    ctx.createMediaStreamSource(stream).connect(node).connect(mute).connect(ctx.destination)
    session.current = { ctx, stream, chunks }
    setRecording(true)
  }, [teardown])

  /** Stops and returns the recording, or null if nothing was recorded. */
  const stop = useCallback(async (): Promise<Blob | null> => {
    const s = await teardown()
    if (!s || s.chunks.length === 0) return null
    const total = s.chunks.reduce((n, c) => n + c.length, 0)
    let samples = new Float32Array(total)
    let offset = 0
    for (const c of s.chunks) {
      samples.set(c, offset)
      offset += c.length
    }
    // Browsers that ignore the requested rate get resampled by linear interpolation.
    if (s.ctx.sampleRate !== TARGET_RATE) {
      const ratio = s.ctx.sampleRate / TARGET_RATE
      const out = new Float32Array(Math.floor(total / ratio))
      for (let i = 0; i < out.length; i++) {
        const pos = i * ratio
        const a = Math.floor(pos)
        const b = Math.min(a + 1, total - 1)
        out[i] = samples[a] + (samples[b] - samples[a]) * (pos - a)
      }
      samples = out
    }
    const pcm = new Int16Array(samples.length)
    for (let i = 0; i < samples.length; i++) {
      const v = Math.max(-1, Math.min(1, samples[i]))
      pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff
    }
    return new Blob([pcm.buffer], { type: "application/octet-stream" })
  }, [teardown])

  const cancel = useCallback(async () => {
    await teardown()
  }, [teardown])

  return { recording, level, start, stop, cancel }
}
