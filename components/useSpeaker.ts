"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { SpeakResponse, TimedMark } from "@/lib/types"

export type Mouth = "closed" | "lipTeeth" | "tongueTeeth" | "tongueUp" | "teeth" | "pushed" | "round" | "wide" | "open"

// Polly's mouth-shape symbols for US English, grouped into our nine mouths.
// Closed, lip-on-teeth and tongue-between-teeth stay separate: those are the
// sounds a learner can actually see.
const MOUTHS: Record<string, Mouth> = {
  p: "closed", sil: "closed",
  f: "lipTeeth",
  T: "tongueTeeth",
  l: "tongueUp",
  t: "teeth", s: "teeth", k: "teeth",
  S: "pushed", r: "pushed", u: "pushed",
  o: "round", O: "round",
  i: "wide", e: "wide",
  a: "open", E: "open", "@": "open",
}
const VISIBLE = new Set(["p", "f", "T"])
const MIN_HOLD_MS = 55

/** Drops mouth events too short to see, which would otherwise make the mouth flicker. */
function smooth(visemes: TimedMark[]): TimedMark[] {
  return visemes.filter((v, i) => {
    const next = visemes[i + 1]
    return !next || VISIBLE.has(v.value) || next.timeMs - v.timeMs >= MIN_HOLD_MS
  })
}

export type SpeakerState = { mouth: Mouth; wordIndex: number; speaking: boolean }

/**
 * Plays a line of speech and drives the face from the audio's own clock, so the
 * mouth stays in sync at any playback speed.
 */
export function useSpeaker() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const frame = useRef(0)
  const done = useRef<(() => void) | null>(null)
  const [state, setState] = useState<SpeakerState>({ mouth: "closed", wordIndex: -1, speaking: false })

  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current)
    audioRef.current?.pause()
    done.current?.()
    done.current = null
    setState((s) => ({ ...s, mouth: "closed", speaking: false }))
  }, [])

  useEffect(() => () => stop(), [stop])

  /** Resolves when the line has finished (or was stopped). */
  const play = useCallback(
    (speech: SpeakResponse, rate = 1): Promise<void> => {
      stop()
      const audio = (audioRef.current ??= new Audio())
      audio.src = `data:${speech.audioMime};base64,${speech.audioBase64}`
      audio.playbackRate = rate
      const visemes = smooth(speech.visemes)
      const words = speech.words
      let vi = 0
      let wi = -1
      let last = ""

      return new Promise<void>((resolve) => {
        done.current = resolve
        const finish = () => {
          cancelAnimationFrame(frame.current)
          done.current = null
          setState({ mouth: "closed", wordIndex: words.length, speaking: false })
          resolve()
        }
        const tick = () => {
          const t = audio.currentTime * 1000
          while (vi + 1 < visemes.length && visemes[vi + 1].timeMs <= t) vi++
          while (wi + 1 < words.length && words[wi + 1].timeMs <= t) wi++
          const mouth = visemes.length ? (MOUTHS[visemes[vi].value] ?? "open") : "closed"
          const key = `${mouth}:${wi}`
          if (key !== last) {
            last = key
            setState({ mouth, wordIndex: wi, speaking: true })
          }
          if (!audio.paused && !audio.ended) frame.current = requestAnimationFrame(tick)
        }
        audio.onended = finish
        audio.onerror = finish
        setState({ mouth: "closed", wordIndex: -1, speaking: true })
        audio.play().then(() => (frame.current = requestAnimationFrame(tick)), finish)
      })
    },
    [stop],
  )

  return { ...state, play, stop }
}
