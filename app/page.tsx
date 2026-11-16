"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Face } from "@/components/Face"
import { Icon, type IconName } from "@/components/Icon"
import { Logo } from "@/components/Logo"
import { TopBar } from "@/components/TopBar"
import sample from "@/data/seed/demo.json"
import { api, DEFAULT_NAME, learnerIdFor, loadName, saveName, saveSetup } from "@/lib/client/api"
import { useUiLang, type StringKey } from "@/lib/client/i18n"

const STEPS: { icon: IconName; title: StringKey; body: StringKey }[] = [
  { icon: "sound", title: "how1t", body: "how1" },
  { icon: "mic", title: "how2t", body: "how2" },
  { icon: "bulb", title: "how3t", body: "how3" },
  { icon: "bookmark", title: "how4t", body: "how4" },
]

export default function Home() {
  const router = useRouter()
  const { lang, setLang, t } = useUiLang()
  const [name, setName] = useState(DEFAULT_NAME)
  const [posting, setPosting] = useState("")
  const [resume, setResume] = useState("")
  const [upload, setUpload] = useState<"idle" | "reading" | "error">("idle")
  const fileInput = useRef<HTMLInputElement>(null)
  const [spanishFirst, setSpanishFirst] = useState(false)
  const [demo, setDemo] = useState<"idle" | "loading" | "loaded" | "error">("idle")

  // The name typed last time is kept in this browser.
  useEffect(() => setName(loadName()), [])
  const shownName = name.trim() || DEFAULT_NAME

  function changeName(value: string) {
    setName(value)
    setDemo("idle") // the demo history belongs to one name
  }

  async function loadDemo() {
    setDemo("loading")
    try {
      await api.seed({ learnerId: learnerIdFor(shownName), name: shownName })
      setDemo("loaded")
    } catch {
      setDemo("error")
    }
  }

  // The server reads the text out of the file and it lands in the resume box, where it can be edited.
  async function uploadResume(file: File | undefined) {
    if (!file) return
    setUpload("reading")
    try {
      setResume((await api.readResume(file)).text)
      setUpload("idle")
    } catch {
      setUpload("error")
    }
  }

  function start() {
    saveName(shownName)
    saveSetup({ learnerId: learnerIdFor(shownName), name: shownName, role: "home_health_aide", jobPosting: posting.trim() || undefined, resume: resume.trim() || undefined, spanishFirst })
    router.push("/interview")
  }

  return (
    <>
      <TopBar lang={lang} setLang={setLang} t={t}>
        <Link href="/progress" className="btn btn-ghost btn-sm" aria-label={t("navProgress")}>
          <Icon name="chart" size={18} />
          <span className="hide-sm">{t("navProgress")}</span>
        </Link>
      </TopBar>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <span className="pill pill-primary">English · Español</span>
              <h1 style={{ marginTop: 14 }}>{t("heroTitle")}</h1>
              <p className="lead">{t("heroLead")}</p>
              <div className="row" style={{ marginTop: 26 }}>
                <a href="#start" className="btn btn-accent btn-lg">
                  {t("heroCta")}
                  <Icon name="arrow" />
                </a>
                <a href="#how" className="btn btn-ghost btn-lg">
                  {t("heroHow")}
                </a>
              </div>
              <p className="hero-note">
                <Icon name="heart" size={20} />
                {t("promiseTitle")}
              </p>
            </div>
            <div className="hero-art" aria-hidden="true">
              <Face mouth="wide" />
              <div className="bubble bubble-q">{t("bubbleQ")}</div>
              <div className="bubble bubble-c">{t("bubbleC")}</div>
            </div>
          </div>
        </section>

        <section className="section" id="how">
          <div className="container">
            <h2>{t("howTitle")}</h2>
            <div className="steps">
              {STEPS.map((step, i) => (
                <div className="step" key={step.title}>
                  <div className="step-top">
                    <span className="step-num">{i + 1}</span>
                    <Icon name={step.icon} size={26} />
                  </div>
                  <h3>{t(step.title)}</h3>
                  <p className="muted">{t(step.body)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="promise">
              <div className="row">
                <Icon name="heart" size={28} />
                <h2>{t("promiseTitle")}</h2>
              </div>
              <p>{t("promise")}</p>
            </div>
          </div>
        </section>

        <section className="section" id="start">
          <div className="container" style={{ maxWidth: 760 }}>
            <div className="card setup">
              <h2>{t("setupTitle")}</h2>

              <div className="field">
                <label htmlFor="name">{t("nameLabel")}</label>
                <input id="name" className="input" value={name} onChange={(e) => changeName(e.target.value)} autoComplete="given-name" maxLength={40} />
                <span className="hint">{t("nameHint")}</span>
              </div>

              <div className="field">
                <label htmlFor="role">{t("roleLabel")}</label>
                <select id="role" className="select" defaultValue="home_health_aide">
                  <option value="home_health_aide">{t("roleHha")}</option>
                </select>
                <span className="hint">{t("roleSoon")}</span>
              </div>

              <div className="field">
                <label htmlFor="posting">{t("postingLabel")}</label>
                <textarea id="posting" className="textarea" value={posting} onChange={(e) => setPosting(e.target.value)} />
                <span className="hint">{t("postingHint")}</span>
                {!posting && (
                  <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setPosting(sample.jobPosting)}>
                    {t("postingSample")}
                  </button>
                )}
              </div>

              <div className="field">
                <label htmlFor="resume">{t("resumeLabel")}</label>
                <textarea id="resume" className="textarea" value={resume} onChange={(e) => setResume(e.target.value)} />
                <span className="hint">{t("resumeHint")}</span>
                <div className="row">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInput.current?.click()} disabled={upload === "reading"}>
                    {upload === "reading" && <span className="spinner" aria-hidden="true" />}
                    {t("resumeUpload")}
                  </button>
                  {!resume && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setResume(sample.resume.replaceAll("{name}", shownName))}>
                      {t("resumeSample")}
                    </button>
                  )}
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  hidden
                  onChange={(e) => {
                    uploadResume(e.target.files?.[0])
                    e.target.value = "" // so the same file can be chosen again
                  }}
                />
                {upload === "error" && (
                  <p className="notice notice-error" role="alert">
                    {t("resumeUploadError")}
                  </p>
                )}
              </div>

              <label className="switch">
                <input type="checkbox" checked={spanishFirst} onChange={(e) => setSpanishFirst(e.target.checked)} />
                <span className="track" />
                <span>
                  <span className="label">{t("spanishFirst")}</span>
                  <span className="hint" style={{ display: "block" }}>
                    {t("spanishFirstHint")}
                  </span>
                </span>
              </label>

              <div className="demo-box">
                <span className="eyebrow">{t("demoTitle")}</span>
                {demo === "loaded" ? (
                  <p className="row" style={{ color: "var(--good)", fontWeight: 600 }}>
                    <Icon name="check" />
                    {t("demoLoaded", { name: shownName })}
                  </p>
                ) : (
                  <button type="button" className="btn btn-ghost" onClick={loadDemo} disabled={demo === "loading"}>
                    {demo === "loading" ? <span className="spinner" aria-hidden="true" /> : <Icon name="bookmark" />}
                    {t("demoLoad", { name: shownName })}
                  </button>
                )}
                {demo === "loading" && (
                  <p className="hint" role="status">
                    {t("demoLoading")}
                  </p>
                )}
                {demo === "error" && (
                  <p className="notice notice-error" role="alert">
                    {t("errorTitle")}
                  </p>
                )}
              </div>

              <button type="button" className="btn btn-accent btn-lg" onClick={start}>
                {t("start")}
                <Icon name="arrow" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container row spread">
          <Logo />
          <p className="muted small">{t("footer")}</p>
          <Link href="/status" className="small">
            Status
          </Link>
        </div>
      </footer>
    </>
  )
}
