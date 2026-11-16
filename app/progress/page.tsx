"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Icon } from "@/components/Icon"
import { TopBar } from "@/components/TopBar"
import { api, learnerIdFor, loadName } from "@/lib/client/api"
import { useUiLang } from "@/lib/client/i18n"
import type { SessionSummary } from "@/lib/types"

const seconds = (ms: number) => (ms / 1000).toFixed(1)

export default function Progress() {
  const { lang, setLang, t, typeLabel } = useUiLang()
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    api
      .progress(learnerIdFor(loadName()))
      .then((res) => setSessions(res.sessions))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  const first = sessions?.[0]
  const latest = sessions?.at(-1)
  const sooner = first && latest && sessions.length > 1 ? (first.avgStartDelayMs - latest.avgStartDelayMs) / 1000 : 0

  return (
    <>
      <TopBar lang={lang} setLang={setLang} t={t}>
        <Link href="/" className="btn btn-ghost btn-sm">
          <Icon name="back" size={18} />
          {t("navHome")}
        </Link>
      </TopBar>

      <main className="container stack" style={{ padding: "32px 20px 64px", gap: 20 }}>
        <div>
          <h1 style={{ fontSize: "2.2rem" }}>{t("progressTitle")}</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            {t("progressLead")}
          </p>
        </div>

        {error && (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        )}

        {sooner >= 0.5 && (
          <p className="memory-note">
            <span style={{ color: "var(--primary)" }}>
              <Icon name="clock" />
            </span>
            {t("progressBetter", { n: sooner.toFixed(1) })}
          </p>
        )}

        {!sessions && !error && (
          <div className="dots" role="status" aria-label={t("loading")}>
            <span />
            <span />
            <span />
          </div>
        )}

        {sessions && sessions.length === 0 && <p className="card muted">{t("progressEmpty")}</p>}

        {sessions && sessions.length > 0 && (
          <div className="card table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">{t("colDate")}</th>
                  <th scope="col">{t("colAnswers")}</th>
                  <th scope="col">{t("colStart")}</th>
                  <th scope="col">{t("colPauses")}</th>
                  <th scope="col">{t("colPace")}</th>
                  <th scope="col">{t("colHard")}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.sessionId}>
                    <th scope="row" style={{ textTransform: "none", letterSpacing: 0, fontSize: "1rem", color: "var(--ink)" }}>
                      {s.date}
                    </th>
                    <td className="num">{s.answers}</td>
                    <td className="num">
                      {seconds(s.avgStartDelayMs)} {t("seconds")}
                    </td>
                    <td className="num">{s.longPausesPerAnswer}</td>
                    <td className="num">{s.paceWpm}</td>
                    <td>{s.weakSpots.map(typeLabel).join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Link href="/interview" className="btn btn-accent btn-lg" style={{ alignSelf: "flex-start" }}>
          {t("heroCta")}
          <Icon name="arrow" />
        </Link>
      </main>
    </>
  )
}
