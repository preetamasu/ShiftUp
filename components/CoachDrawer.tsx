"use client"

import { useEffect, useRef, useState } from "react"
import type { StringKey } from "@/lib/client/i18n"
import type { CoachResponse } from "@/lib/types"
import { Icon } from "./Icon"
import { useRecorder } from "./useRecorder"

export type CoachMessage = { role: "learner" | "coach"; text: string; phrases?: CoachResponse["reply"]["phrasesEn"] }

type Props = {
  t: (key: StringKey) => string
  messages: CoachMessage[]
  busy: boolean
  error: string
  onSend: (text: string) => void
  /** Her question as a recording (16 kHz PCM), when she asks out loud. */
  onSendAudio: (audio: Blob) => void
  /** Called when she starts speaking, so the coach's voice can be stopped first. */
  onListen: () => void
  onHear: (english: string) => void
  onClose: () => void
}

/** The Spanish side conversation. It never changes the interview: closing it returns her to where she was. */
export function CoachDrawer({ t, messages, busy, error, onSend, onSendAudio, onListen, onHear, onClose }: Props) {
  const [text, setText] = useState("")
  const [micOk, setMicOk] = useState(true)
  const recorder = useRecorder()
  const cancelRecording = recorder.cancel
  useEffect(() => () => void cancelRecording(), [cancelRecording])

  async function toggleMic() {
    if (recorder.recording) {
      const audio = await recorder.stop()
      if (audio) onSendAudio(audio)
      return
    }
    try {
      onListen()
      await recorder.start()
    } catch {
      setMicOk(false)
    }
  }
  const input = useRef<HTMLInputElement>(null)
  const end = useRef<HTMLDivElement>(null)

  // Block bodies on purpose: an effect must not return a value, and newer
  // browsers return a promise from scrollIntoView.
  useEffect(() => {
    input.current?.focus()
  }, [])
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" })
  }, [messages, busy])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  function send(value: string) {
    const trimmed = value.trim()
    if (!trimmed || busy) return
    setText("")
    onSend(trimmed)
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={t("coachTitle")} lang="es">
        <div className="drawer-head">
          <div className="row">
            <Icon name="chat" />
            <h2>{t("coach")}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t("close")}>
            <Icon name="close" />
          </button>
        </div>

        <div className="drawer-body" aria-live="polite">
          <p className="muted">{t("coachIntro")}</p>
          {messages.length === 0 && (
            <div className="row">
              {(["coachSuggest1", "coachSuggest2"] as const).map((key) => (
                <button key={key} type="button" className="btn btn-coach btn-sm" onClick={() => send(t(key))}>
                  {t(key)}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role === "coach" ? "msg-coach" : "msg-me"}`}>
              {m.text}
              {m.phrases?.map((p) => (
                <div className="phrase" key={p.en} lang="en">
                  <span>
                    <strong>{p.en}</strong>
                    <span className="small muted" style={{ display: "block" }} lang="es">
                      {p.es}
                    </span>
                  </span>
                  <button type="button" className="icon-btn" onClick={() => onHear(p.en)} aria-label={`${t("hear")}: ${p.en}`}>
                    <Icon name="sound" />
                  </button>
                </div>
              ))}
            </div>
          ))}
          {busy && (
            <div className="msg msg-coach dots" role="status" aria-label={t("thinking")}>
              <span />
              <span />
              <span />
            </div>
          )}
          {error && (
            <p className="notice notice-error" role="alert">
              {error}
            </p>
          )}
          <div ref={end} />
        </div>

        <form
          className="drawer-foot"
          onSubmit={(e) => {
            e.preventDefault()
            send(text)
          }}
        >
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <label htmlFor="coach-input" className="sr-only">
              {t("coachPlaceholder")}
            </label>
            <input id="coach-input" ref={input} className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("coachPlaceholder")} autoComplete="off" />
            <button type="submit" className="btn btn-primary" disabled={busy || !text.trim()}>
              {t("send")}
            </button>
          </div>
          {micOk && (
            <button type="button" className={recorder.recording ? "btn btn-accent" : "btn btn-coach"} onClick={toggleMic} disabled={busy}>
              <Icon name={recorder.recording ? "stop" : "mic"} />
              {t(recorder.recording ? "coachStop" : "coachSpeak")}
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            <Icon name="back" />
            {t("coachBack")}
          </button>
        </form>
      </aside>
    </>
  )
}
