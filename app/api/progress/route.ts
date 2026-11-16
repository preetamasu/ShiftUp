import { getProgress } from "@/lib/sessionLog"
import type { ProgressResponse } from "@/lib/types"

export async function GET(req: Request) {
  const learnerId = new URL(req.url).searchParams.get("learnerId")
  if (!learnerId) return Response.json({ error: "learnerId is required" }, { status: 400 })

  const response: ProgressResponse = { sessions: await getProgress(learnerId) }
  return Response.json(response)
}
