import { getSession, nextQuestion } from "@/lib/session"
import type { NextQuestionRequest, NextQuestionResponse } from "@/lib/types"

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Partial<NextQuestionRequest> | null
  const session = body?.sessionId ? getSession(body.sessionId) : undefined
  if (!session) return Response.json({ error: "unknown sessionId" }, { status: 404 })

  const response: NextQuestionResponse = { question: await nextQuestion(session) }
  return Response.json(response)
}
