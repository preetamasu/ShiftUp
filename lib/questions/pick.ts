import bank from "@/data/questions/home-health-aide.json";
import type { Bilingual, Question } from "@/types/contracts";

const questions = bank as Question[];

// Weak spots come first. After that, go in bank order.
export function pickNext(askedIds: string[], weakSpots: string[]): Question | null {
  const remaining = questions.filter((q) => !askedIds.includes(q.id));
  const weak = remaining.find((q) => weakSpots.includes(q.weakSpotTag));
  return weak ?? remaining[0] ?? null;
}

const TOPICS: Record<string, Bilingual> = {
  why_job: { en: "explain why you want this job", es: "explicar por qué quiere este trabajo" },
  coworker_conflict: { en: "describe a conflict with a coworker", es: "describir un conflicto con un compañero de trabajo" },
  family_upset: { en: "describe an upset client or family member", es: "describir a un cliente o familiar molesto" },
  dementia_care: { en: "talk about dementia care", es: "hablar del cuidado de personas con demencia" },
  lifting: { en: "explain safe lifting", es: "explicar cómo levantar de forma segura" },
  medication: { en: "explain how you handle medication", es: "explicar cómo maneja la medicina" },
  emergency: { en: "describe what you do in an emergency", es: "describir qué hace en una emergencia" },
  scheduling: { en: "explain how you plan your day", es: "explicar cómo planea su día" },
  dignity: { en: "explain personal care with privacy", es: "explicar el cuidado personal con privacidad" },
  strength: { en: "describe your biggest strength", es: "describir su mayor fortaleza" },
};

export function memoryNoteFor(question: Question, weakSpots: string[]): Bilingual | null {
  if (!weakSpots.includes(question.weakSpotTag)) return null;
  const t = TOPICS[question.weakSpotTag];
  if (!t) return null;
  return {
    en: `Last time you found it hard to ${t.en}, so let's try that again.`,
    es: `La última vez le costó ${t.es}, así que lo intentamos de nuevo.`,
  };
}