import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getProfile, saveSession } from "@/lib/session/store";
import { pickNext, memoryNoteFor } from "@/lib/questions/pick";
import type { Session, SessionStartResponse } from "@/types/contracts";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      learnerId?: string;
      role?: string;
      jobPosting?: string | null;
    };
    const learnerId = body.learnerId || "maria";
    const profile = getProfile(learnerId);

    const question = pickNext([], profile.weakTypes);
    if (!question) {
      return NextResponse.json({ error: "No questions available" }, { status: 500 });
    }

    const session: Session = {
      sessionId: randomUUID(),
      learnerId,
      role: body.role || "home_health_aide",
      jobPosting: body.jobPosting ?? null,
      pendingQuestion: question,
      turns: [],
      startedAt: new Date().toISOString(),
    };
    saveSession(session);

    const res: SessionStartResponse = {
      sessionId: session.sessionId,
      session,
      profile,
      question,
      memoryNote: memoryNoteFor(question, profile.weakTypes),
    };
    return NextResponse.json(res);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not start session" }, { status: 500 });
  }
}
