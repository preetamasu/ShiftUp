"use client"

import { Fragment, useEffect, useState } from "react"
import type { StringKey } from "@/lib/client/i18n"
import { Icon } from "./Icon"

type Props = {
  text: string
  t: (key: StringKey) => string
  /** Says the word through the interviewer's face: at normal speed, or slowly with the mouth zoomed in. */
  onHear: (word: string, slow: boolean) => void
}

// "Sounds like" spellings already fetched, shared by every word on the page.
const known = new Map<string, string | null>()
const asked = new Map<string, Promise<void>>()

/** Fetches one word's spelling, once. Resolves when the answer is in `known`. */
function lookUp(word: string) {
  let request = asked.get(word)
  if (!request) {
    request = fetch(`/api/pronounce?word=${encodeURIComponent(word)}`)
      .then((res) => res.json())
      .then((body: { soundsLike?: string | null }) => void known.set(word, body.soundsLike ?? null))
      .catch(() => {})
    asked.set(word, request)
  }
  return request
}

/**
 * English text in which every word can be pointed at (or tapped, on a phone) to
 * hear it and see how it sounds. The popover is shown by CSS on hover and on
 * keyboard focus, so it works without a mouse.
 */
export function Words({ text, t, onHear }: Props) {
  const [, refresh] = useState(0)
  const load = (word: string) => void lookUp(word).then(() => refresh((n) => n + 1))

  return (
    <>
      {text.split(/\s+/).map((token, i) => {
        const word = token.replace(/[^A-Za-z']/g, "").replace(/^'+|'+$/g, "")
        const space = i > 0 ? " " : ""
        if (!word)
          return (
            <span key={i}>
              {space}
              {token}
            </span>
          )
        const sounds = known.get(word.toLowerCase())
        return (
          // The space sits outside the word's box: inside it, the browser would drop it.
          <Fragment key={i}>
            {space}
            <span className="word">
              <button type="button" className="word-btn" onMouseEnter={() => load(word.toLowerCase())} onFocus={() => load(word.toLowerCase())}>
                {token}
              </button>
              <span className="word-pop" role="tooltip">
                <span className="word-card">
                  <span className="word-title" lang="en">
                    {word}
                  </span>
                  {sounds && (
                    <span className="word-sounds">
                      <span className="word-label">{t("soundsLike")}</span>
                      {sounds}
                    </span>
                  )}
                  <span className="word-actions">
                    <button type="button" className="pop-btn" onClick={() => onHear(word, false)}>
                      <Icon name="sound" size={18} />
                      {t("hearWord")}
                    </button>
                    <button type="button" className="pop-btn" onClick={() => onHear(word, true)}>
                      <Icon name="play" size={18} />
                      {t("slowly")}
                    </button>
                  </span>
                </span>
              </span>
            </span>
          </Fragment>
        )
      })}
    </>
  )
}

/** The "sounds like" spelling of a word or a short phrase, shown once it has been fetched. */
export function SoundsLike({ text, label }: { text: string; label: string }) {
  const [, refresh] = useState(0)
  const words = text.toLowerCase().match(/[a-z']+/g) ?? []
  const key = words.join(" ")

  useEffect(() => {
    let live = true
    void Promise.all(key.split(" ").filter(Boolean).map(lookUp)).then(() => live && refresh((n) => n + 1))
    return () => {
      live = false
    }
  }, [key])

  const sounds = words.map((word) => known.get(word))
  if (!words.length || sounds.some((s) => !s)) return null
  return (
    <span className="practise-sounds">
      {label}
      <strong>{sounds.join(" ")}</strong>
    </span>
  )
}
