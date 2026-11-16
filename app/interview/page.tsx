"use client"

import Link from "next/link"
import { Fragment, useEffect, useRef, useState } from "react"
import { CoachDrawer, type CoachMessage } from "@/components/CoachDrawer"
import { Face } from "@/components/Face"
import { Icon } from "@/components/Icon"
import { TopBar } from "@/components/TopBar"
import { useRecorder } from "@/components/useRecorder"
import { useSpeaker } from "@/components/useSpeaker"
import { SoundsLike, Words } from "@/components/Words"
import { api, loadSetup, type Setup } from "@/lib/client/api"
import { useUiLang, type StringKey } from "@/lib/client/i18n"
import type { AnswerResponse, Bilingual, Language, Question, SessionStartResponse } from "@/lib/types"

// intro -> loading -> asking -> recording -> thinking -> feedback -> (next question)
// "waiting" is the paused state: she taps to answer, for example after talking to the coach.
type Stage = "intro" | "loading" | "asking" | "waiting" | "recording" | "typing" | "thinking" | "feedback" | "error"
// "reader" is the coach reading her feedback aloud.
type Voice = "interviewer" | "coach" | "example" | "reader"

export default function Interview() {
  const { lang, setLang, t, other, typeLabel } = useUiLang()
  const speaker = useSpeaker()
  const recorder = useRecorder()

  const [stage, setStage] = useState<Stage>("intro")
  const [setup, setSetup] = useState<Setup | null>(null)
  const [session, setSession] = useState<SessionStartResponse | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [result, setResult] = useState<AnswerResponse | null>(null)
  const [error, setError] = useState("")
  const [voice, setVoice] = useState<Voice>("interviewer")
  const [zoom, setZoom] = useState(false)
  const [captionLang, setCaptionLang] = useState<"en" | "es">("en")
  const [rate, setRate] = useState(1)
  const [micOk, setMicOk] = useState(true)
  const [seconds, setSeconds] = useState(0)
  const [typed, setTyped] = useState("")
  const [coachOpen, setCoachOpen] = useState(false)
  const [coachBusy, setCoachBusy] = useState(false)
  const [coachError, setCoachError] = useState("")
  const [thread, setThread] = useState<CoachMessage[]>([])
  // The hint under the question on what the interviewer wants to hear.
  const [showAsking, setShowAsking] = useState(false)
  // True while the interviewer says the question again because she asked her to.
  const [repeating, setRepeating] = useState(false)

  // Values the async flows below must read as they are now, not as they were when the flow started.
  const live = useRef({ rate: 1, micOk: true, coachOpen: false, readAloud: false, run: 0, say: 0 })
  live.current.rate = rate
  live.current.micOk = micOk
  live.current.coachOpen = coachOpen

  // Optional voice mode: the coach reads the feedback aloud. Remembered between visits.
  const [readAloud, setReadAloud] = useState(false)
  live.current.readAloud = readAloud
  useEffect(() => {
    setReadAloud(localStorage.getItem("ipl.readAloud") === "1")
  }, [])

  useEffect(() => {
    if (stage !== "recording") return
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [stage])

  useEffect(() => setSetup(loadSetup()), [])

  // On a phone the answer area sits below the interviewer, so bring what has just appeared into view.
  // On a laptop the answer area is beside her, so only the feedback needs bringing up.
  useEffect(() => {
    if (stage === "intro" || stage === "loading" || stage === "asking" || stage === "thinking") return
    const answering = stage === "recording" || stage === "waiting"
    const target =
      stage === "feedback"
        ? document.getElementById("stage-top")
        : window.matchMedia("(min-width: 980px)").matches
          ? null
          : answering
            ? document.querySelector(".q-phone") // the microphone docks over the bottom of a phone screen: keep the question clear of it
            : document.getElementById("stage-top")
    if (target) target.scrollIntoView({ block: answering ? "center" : "start" })
    else window.scrollTo({ top: 0 })
  }, [stage])

  const cancelRecording = recorder.cancel
  useEffect(() => () => void cancelRecording(), [cancelRecording])

  const fail = (e: unknown) => {
    setError(e instanceof Error ? e.message : String(e))
    setStage("error")
  }

  async function startRecording() {
    try {
      await recorder.start()
      setSeconds(0)
      setStage("recording")
    } catch {
      setMicOk(false)
      setStage("typing")
    }
  }

  /**
   * Speaks the question, then starts listening the moment it ends, so the delay before she starts can be measured.
   * With `again`, she asked the interviewer to repeat it, so it is said slowly.
   */
  async function askQuestion(q: Question, again = false) {
    const run = ++live.current.run
    setRepeating(again)
    await recorder.cancel()
    setResult(null)
    setTyped("")
    setThread([])
    setVoice("interviewer")
    setZoom(false)
    setStage("asking")
    window.scrollTo({ top: 0 })
    try {
      const speech = await api.speak({ text: q.textEn })
      if (run !== live.current.run) return
      await speaker.play(speech, again ? Math.min(live.current.rate, 0.75) : live.current.rate)
    } catch {
      // No voice: the caption still shows the question.
    }
    if (run !== live.current.run) return
    if (live.current.micOk && !live.current.coachOpen) await startRecording()
    else setStage(live.current.micOk ? "waiting" : "typing")
  }

  async function begin() {
    setStage("loading")
    const chosen = loadSetup()
    setSetup(chosen)
    try {
      // Settle the microphone permission now, so it does not interrupt the first answer.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
    } catch {
      setMicOk(false)
      live.current.micOk = false
    }
    try {
      const started = await api.startSession({ learnerId: chosen.learnerId, name: chosen.name, role: chosen.role, jobPosting: chosen.jobPosting, resume: chosen.resume })
      setSession(started)
      setQuestion(started.question)
      setQuestionNumber(1)
      await askQuestion(started.question)
    } catch (e) {
      fail(e)
    }
  }

  async function submit(payload: { audio?: Blob; transcript?: string }) {
    if (!session || !question) return
    setStage("thinking")
    try {
      const language: Language = setup?.spanishFirst ? "es-US" : "en-US"
      const answered = await api.answer({ sessionId: session.sessionId, questionId: question.id, language, ...payload })
      // She asked the interviewer to say it again: that is what happens, and nothing is graded.
      if ("repeat" in answered) return void (await askQuestion(question, true))
      setResult(answered)
      setStage("feedback")
      if (live.current.readAloud) void readFeedback(answered)
    } catch (e) {
      fail(e)
    }
  }

  async function finishRecording() {
    const audio = await recorder.stop()
    if (audio) await submit({ audio })
    else setStage("waiting")
  }

  async function nextQuestion() {
    if (!session) return
    setStage("loading")
    try {
      const { question: q } = await api.nextQuestion(session.sessionId)
      setQuestion(q)
      setShowAsking(false)
      setQuestionNumber((n) => n + 1)
      await askQuestion(q)
    } catch (e) {
      fail(e)
    }
  }

  /** Has the face say a line that is not the question: an example answer, one word slowly, or an English phrase. */
  async function say(text: string, as: Voice, opts: { rate?: number; zoom?: boolean; language?: Language } = {}) {
    const mine = ++live.current.say
    try {
      const speech = await api.speak({ text, language: opts.language })
      if (mine !== live.current.say) return
      setVoice(as)
      setZoom(Boolean(opts.zoom))
      await speaker.play(speech, opts.rate ?? 1)
    } catch {
      // The text is on screen either way.
    } finally {
      if (mine === live.current.say) {
        setZoom(false)
        setVoice("interviewer")
      }
    }
  }

  /** Says one word from the word popover: at normal speed, or slowly with the mouth zoomed in. */
  const hearWord = (word: string, slow: boolean) => void say(word, "example", slow ? { rate: 0.5, zoom: true } : {})

  /** Reads the main points of the feedback aloud, in the language the page is set to: what went well, the one fix, and what to practise. */
  function readFeedback(answered: AnswerResponse) {
    const key = lang === "es" ? "es" : "en"
    const { content, delivery } = answered.feedback
    const points = [content.good[key], content.fix[key], delivery?.practiseNext[key]].filter(Boolean)
    return say(points.join(" "), "reader", { language: lang === "es" ? "es-US" : "en-US" })
  }

  function stopSpeaking() {
    live.current.say++
    speaker.stop()
    setVoice("interviewer")
    setZoom(false)
  }

  function toggleReadAloud(on: boolean) {
    setReadAloud(on)
    localStorage.setItem("ipl.readAloud", on ? "1" : "0")
    if (on && result) void readFeedback(result)
    else if (voice === "reader") stopSpeaking()
  }

  function openCoach() {
    live.current.run++ // stops a question in progress from starting the recording behind the drawer
    speaker.stop()
    void recorder.cancel()
    if (stage === "asking" || stage === "recording") setStage(micOk ? "waiting" : "typing")
    setCoachError("")
    setCoachOpen(true)
  }

  function closeCoach() {
    live.current.say++
    speaker.stop()
    setVoice("interviewer")
    setCoachOpen(false)
  }

  /** Her question to the coach, typed or as a recording. A spoken question appears in the thread once it has been transcribed. */
  async function askCoach(asked: { text?: string; audio?: Blob }) {
    if (!session || !question) return
    const earlier = thread.map(({ role, text: said }) => ({ role, text: said }))
    if (asked.text) setThread((m) => [...m, { role: "learner", text: asked.text! }])
    setCoachBusy(true)
    setCoachError("")
    try {
      const reply = await api.coach({
        sessionId: session.sessionId,
        questionId: question.id,
        stage: result ? "feedback" : "question",
        ...asked,
        thread: earlier,
        lastAnswer: result?.transcript,
        lastFeedback: result ? `${result.feedback.content.good.es} ${result.feedback.content.fix.es}` : undefined,
      })
      setThread((m) => [
        ...m,
        ...(asked.audio ? [{ role: "learner" as const, text: reply.heard }] : []),
        { role: "coach" as const, text: reply.reply.es, phrases: reply.reply.phrasesEn },
      ])
      setCoachBusy(false) // the reply is on screen; she can type again while it is read aloud
      if (reply.audioBase64 && reply.audioMime && live.current.coachOpen) {
        const mine = ++live.current.say
        setVoice("coach")
        await speaker.play({ audioBase64: reply.audioBase64, audioMime: reply.audioMime, visemes: reply.visemes ?? [], words: [] })
        if (mine === live.current.say) setVoice("interviewer")
      }
    } catch (e) {
      setCoachError(e instanceof Error ? e.message : String(e))
    } finally {
      setCoachBusy(false)
    }
  }

  const speakingQuestion = stage === "asking" && voice === "interviewer"
  const words = question ? question.textEn.split(/\s+/) : []
  const voiceLabel = voice === "coach" ? t("coach") : voice === "reader" ? t("coachPlain") : voice === "example" ? t("example") : t("interviewer")
  const reading = voice === "reader" && speaker.speaking
  const startedOnWeakSpot = questionNumber === 1 && question && session?.profile.weakSpots.includes(question.type)
  const remembered = session?.profile.remembered ?? []
  const returning = Boolean(session && (session.profile.stories.length || session.profile.weakSpots.length || remembered.length))
  const learnerName = setup?.name ?? ""
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
  const practise = result?.feedback.delivery?.practiseNext

  // Feedback is written in both languages; the page language decides which one leads.
  const otherLang = lang === "es" ? "en" : "es"
  const bi = (value: Bilingual) => (
    <div>
      <p className="bi-1" lang={lang}>
        {value[lang]}
      </p>
      <p className="bi-2" lang={otherLang}>
        {value[otherLang]}
      </p>
    </div>
  )
  // A label in the page language, with the other language quieter beside it.
  const eyebrow = (key: StringKey, both = true) => (
    <span className="eyebrow">
      {t(key)}
      {both && (
        <span className="eyebrow-alt" lang={otherLang}>
          {" · "}
          {other(key)}
        </span>
      )}
    </span>
  )
  const deliveryLine = (key: StringKey, value: Bilingual) => (
    <div className="d-row">
      <p className="d-label">
        {t(key)}
        <span lang={otherLang}> · {other(key)}</span>
      </p>
      {bi(value)}
    </div>
  )

  // The question, with the word being spoken marked. Shown under the face on a phone and beside it on a laptop.
  const questionBlock = question && (
    <>
      <span className="eyebrow">
        {t("questionN", { n: questionNumber })}
        {question.source === "followup" && ` · ${t("followUp")}`}
      </span>
      {captionLang === "en" ? (
        <p className="caption" lang="en">
          {speakingQuestion ? (
            words.map((word, i) => (
              <Fragment key={i}>
                <span className={i === speaker.wordIndex ? "w now" : "w"}>{word}</span>{" "}
              </Fragment>
            ))
          ) : (
            <Words text={question.textEn} t={t} onHear={hearWord} />
          )}
        </p>
      ) : (
        <p className="caption caption-es" lang="es">
          {question.textEs}
        </p>
      )}
      {question.askingEn && question.askingEs && (
        <div className="asking">
          <button type="button" className="asking-btn" aria-expanded={showAsking} onClick={() => setShowAsking((open) => !open)}>
            <Icon name="bulb" size={18} />
            {t("whatAsking")}
          </button>
          {showAsking && bi({ en: question.askingEn, es: question.askingEs })}
        </div>
      )}
    </>
  )

  return (
    <>
      <TopBar lang={lang} setLang={setLang} t={t}>
        <Link href="/progress" className="btn btn-ghost btn-sm" aria-label={t("navProgress")}>
          <Icon name="chart" size={18} />
          <span className="hide-sm">{t("navProgress")}</span>
        </Link>
      </TopBar>

      <main className="container interview">
        {/* The speaker: face, caption and listening controls */}
        <section className="speaker-col" aria-label={voiceLabel}>
          <div className="card speaker">
            <Face
              mouth={speaker.mouth}
              speaking={speaker.speaking}
              role={voice === "coach" || voice === "reader" ? "coach" : "interviewer"}
              zoom={zoom}
              name={voiceLabel}
              status={t("speaking")}
            />

            {question && <div className="q-phone">{questionBlock}</div>}

            {question && (
              <div className="controls">
                <div className="control">
                  <span className="control-label" id="captions-label">
                    {t("captions")}
                  </span>
                  <div className="seg" role="group" aria-labelledby="captions-label">
                    <button type="button" aria-pressed={captionLang === "en"} onClick={() => setCaptionLang("en")}>
                      English
                    </button>
                    <button type="button" aria-pressed={captionLang === "es"} onClick={() => setCaptionLang("es")}>
                      Español
                    </button>
                  </div>
                </div>
                <div className="control">
                  <span className="control-label" id="speed-label">
                    {t("speed")}
                  </span>
                  <div className="seg" role="group" aria-labelledby="speed-label">
                    <button type="button" aria-pressed={rate === 1} onClick={() => setRate(1)}>
                      {t("speedNormal")}
                    </button>
                    <button type="button" aria-pressed={rate === 0.75} onClick={() => setRate(0.75)}>
                      {t("speedSlow")}
                    </button>
                  </div>
                </div>
                <div className="control-btns">
                  {/* On the feedback screen, repeating only replays the voice; it must not clear her feedback. */}
                  <button
                    type="button"
                    className="btn btn-outline"
                    aria-label={t("repeat")}
                    onClick={() => (stage === "feedback" ? say(question.textEn, "interviewer", { rate }) : askQuestion(question))}
                    disabled={stage === "thinking" || stage === "loading"}
                  >
                    <Icon name="repeat" size={18} />
                    <span className="show-sm">{t("repeat")}</span>
                    <span className="hide-sm">{t("repeatShort")}</span>
                  </button>
                  <button type="button" className="btn btn-coach" onClick={openCoach} disabled={stage === "thinking" || stage === "loading"}>
                    <Icon name="chat" size={18} />
                    {t("askCoach")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {remembered.length > 0 && (
            <div className="card card-flat remembered">
              <span className="eyebrow">{t("remembers")}</span>
              <ul style={{ margin: 0, paddingLeft: 20 }} className="muted small">
                {remembered.slice(0, 4).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Her side: answering, then feedback */}
        <section className="answer-col" aria-live="polite">
          {questionNumber === 1 && question && session && (
            <div className="memory-note" role="note">
              <span style={{ color: "var(--primary)" }}>
                <Icon name="bookmark" />
              </span>
              <p>
                <strong>{t(returning ? "welcomeBack" : "welcomeNew", { name: learnerName })}</strong>{" "}
                {startedOnWeakSpot && t("memoryNote", { type: typeLabel(question.type) })}
              </p>
            </div>
          )}
          {question && <div className="q-desk">{questionBlock}</div>}

          {stage === "intro" && (
            <div className="card intro-card">
              <h1>{t("beginTitle", { name: learnerName })}</h1>
              <p className="muted">{t("beginBody")}</p>
              <p className="hint row">
                <Icon name="mic" size={18} />
                {t("micNote")}
              </p>
              <button type="button" className="btn btn-accent btn-lg" onClick={begin}>
                {t("begin")}
                <Icon name="arrow" />
              </button>
            </div>
          )}

          {(stage === "loading" || stage === "asking" || stage === "thinking") && (
            <div className="card status-card dock" role="status">
              <div className="dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p>{t(stage === "loading" ? "loading" : stage === "asking" ? (repeating ? "repeating" : "asking") : "thinking")}</p>
              {/* Before the first question the browser may be waiting for her to allow the microphone. */}
              {stage === "loading" && !session && <p className="hint">{t("micNote")}</p>}
            </div>
          )}

          {(stage === "waiting" || stage === "recording") && (
            <div className="card mic-zone dock">
              {stage === "recording" ? (
                <>
                  <button
                    type="button"
                    className="mic-btn is-live"
                    style={{ "--level": 1 + recorder.level * 0.35 } as React.CSSProperties}
                    onClick={finishRecording}
                    aria-label={t("done")}
                  >
                    <Icon name="stop" size={40} />
                  </button>
                  <div className="mic-info">
                    <p className="timer" aria-hidden="true">
                      {clock}
                    </p>
                    <p className="mic-status">{t("listening")}</p>
                    {!setup?.spanishFirst && (
                      <p className="mic-hint">
                        {t("rescueHint")} <span lang="en">“Could you say that again more slowly?”</span>
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button type="button" className="mic-btn" onClick={startRecording} aria-label={t("answerNow")}>
                    <Icon name="mic" size={40} />
                  </button>
                  <div className="mic-info">
                    <p className="mic-status">{t("answerNow")}</p>
                  </div>
                </>
              )}
              <div className="mic-actions">
                {stage === "recording" && (
                  <button type="button" className="btn btn-primary" onClick={finishRecording}>
                    <Icon name="check" />
                    {t("done")}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    void recorder.cancel()
                    setStage("typing")
                  }}
                >
                  <Icon name="edit" size={18} />
                  {t("typeShort")}
                </button>
              </div>
            </div>
          )}

          {stage === "typing" && (
            <form
              id="stage-top"
              className="card stack"
              onSubmit={(e) => {
                e.preventDefault()
                if (typed.trim()) void submit({ transcript: typed.trim() })
              }}
            >
              {!micOk && (
                <p className="notice">
                  <Icon name="info" />
                  {t("micBlocked")}
                </p>
              )}
              <div className="field">
                <label htmlFor="typed">{t("typeInstead")}</label>
                <textarea id="typed" className="textarea" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={t("typePlaceholder")} />
              </div>
              <div className="row">
                <button type="submit" className="btn btn-primary" disabled={!typed.trim()}>
                  {t("send")}
                </button>
                {micOk && (
                  <button type="button" className="btn btn-ghost" onClick={() => setStage("waiting")}>
                    <Icon name="mic" size={18} />
                    {t("answerNow")}
                  </button>
                )}
              </div>
            </form>
          )}

          {stage === "error" && (
            <div id="stage-top" className="card stack">
              <h2>{t("errorTitle")}</h2>
              <p className="notice notice-error" role="alert">
                {error}
              </p>
              <button type="button" className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={() => (session ? setStage("waiting") : setStage("intro"))}>
                {t("tryAgain")}
              </button>
            </div>
          )}

          {stage === "feedback" && result && (
            <>
              {result.fake && (
                <p className="notice">
                  <Icon name="info" />
                  {t("fakeNote")}
                </p>
              )}

              <div className="fb-top" id="stage-top">
                <h2>{t("feedbackTitle")}</h2>

                {/* Voice mode: hear the feedback as well as read it */}
                <div className="read-bar">
                  <label className="switch">
                    <input type="checkbox" checked={readAloud} onChange={(e) => toggleReadAloud(e.target.checked)} />
                    <span className="track" />
                    <span>
                      <span className="label">{t("readAloud")}</span>
                      <span className="hint" lang={otherLang}>
                        {other("readAloud")}
                      </span>
                    </span>
                  </label>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => (reading ? stopSpeaking() : void readFeedback(result))}>
                    <Icon name={reading ? "stop" : "sound"} size={18} />
                    {t(reading ? "stopReading" : "listenFeedback")}
                  </button>
                </div>
              </div>

              <div className="fb-grid">
                {/* What she said */}
                <div className="fb-col">
                  <div className="card fb-card">
                    {eyebrow("heard")}
                    <p className="quote" lang={setup?.spanishFirst ? "es" : "en"}>
                      {setup?.spanishFirst ? result.transcript : <Words text={result.transcript} t={t} onHear={hearWord} />}
                    </p>
                  </div>

                  <div className="card fb-card">
                    <div className="fb-title">
                      <span className="fb-dot fb-dot-good">
                        <Icon name="check" size={14} />
                      </span>
                      {eyebrow("good")}
                    </div>
                    {bi(result.feedback.content.good)}
                  </div>

                  {/* When the answer went the wrong way, this card says so instead of offering a polish. */}
                  <div className={result.feedback.content.wrongWay ? "card fb-card fb-wrong" : "card fb-card"}>
                    <div className="fb-title">
                      <span className={result.feedback.content.wrongWay ? "fb-dot fb-dot-wrong" : "fb-dot fb-dot-fix"}>
                        <Icon name={result.feedback.content.wrongWay ? "close" : "arrow"} size={14} />
                      </span>
                      {eyebrow(result.feedback.content.wrongWay ? "wrongWay" : "fix")}
                    </div>
                    {bi(result.feedback.content.fix)}
                  </div>

                  <div className="card fb-card">
                    <div className="sample-head">
                      {eyebrow("stronger", false)}
                      <button type="button" className="btn btn-line btn-sm" onClick={() => say(result.feedback.content.sampleAnswerEn, "example", { rate })}>
                        <Icon name="play" size={16} />
                        {t("hear")}
                      </button>
                    </div>
                    <p className="say" lang="en">
                      <Words text={result.feedback.content.sampleAnswerEn} t={t} onHear={hearWord} />
                    </p>
                    <p className="hint">{t("tapWord")}</p>
                  </div>
                </div>

                {/* How she said it */}
                <div className="fb-col">
                  <div className="card fb-card">
                    {eyebrow("deliveryTitle")}
                    {result.feedback.delivery ? (
                      <div>
                        {deliveryLine("clarity", result.feedback.delivery.clarity)}
                        {deliveryLine("confidence", result.feedback.delivery.confidence)}
                        {deliveryLine("naturalness", result.feedback.delivery.naturalness)}
                      </div>
                    ) : (
                      <p className="muted">{t("noDelivery")}</p>
                    )}
                    {result.listener && <p className="small muted">{t("listenedBy")}</p>}
                  </div>

                  {practise && (
                    <div className="practise">
                      {eyebrow("practise")}
                      {practise.word && (
                        <div className="practise-main">
                          <div className="mouth-thumb" aria-hidden="true">
                            <Face mouth={speaker.mouth} zoom />
                          </div>
                          <div>
                            <p className="practise-word" lang="en">
                              {practise.word}
                            </p>
                            <SoundsLike text={practise.word} label={t("soundsLike").toLowerCase()} />
                          </div>
                          <button type="button" className="btn btn-accent btn-sm" onClick={() => say(practise.word!, "example", { rate: 0.5, zoom: true })}>
                            <Icon name="play" size={16} />
                            {t("watchSlow")}
                          </button>
                        </div>
                      )}
                      {bi(practise)}
                    </div>
                  )}
                </div>
              </div>

              <div className="next-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label={t("retry")}
                  onClick={() => {
                    stopSpeaking()
                    setResult(null)
                    setStage(micOk ? "waiting" : "typing")
                  }}
                >
                  <Icon name="repeat" size={18} />
                  <span className="hide-sm">{t("retry")}</span>
                  <span className="show-sm">{t("tryAgain")}</span>
                </button>
                <button type="button" className="btn btn-accent" onClick={nextQuestion}>
                  {t("next")}
                  <Icon name="arrow" />
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      {coachOpen && (
        <CoachDrawer
          t={t}
          messages={thread}
          busy={coachBusy}
          error={coachError}
          onSend={(text) => askCoach({ text })}
          onSendAudio={(audio) => askCoach({ audio })}
          onListen={() => {
            live.current.say++
            speaker.stop()
            setVoice("interviewer")
          }}
          onHear={(english) => say(english, "example", { rate: 0.85 })}
          onClose={closeCoach}
        />
      )}
    </>
  )
}
