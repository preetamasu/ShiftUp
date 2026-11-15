import { NextResponse } from "next/server";
import { getProfile, getSession } from "@/lib/session/store";
import { pickNext, memoryNoteFor } from "@/lib/questions/pick";

export async function POST(req: Request) {
  try {
    const { sessionId } = (await req.json()) as { sessionId: string };
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Unknown session" }, { status: 404 });
    }

    const profile = getProfile(session.learnerId);
    const asked = session.turns.map((t) => t.question.id);
    const question = pickNext(asked, profile.weakSpots);

    return NextResponse.json({
      question,
      done: question === null,
      memoryNote: question ? memoryNoteFor(question, profile.weakSpots) : null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not pick question" }, { status: 500 });
  }
}