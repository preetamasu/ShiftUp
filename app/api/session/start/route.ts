import { getProfile } from "@/lib/memory"
import { createSession, nextQuestion } from "@/lib/session"
import type { SessionStartRequest, SessionStartResponse } from "@/lib/types"

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Partial<SessionStartRequest> | null
  if (!body?.learnerId || !body.role) {
    return Response.json({ error: "learnerId and role are required" }, { status: 400 })
  }

  const profile = await getProfile(body.learnerId)
  const session = createSession({
    learnerId: body.learnerId,
    name: body.name?.trim() || "The learner",
    role: body.role,
    jobPosting: body.jobPosting,
    resume: body.resume?.slice(0, 6000),
    profile,
  })
  const response: SessionStartResponse = { sessionId: session.id, profile, question: await nextQuestion(session) }
  return Response.json(response)
}
