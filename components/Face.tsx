"use client"

import { useEffect, useId, useRef } from "react"
import type { Mouth } from "./useSpeaker"

// A shaded portrait that is animated in the browser: no video and no avatar
// service. The mouth is not a set of swapped pictures. Each sound has a target
// pose (how open, how wide, how rounded, which teeth show, where the tongue is)
// and the mouth eases from one pose to the next every frame, with the jaw
// following. Blinks, small glances and a slight head movement keep it alive.

type Pose = { open: number; wide: number; round: number; upper: number; lower: number; tongueUp: number; tongueOut: number; tuck: number }

const POSES: Record<Mouth, Pose> = {
  closed: { open: 0, wide: 0, round: 0, upper: 0, lower: 0, tongueUp: 0, tongueOut: 0, tuck: 0 },
  lipTeeth: { open: 0.1, wide: 0.1, round: 0, upper: 1, lower: 0, tongueUp: 0, tongueOut: 0, tuck: 1 },
  tongueTeeth: { open: 0.26, wide: 0.15, round: 0, upper: 0.9, lower: 0, tongueUp: 0, tongueOut: 1, tuck: 0 },
  tongueUp: { open: 0.38, wide: 0.1, round: 0, upper: 0.8, lower: 0, tongueUp: 1, tongueOut: 0, tuck: 0 },
  teeth: { open: 0.17, wide: 0.35, round: 0, upper: 1, lower: 0.9, tongueUp: 0, tongueOut: 0, tuck: 0 },
  pushed: { open: 0.2, wide: -0.65, round: 1, upper: 0.15, lower: 0, tongueUp: 0, tongueOut: 0, tuck: 0 },
  round: { open: 0.52, wide: -0.45, round: 0.8, upper: 0.25, lower: 0, tongueUp: 0, tongueOut: 0, tuck: 0 },
  wide: { open: 0.3, wide: 0.6, round: 0, upper: 1, lower: 0.25, tongueUp: 0, tongueOut: 0, tuck: 0 },
  open: { open: 0.8, wide: 0.1, round: 0, upper: 0.85, lower: 0.3, tongueUp: 0, tongueOut: 0, tuck: 0 },
}
const KEYS = Object.keys(POSES.closed) as (keyof Pose)[]

const MOUTH_X = 160
const MOUTH_Y = 229
const EYES = [
  { x: 132, y: 168 },
  { x: 188, y: 168 },
]
const n = (v: number) => v.toFixed(2)
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/** Everything about the mouth that changes with the pose, as SVG attribute values. */
function mouthShape(p: Pose) {
  const W = 24 + (p.wide > 0 ? 9 : 14) * p.wide // half the mouth's width
  const H = 22 * p.open // gap between the lips
  const up = H * 0.2 // the upper lip lifts a little; the jaw does most of the work
  const down = H * 0.8
  const upperLip = 5 + 1.5 * p.round
  const lowerLip = 8 + 2.5 * p.round
  const corner = -2.6 + 2.4 * p.open + 1.4 * p.round // corner height: a slight smile at rest
  const innerUp = 2 * -up - corner // curve controls for the inside edges of the lips
  const innerDown = 2 * down - corner
  const top = -up - upperLip
  const bottom = (down + lowerLip - 0.25 * corner) / 0.75
  const edge = -up + 6.5 * p.upper // lower edge of the upper teeth

  return {
    jaw: down * 0.5,
    down,
    lowerLip,
    upper:
      `M ${n(-W)} ${n(corner)} Q ${n(-W * 0.74)} ${n(top * 0.62 + corner * 0.38)} ${n(-W * 0.4)} ${n(top - 1)} ` +
      `Q ${n(-W * 0.16)} ${n(top - 1.4)} 0 ${n(top + 1.3)} Q ${n(W * 0.16)} ${n(top - 1.4)} ${n(W * 0.4)} ${n(top - 1)} ` +
      `Q ${n(W * 0.74)} ${n(top * 0.62 + corner * 0.38)} ${n(W)} ${n(corner)} Q 0 ${n(innerUp)} ${n(-W)} ${n(corner)} Z`,
    lower: `M ${n(-W)} ${n(corner)} Q 0 ${n(innerDown)} ${n(W)} ${n(corner)} C ${n(W * 0.72)} ${n(bottom)} ${n(-W * 0.72)} ${n(bottom)} ${n(-W)} ${n(corner)} Z`,
    cavity: `M ${n(-W)} ${n(corner)} Q 0 ${n(innerUp)} ${n(W)} ${n(corner)} Q 0 ${n(innerDown)} ${n(-W)} ${n(corner)} Z`,
    seam: `M ${n(-W)} ${n(corner)} Q 0 ${n((innerUp + innerDown) / 2)} ${n(W)} ${n(corner)}`,
    shine: `M ${n(-W * 0.45)} ${n(down + lowerLip * 0.5)} Q 0 ${n(down + lowerLip * 0.72)} ${n(W * 0.45)} ${n(down + lowerLip * 0.5)}`,
    upperTeeth: { x: n(-W * 0.82), y: n(-up - 7), width: n(W * 1.64), height: n(7 + 6.5 * p.upper) },
    lowerTeeth: { x: n(-W * 0.62), y: n(down - 5.5 * p.lower), width: n(W * 1.24), height: "9" },
    tongue: { cy: n(down - 1.5), rx: n(W * 0.62), ry: n(3 + 5 * p.open), opacity: n(clamp01((p.open - 0.22) * 3)) },
    tongueUp: { cy: n(edge + 2.5), rx: n(W * 0.36), opacity: n(p.tongueUp) },
    tongueOut: { cy: n(edge + 1.5), rx: n(W * 0.44), opacity: n(p.tongueOut) },
    tuck: { x: n(-W * 0.6), y: n(-up - 1), width: n(W * 1.2), opacity: n(p.tuck) },
  }
}

/** The outline of the face. The chin and jaw drop as the mouth opens. */
function facePath(jaw: number) {
  return (
    `M 92 150 C 90 100 124 74 160 74 C 196 74 230 100 228 150 ` +
    `C 228 190 220 ${n(222 + jaw * 0.3)} 200 ${n(244 + jaw * 0.5)} C 187 ${n(259 + jaw * 0.85)} 174 ${n(266 + jaw)} 160 ${n(266 + jaw)} ` +
    `C 146 ${n(266 + jaw)} 133 ${n(259 + jaw * 0.85)} 120 ${n(244 + jaw * 0.5)} C 100 ${n(222 + jaw * 0.3)} 92 190 92 150 Z`
  )
}

/** One eye's opening. `lid` runs from 0 (open) to 1 (closed). */
function eyeShape(x: number, y: number, lid: number) {
  const top = 2 * (y - 8.5 + 14.2 * lid) - y
  const bottom = 2 * (y + 6) - y
  return {
    open: `M ${x - 16} ${y} Q ${x} ${n(top)} ${x + 16} ${y} Q ${x} ${n(bottom)} ${x - 16} ${y} Z`,
    lash: `M ${x - 16.5} ${y} Q ${x} ${n(top)} ${x + 16.5} ${y}`,
  }
}

const REST = mouthShape(POSES.closed)

type Props = {
  mouth: Mouth
  speaking?: boolean
  /** The coach wears a different colour so the two roles stay distinct. */
  role?: "interviewer" | "coach"
  /** Zooms in on the mouth for the slow word replay. */
  zoom?: boolean
  label?: string
  /** Name tag shown in the corner of the frame, like a video call. */
  name?: string
  /** Shown in the other corner while she is speaking, for example "Speaking". */
  status?: string
}

export function Face({ mouth, speaking, role = "interviewer", zoom, label, name, status }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "")
  const el = useRef<Record<string, SVGElement | null>>({})
  const bind = (key: string) => (node: SVGElement | null) => {
    el.current[key] = node
  }
  const target = useRef({ mouth, speaking: Boolean(speaking) })
  target.current = { mouth, speaking: Boolean(speaking) }

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const set = (key: string, attrs: Record<string, string>) => {
      const node = el.current[key]
      if (node) for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
    }
    const pose: Pose = { ...POSES.closed }
    let energy = 0 // a slower-moving copy of how open the mouth is: drives the nod and the brows
    let gaze = { x: 0, y: 0 }
    let look = { x: 0, y: 0 }
    let lookAt = 0
    let blinkAt = performance.now() + 1500 + Math.random() * 2500
    let last = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = now / 1000

      // Ease the mouth toward the pose for the current sound.
      const goal = POSES[target.current.mouth]
      const ease = 1 - Math.exp(-dt / 0.045)
      for (const key of KEYS) pose[key] += (goal[key] - pose[key]) * ease
      energy += (pose.open - energy) * (1 - Math.exp(-dt / 0.18))

      const m = mouthShape(pose)
      set("upper", { d: m.upper })
      set("lower", { d: m.lower })
      set("cavity", { d: m.cavity })
      set("clip", { d: m.cavity })
      set("seam", { d: m.seam, opacity: n(1 - clamp01(pose.open * 6)) })
      set("shine", { d: m.shine })
      set("upperTeeth", m.upperTeeth)
      set("lowerTeeth", m.lowerTeeth)
      set("tongue", m.tongue)
      set("tongueUp", m.tongueUp)
      set("tongueOut", m.tongueOut)
      set("tuck", m.tuck)
      set("face", { d: facePath(m.jaw) })
      set("chinShade", { cy: n(MOUTH_Y + m.down + m.lowerLip + 6) })
      set("neckShade", { cy: n(276 + m.jaw) })

      // Blink: lids close in 70 ms and reopen in 110 ms.
      let lid = 0
      if (!still) {
        const since = now - blinkAt
        if (since >= 0) {
          lid = since < 70 ? since / 70 : 1 - (since - 70) / 110
          if (since > 180) {
            lid = 0
            blinkAt = now + 2200 + Math.random() * 3600
          }
        }
        // Small glances, held longer and kept nearer the listener while speaking.
        if (now > lookAt) {
          const range = target.current.speaking ? 0.5 : 1
          look = { x: (Math.random() * 2 - 1) * 1.7 * range, y: (Math.random() * 2 - 1) * 0.9 * range }
          lookAt = now + 1400 + Math.random() * 3000
        }
        const glide = 1 - Math.exp(-dt / 0.07)
        gaze = { x: gaze.x + (look.x - gaze.x) * glide, y: gaze.y + (look.y - gaze.y) * glide }
      }
      EYES.forEach((eye, i) => {
        const shape = eyeShape(eye.x, eye.y, clamp01(lid))
        set(`eye${i}`, { d: shape.open })
        set(`eyeClip${i}`, { d: shape.open })
        set(`lash${i}`, { d: shape.lash })
        set(`iris${i}`, { transform: `translate(${n(gaze.x)} ${n(gaze.y)})` })
      })

      if (!still) {
        const tilt = Math.sin(t * 0.5) * 0.9 + Math.sin(t * 1.3) * 0.3
        const bob = Math.sin(t * 0.8) * 0.9 + energy * 1.8
        set("head", { transform: `translate(0 ${n(bob)}) rotate(${n(tilt)} 160 310)` })
        set("brows", { transform: `translate(0 ${n(-energy * 1.8)})` })
        set("body", { transform: `translate(0 ${n(Math.sin(t * 1.1) * 0.8)})` })
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const coach = role === "coach"
  const jacket = coach ? ["#3a5ba3", "#22396f"] : ["#187a74", "#0b4a47"]
  const classes = ["face-wrap", coach ? "is-coach" : "", speaking ? "is-speaking" : "", zoom ? "is-zoom" : ""].join(" ")
  const url = (name: string) => `url(#${id}${name})`

  return (
    <div className={classes}>
      <svg viewBox="0 0 320 400" role="img" aria-label={label ?? name ?? "Interviewer"} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${id}bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={coach ? "#e9eef8" : "#eef2ec"} />
            <stop offset="1" stopColor={coach ? "#c9d6ee" : "#cddfd9"} />
          </linearGradient>
          <linearGradient id={`${id}skin`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ecc3a0" />
            <stop offset="0.55" stopColor="#dfae89" />
            <stop offset="1" stopColor="#cf9a74" />
          </linearGradient>
          <radialGradient id={`${id}glow`} cx="0.42" cy="0.3" r="0.6">
            <stop offset="0" stopColor="#fbe0c6" stopOpacity="0.75" />
            <stop offset="1" stopColor="#fbe0c6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}neck`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b98360" />
            <stop offset="0.6" stopColor="#d3a07b" />
            <stop offset="1" stopColor="#dcab87" />
          </linearGradient>
          <linearGradient id={`${id}hair`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4b3329" />
            <stop offset="0.5" stopColor="#33231d" />
            <stop offset="1" stopColor="#231713" />
          </linearGradient>
          <linearGradient id={`${id}jacket`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={jacket[0]} />
            <stop offset="1" stopColor={jacket[1]} />
          </linearGradient>
          <radialGradient id={`${id}iris`} cx="0.5" cy="0.45" r="0.55">
            <stop offset="0" stopColor="#8a5a34" />
            <stop offset="0.7" stopColor="#5a371f" />
            <stop offset="1" stopColor="#2e1a0e" />
          </radialGradient>
          <linearGradient id={`${id}white`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d9cdc6" />
            <stop offset="0.45" stopColor="#fbf8f5" />
            <stop offset="1" stopColor="#f3ece7" />
          </linearGradient>
          <linearGradient id={`${id}teeth`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d8cdc4" />
            <stop offset="0.5" stopColor="#f8f4ef" />
            <stop offset="1" stopColor="#efe8e0" />
          </linearGradient>
          <linearGradient id={`${id}lipU`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b9655b" />
            <stop offset="1" stopColor="#9f4d46" />
          </linearGradient>
          <linearGradient id={`${id}lipL`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c56f63" />
            <stop offset="1" stopColor="#b25c52" />
          </linearGradient>
          <filter id={`${id}blur`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter id={`${id}soft`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <clipPath id={`${id}mouthClip`}>
            <path ref={bind("clip")} d={REST.cavity} />
          </clipPath>
          {EYES.map((eye, i) => (
            <clipPath id={`${id}eyeClip${i}`} key={i}>
              <path ref={bind(`eyeClip${i}`)} d={eyeShape(eye.x, eye.y, 0).open} />
            </clipPath>
          ))}
        </defs>

        {/* An out-of-focus room behind her */}
        <rect width="320" height="400" fill={url("bg")} />
        <g filter={url("blur")} opacity="0.75">
          <rect x="196" y="20" width="110" height="170" rx="10" fill="#ffffff" />
          <circle cx="44" cy="250" r="56" fill={coach ? "#9fb4e0" : "#8fbfae"} />
          <rect x="0" y="330" width="320" height="70" fill={coach ? "#b9c7e6" : "#b8d0c8"} />
        </g>

        <g ref={bind("body")}>
          <g ref={bind("head")}>
            {/* hair behind the head */}
            <path d="M 70 196 C 58 94 116 38 164 38 C 216 38 268 92 252 198 C 258 250 252 290 238 318 L 84 318 C 70 290 64 250 70 196 Z" fill={url("hair")} />
            {/* neck, with the shadow the chin casts on it */}
            <path d="M 136 232 L 133 320 L 187 320 L 184 232 Z" fill={url("neck")} />
            <ellipse ref={bind("neckShade")} cx="160" cy="276" rx="28" ry="14" fill="#8f5f42" opacity="0.4" filter={url("soft")} />
            {/* ears and earrings */}
            <ellipse cx="90" cy="176" rx="8" ry="15" fill="#d09a75" />
            <ellipse cx="230" cy="176" rx="8" ry="15" fill="#c48f6b" />
            <ellipse cx="91" cy="176" rx="3.6" ry="8.5" fill="#a9714f" opacity="0.4" />
            <ellipse cx="229" cy="176" rx="3.6" ry="8.5" fill="#a9714f" opacity="0.4" />
            <circle cx="89" cy="192" r="2.4" fill="#f3e4c2" />
            <circle cx="231" cy="192" r="2.4" fill="#f3e4c2" />

            {/* face */}
            <path ref={bind("face")} d={facePath(0)} fill={url("skin")} />
            <ellipse cx="150" cy="140" rx="60" ry="62" fill={url("glow")} />
            <ellipse cx="100" cy="194" rx="13" ry="44" fill="#b87f5c" opacity="0.2" filter={url("soft")} />
            <ellipse cx="220" cy="194" rx="13" ry="44" fill="#a9714f" opacity="0.26" filter={url("soft")} />
            <ellipse cx="117" cy="205" rx="16" ry="9" fill="#e08e7c" opacity="0.32" filter={url("soft")} />
            <ellipse cx="203" cy="205" rx="16" ry="9" fill="#e08e7c" opacity="0.32" filter={url("soft")} />

            {/* eyes */}
            {EYES.map((eye, i) => {
              const shape = eyeShape(eye.x, eye.y, 0)
              return (
                <g key={i}>
                  <ellipse cx={eye.x} cy={eye.y - 5} rx="21" ry="12" fill="#a9714f" opacity="0.16" filter={url("soft")} />
                  <path ref={bind(`eye${i}`)} d={shape.open} fill={url("white")} />
                  <g clipPath={url(`eyeClip${i}`)}>
                    <g ref={bind(`iris${i}`)}>
                      <circle cx={eye.x} cy={eye.y - 0.5} r="7.6" fill={url("iris")} />
                      <circle cx={eye.x} cy={eye.y - 0.5} r="3.3" fill="#120b08" />
                      <circle cx={eye.x + 2.3} cy={eye.y - 3.1} r="1.6" fill="#ffffff" opacity="0.9" />
                    </g>
                  </g>
                  <path ref={bind(`lash${i}`)} d={shape.lash} fill="none" stroke="#2a1b16" strokeWidth="2.3" strokeLinecap="round" />
                  <path d={`M ${eye.x - 14} ${eye.y - 9.5} Q ${eye.x} ${eye.y - 16} ${eye.x + 14} ${eye.y - 9.5}`} fill="none" stroke="#a36f4f" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
                  <path d={`M ${eye.x - 11} ${eye.y + 6.8} Q ${eye.x} ${eye.y + 9.8} ${eye.x + 11} ${eye.y + 6.8}`} fill="none" stroke="#a36f4f" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
                </g>
              )
            })}
            <g ref={bind("brows")}>
              <path d="M 110 152 C 119 142 136 140 151 147 C 137 145 122 147 113 154 Z" fill="#33231d" opacity="0.92" />
              <path d="M 210 152 C 201 142 184 140 169 147 C 183 145 198 147 207 154 Z" fill="#33231d" opacity="0.92" />
            </g>

            {/* nose */}
            <path d="M 153 176 C 150 190 146 199 149 206" fill="none" stroke="#b07a58" strokeWidth="2.2" opacity="0.4" strokeLinecap="round" />
            <ellipse cx="161" cy="201" rx="5" ry="6.5" fill="#f6d7ba" opacity="0.5" filter={url("soft")} />
            <path d="M 147 207 C 151 212 156 211 160 212 C 164 211 169 212 173 207" fill="none" stroke="#9f6a4b" strokeWidth="1.8" opacity="0.55" strokeLinecap="round" />
            <ellipse cx="153.5" cy="208" rx="3" ry="1.7" fill="#7e4d35" opacity="0.5" />
            <ellipse cx="166.5" cy="208" rx="3" ry="1.7" fill="#7e4d35" opacity="0.5" />

            {/* mouth */}
            <ellipse ref={bind("chinShade")} cx={MOUTH_X} cy={MOUTH_Y + REST.down + REST.lowerLip + 6} rx="17" ry="4.5" fill="#a9714f" opacity="0.32" filter={url("soft")} />
            <g transform={`translate(${MOUTH_X} ${MOUTH_Y})`}>
              <path ref={bind("cavity")} d={REST.cavity} fill="#3f1217" />
              <g clipPath={url("mouthClip")}>
                <rect ref={bind("lowerTeeth")} {...REST.lowerTeeth} rx="3" fill={url("teeth")} />
                <ellipse ref={bind("tongue")} cx="0" {...REST.tongue} fill="#cf7273" />
                <ellipse ref={bind("tongueUp")} cx="0" ry="5.5" {...REST.tongueUp} fill="#d9797a" />
                <rect ref={bind("upperTeeth")} {...REST.upperTeeth} rx="3" fill={url("teeth")} />
                <ellipse ref={bind("tongueOut")} cx="0" ry="4.2" {...REST.tongueOut} fill="#de8283" />
              </g>
              <path ref={bind("lower")} d={REST.lower} fill={url("lipL")} />
              <path ref={bind("shine")} d={REST.shine} fill="none" stroke="#f3b8ad" strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />
              <path ref={bind("upper")} d={REST.upper} fill={url("lipU")} />
              <path ref={bind("seam")} d={REST.seam} fill="none" stroke="#6f2c2b" strokeWidth="1.3" strokeLinecap="round" />
              <rect ref={bind("tuck")} {...REST.tuck} height="6.5" rx="2" fill={url("teeth")} />
            </g>

            {/* hair in front: a side-swept fringe and the strands beside the face */}
            <path d="M 90 164 C 84 104 122 60 166 60 C 206 60 236 96 232 164 C 228 138 214 116 190 108 C 166 124 130 132 106 148 C 98 154 93 158 90 164 Z" fill={url("hair")} />
            <path d="M 91 152 C 82 188 84 226 95 258 C 84 242 77 214 77 188 C 77 172 82 160 91 152 Z" fill={url("hair")} />
            <path d="M 229 152 C 238 188 236 226 225 258 C 236 242 243 214 243 188 C 243 172 238 160 229 152 Z" fill={url("hair")} />
            <path d="M 116 88 C 140 70 174 66 202 82" fill="none" stroke="#7a5645" strokeWidth="2.4" opacity="0.5" strokeLinecap="round" />
            <path d="M 106 114 C 126 98 152 94 180 98" fill="none" stroke="#7a5645" strokeWidth="1.8" opacity="0.35" strokeLinecap="round" />
          </g>

          {/* blouse and jacket */}
          <path d="M 24 400 C 30 338 84 314 134 302 L 160 346 L 186 302 C 236 314 290 338 296 400 Z" fill={url("jacket")} />
          <path d="M 138 300 L 160 348 L 182 300 L 174 294 L 160 304 L 146 294 Z" fill="#f7f2eb" />
          <path d="M 134 302 L 160 346 L 148 366 L 108 318 Z" fill={jacket[1]} opacity="0.9" />
          <path d="M 186 302 L 160 346 L 172 366 L 212 318 Z" fill={jacket[1]} opacity="0.9" />
        </g>
      </svg>
      {name && <span className="face-tag">{name}</span>}
      {status && speaking && (
        <span className="face-live">
          <span className="bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {status}
        </span>
      )}
    </div>
  )
}
