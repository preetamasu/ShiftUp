import { soundsLike } from "@/lib/pronounce"

// "Sounds like" spelling for one English word, for the word popover.
export async function GET(req: Request) {
  const word = new URL(req.url).searchParams.get("word")?.slice(0, 60)
  if (!word) return Response.json({ error: "word is required" }, { status: 400 })
  return Response.json({ word, soundsLike: soundsLike(word) })
}
