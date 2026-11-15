
import { NextResponse } from "next/server";
import questions from "@/data/questions/home-health-aide.json";
import { generateFeedback } from "@/lib/feedback/generateFeedback";
import { getProfile, getSession, saveProfile, saveSession } from "@/lib/session/store";
import type { DeliveryMetrics, Question } from "@/types/contracts";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      sessionId: string;
      questionId: string;
      transcript: string;
      metrics?: DeliveryMetrics | null;
    };

    const question = (questions as Question[]).find((q) => q.id === body.questionId);
    if (!question) {
      return NextResponse.json({ error: "Unknown question" }, { status: 400 });
    }
    if (!body.transcript?.trim()) {
      return NextResponse.json({ error: "Empty answer" }, { status: 400 });
    }

    const session = getSession(body.sessionId);
    const profile = session ? getProfile(session.learnerId) : null;

    const feedback = await generateFeedback({
      question,
      transcript: body.transcript,
      metrics: body.metrics ?? null,
      knownStories: profile?.stories ?? [],
    });

    if (session && profile) {
      session.turns.push({
        question,
        transcript: body.transcript,
        metrics: body.metrics ?? null,
        feedback,
      });
      saveSession(session);

      // Weak spot goes on if feedback flags it, and comes off once she does well.
      const spots = new Set(profile.weakSpots);
      if (feedback.weakSpotTag) spots.add(feedback.weakSpotTag);
      else spots.delete(question.weakSpotTag);
      saveProfile({ ...profile, weakSpots: [...spots] });
    }

    return NextResponse.json(feedback);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Feedback failed" }, { status: 500 });
  }
}