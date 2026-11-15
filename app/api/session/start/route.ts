import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getProfile, saveSession } from "@/lib/session/store";
import { pickNext, memoryNoteFor } from "@/lib/questions/pick";
import type { Session, SessionStartResponse } from "@/types/contracts";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      learnerId?: string;
      role?: string;
      posting?: string | null;
    };
    const learnerId = body.learnerId || "maria";
    const profile = getProfile(learnerId);

    const firstQuestion = pickNext([], profile.weakSpots);
    if (!firstQuestion) {
      return NextResponse.json({ error: "No questions available" }, { status: 500 });
    }

    const session: Session = {
      sessionId: randomUUID(),
      learnerId,
      role: body.role || "home health aide",
      posting: body.posting ?? null,
      turns: [],
      startedAt: new Date().toISOString(),
    };
    saveSession(session);

    const res: SessionStartResponse = {
      session,
      profile,
      firstQuestion,
      memoryNote: memoryNoteFor(firstQuestion, profile.weakSpots),
    };
    return NextResponse.json(res);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not start session" }, { status: 500 });
  }
}