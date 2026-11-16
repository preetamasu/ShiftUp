import demo from "@/data/seed/demo.json"
import { seedProfile } from "@/lib/memory"
import { setLog } from "@/lib/sessionLog"

// Loads the demo history (stories, weak spots and two earlier sessions) for the
// learner named in the request. Run it well before a demo: Supermemory needs
// about half a minute to form the memories.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { learnerId?: string; name?: string }
  const learnerId = body.learnerId || "jaciel"
  const name = body.name || "Jaciel"
  const memory = await seedProfile(learnerId, demo.about.replaceAll("{name}", name), demo.profile)
  await setLog(learnerId, demo.sessions)
  return Response.json({ ok: true, learnerId, jobPosting: demo.jobPosting, memory })
}
