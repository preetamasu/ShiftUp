import { NextResponse } from "next/server";
import { getProfile, getSession, saveSession } from "@/lib/session/store";
import { pickNext, memoryNoteFor } from "@/lib/questions/pick";
import type { NextQuestionResponse, Question } from "@/types/contracts";

export async function POST(req: Request) {
  try {
    const { sessionId } = (await req.json()) as { sessionId: string };
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Unknown session" }, { status: 404 });
    }

    const profile = getProfile(session.learnerId);
    const last = session.turns[session.turns.length - 1];
    const action = last?.feedback.nextAction;

    let question: Question | null = null;
    let kind: NextQuestionResponse["kind"] = "start";

    if (!last || !action) {
      question = session.pendingQuestion ?? pickNext([], profile.weakTypes);
    } else {
      kind = action.kind;
      if (action.kind === "retry" || action.kind === "practise") {
        question = last.question; // same question again
      } else if (action.kind === "followup" && action.textEn) {
        question = {
          id: `followup_${session.turns.length}`,
          type: last.question.type,
          source: "followup",
          textEn: action.textEn,
          textEs: action.textEs,
        };
      } else if (action.kind === "finish") {
        question = null;
      } else {
        const asked = session.turns.map((t) => t.question.id);
        question = pickNext(asked, profile.weakTypes);
      }
    }

    session.pendingQuestion = question;
    saveSession(session);

    const res: NextQuestionResponse = {
      question,
      done: question === null,
      kind,
      memoryNote: question ? memoryNoteFor(question, profile.weakTypes) : null,
    };
    return NextResponse.json(res);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not pick question" }, { status: 500 });
  }
}
