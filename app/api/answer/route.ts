import { NextResponse } from "next/server";
import { getProfile, getSession, saveProfile, saveSession } from "@/lib/session/store";
import type { AnswerResponse } from "@/types/contracts";

const VOICE_URL = process.env.VOICE_API_URL ?? "http://127.0.0.1:8000";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const sessionId = String(form.get("sessionId") ?? "");
    const audio = form.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "Missing audio" }, { status: 400 });
    }
    const session = getSession(sessionId);
    if (!session || !session.pendingQuestion) {
      return NextResponse.json({ error: "Unknown session or no question" }, { status: 404 });
    }

    const question = session.pendingQuestion;
    const out = new FormData();
    out.append("audio", audio, audio.name || "answer.webm");
    out.append("question", question.textEn);
    out.append("learner_id", session.learnerId);

    const res = await fetch(`${VOICE_URL}/answer`, { method: "POST", body: out });
    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json({ error: "Voice server failed", detail }, { status: 502 });
    }
    const data = (await res.json()) as AnswerResponse;

    session.turns.push({
      question,
      transcript: data.transcript,
      feedback: data.feedback,
      at: new Date().toISOString(),
    });
    saveSession(session);

    // Types she should revisit: add on retry/practise, remove once she moves on cleanly.
    const profile = getProfile(session.learnerId);
    const types = new Set(profile.weakTypes);
    const kind = data.feedback.nextAction.kind;
    if (kind === "retry" || kind === "practise") types.add(question.type);
    else if (data.feedback.weakSpots.length === 0) types.delete(question.type);
    saveProfile({
      ...profile,
      weakTypes: [...types],
      weakSpots: [...new Set([...profile.weakSpots, ...data.feedback.weakSpots])].slice(-10),
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Answer failed" }, { status: 500 });
  }
}
