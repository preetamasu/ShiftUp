import bank from "@/data/questions.hha.json";
import type { Bilingual, Question } from "@/types/contracts";

const questions = bank as Question[];

// Questions of a weak type come first, then the rest of the bank in order.
export function pickNext(askedIds: string[], weakTypes: string[]): Question | null {
  const remaining = questions.filter((q) => !askedIds.includes(q.id));
  const weak = remaining.find((q) => weakTypes.includes(q.type));
  return weak ?? remaining[0] ?? null;
}

const TOPICS: Record<string, Bilingual> = {
  conflict: {
    en: "describe a conflict with a coworker",
    es: "describir un conflicto con un compañero de trabajo",
  },
  reliability: {
    en: "explain how you stay reliable",
    es: "explicar cómo cumple con sus responsabilidades",
  },
  client_care: {
    en: "talk about caring for a client",
    es: "hablar del cuidado de un cliente",
  },
  safety_physical: {
    en: "explain how you keep clients safe",
    es: "explicar cómo mantiene seguros a los clientes",
  },
  why_this_job: {
    en: "explain why you want this job",
    es: "explicar por qué quiere este trabajo",
  },
  availability: {
    en: "explain your availability",
    es: "explicar su disponibilidad",
  },
};

export function memoryNoteFor(question: Question, weakTypes: string[]): Bilingual | null {
  if (!weakTypes.includes(question.type)) return null;
  const t = TOPICS[question.type];
  if (!t) return null;
  return {
    en: `Last time you found it hard to ${t.en}, so let's try that again.`,
    es: `La última vez le costó ${t.es}, así que lo intentamos de nuevo.`,
  };
}
