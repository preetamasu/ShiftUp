import { Face } from "@/components/Face"
import type { Mouth } from "@/components/useSpeaker"

// For the builders: every mouth pose side by side, with the sounds that use it.
const POSES: [Mouth, string][] = [
  ["closed", "p, b, m, silence"],
  ["lipTeeth", "f, v"],
  ["tongueTeeth", "th"],
  ["tongueUp", "l"],
  ["teeth", "t, d, n, s, z, k, g"],
  ["pushed", "sh, ch, r, w, oo"],
  ["round", "oh, aw"],
  ["wide", "ee, ih, ay"],
  ["open", "ah, eh, uh"],
]

export default function Faces() {
  return (
    <main className="container" style={{ padding: "32px 20px" }}>
      <h1 style={{ fontSize: "2rem" }}>Mouth poses</h1>
      <div className="hero-art" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 16, margin: "20px 0 0", width: "100%" }}>
        {POSES.map(([mouth, sounds]) => (
          <div key={mouth} className="stack" style={{ gap: 6 }}>
            <Face mouth={mouth} name={mouth} />
            <p className="small muted" style={{ textAlign: "center" }}>
              {sounds}
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}
