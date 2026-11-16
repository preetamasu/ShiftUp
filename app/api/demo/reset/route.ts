import { clearProfile } from "@/lib/memory"
import { clearLog } from "@/lib/sessionLog"

// Forgets one learner, so a demo can start from nothing.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { learnerId?: string }
  const learnerId = body.learnerId || "jaciel"
  await clearProfile(learnerId)
  await clearLog(learnerId)
  return Response.json({ ok: true, learnerId })
}
