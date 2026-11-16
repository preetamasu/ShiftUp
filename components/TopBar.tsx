"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import type { StringKey, UiLang } from "@/lib/client/i18n"
import { Logo } from "./Logo"

type Props = {
  lang: UiLang
  setLang: (lang: UiLang) => void
  t: (key: StringKey) => string
  children?: ReactNode
}

export function TopBar({ lang, setLang, t, children }: Props) {
  return (
    <header className="topbar">
      <div className="container">
        <Link href="/" className="brand" aria-label={t("brand")}>
          <Logo />
        </Link>
        <nav className="row" aria-label="Main">
          {children}
          <div className="seg" role="group" aria-label="Language / Idioma">
            <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
              EN
            </button>
            <button type="button" aria-pressed={lang === "es"} onClick={() => setLang("es")}>
              ES
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}
