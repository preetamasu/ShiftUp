// Small inline icon set (stroke icons in the Lucide style). Decorative by default.
const PATHS = {
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z M5 11a7 7 0 0 0 14 0 M12 18v3",
  stop: "M7 7h10v10H7z",
  play: "M8 5v14l11-7z",
  repeat: "M4 12a8 8 0 0 1 13.7-5.7L20 8 M20 4v4h-4 M20 12a8 8 0 0 1-13.7 5.7L4 16 M4 20v-4h4",
  check: "M5 12.5l4.5 4.5L19 7.5",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  back: "M19 12H5 M11 6l-6 6 6 6",
  chat: "M4 5h16v11H9l-5 4z",
  close: "M6 6l12 12 M18 6L6 18",
  sound: "M4 10v4h3l5 4V6L7 10z M16 9a4 4 0 0 1 0 6 M18.5 6.5a8 8 0 0 1 0 11",
  edit: "M4 20h4L19 9l-4-4L4 16z M14 6l4 4",
  bulb: "M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3Z",
  ear: "M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0 M10 10a2 2 0 0 1 4 0",
  heart: "M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z",
  wave: "M3 12h2 M7 8v8 M11 5v14 M15 9v6 M19 11v2",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2",
  chart: "M4 20V10 M10 20V4 M16 20v-7 M21 20H3",
  brain: "M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5.5A3.5 3.5 0 0 0 9 18h1V4z M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5.5A3.5 3.5 0 0 1 15 18h-1V4z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 11v5 M12 8h.01",
  bookmark: "M6 4h12v16l-6-4-6 4z",
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name].split(" M").map((d, i) => (
        <path key={i} d={i === 0 ? d : `M${d}`} />
      ))}
    </svg>
  )
}
