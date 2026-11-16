import Link from "next/link"
import { configured } from "@/lib/config"

// For the builders: which services have keys. Routes without one answer with stand-in data.
export const dynamic = "force-dynamic"

const ROUTES = [
  "POST /api/session/start",
  "POST /api/question/next",
  "POST /api/speak",
  "POST /api/answer",
  "POST /api/coach",
  "POST /api/resume",
  "GET /api/progress?learnerId=jaciel",
  "POST /api/demo/seed",
  "POST /api/demo/reset",
]

export default function Status() {
  const services = [
    ["AWS (Polly, Transcribe)", configured.aws()],
    ["Grok", configured.grok()],
    ["Claude (used when there is no Grok key)", configured.claude()],
    ["Supermemory", configured.supermemory()],
    ["Gemini (optional)", configured.gemini()],
  ] as const

  return (
    <main className="container stack" style={{ maxWidth: 720, padding: "40px 20px" }}>
      <Link href="/">Back to the app</Link>
      <h1>Status</h1>
      <p className="muted">
        Routes whose service has no key answer with stand-in data marked <code>fake: true</code>.
      </p>
      <div className="card stack">
        <h2>Keys</h2>
        <ul>
          {services.map(([name, ok]) => (
            <li key={name}>
              {name}: <strong>{ok ? "found" : "missing"}</strong>
            </li>
          ))}
        </ul>
      </div>
      <div className="card stack">
        <h2>Routes</h2>
        <ul>
          {ROUTES.map((route) => (
            <li key={route}>
              <code>{route}</code>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
