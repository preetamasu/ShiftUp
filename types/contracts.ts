export type Bilingual = { en: string; es: string };

export type Question = {
  id: string;
  type: string; // conflict, reliability, client_care, safety_physical, why_this_job, availability
  source: "bank" | "posting" | "followup";
  textEn: string;
  textEs: string;
};

export type Word = {
  text: string;
  start: number | null; // seconds
  end: number | null;
  type?: string;
};

export type NextAction = {
  kind: "retry" | "practise" | "followup" | "next_question" | "finish";
  reason: Bilingual;
  textEn: string;
  textEs: string;
};

export type DeliveryFeedback = {
  clarity: Bilingual;
  confidence: Bilingual;
  naturalness: Bilingual;
  practiseNext: Bilingual;
};

export type Feedback = {
  content: {
    good: Bilingual;
    fix: Bilingual;
    sampleAnswerEn: string;
    usedDetails: string[];
  };
  delivery: DeliveryFeedback | null; // null for Spanish answers
  weakSpots: string[];
  nextAction: NextAction;
};

// What Preetam's /answer returns
export type AnswerResponse = {
  transcript: string;
  language?: string;
  words: Word[];
  timeUnit?: "seconds";
  feedback: Feedback;
  memory?: unknown;
  turnId?: string;
};

export type Turn = {
  question: Question;
  transcript: string;
  feedback: Feedback;
  at: string;
};

export type Session = {
  sessionId: string;
  learnerId: string;
  role: string;
  jobPosting: string | null;
  pendingQuestion: Question | null; // the question she is answering now
  turns: Turn[];
  startedAt: string;
};

export type LearnerProfile = {
  learnerId: string;
  stories: string[];
  weakSpots: string[]; // free text from Gemini
  weakTypes: string[]; // question types she needs more practice on
};

export type SessionStartResponse = {
  sessionId: string;
  session: Session;
  profile: LearnerProfile;
  question: Question;
  memoryNote: Bilingual | null;
};

export type NextQuestionResponse = {
  question: Question | null;
  done: boolean;
  kind: NextAction["kind"] | "start";
  memoryNote: Bilingual | null;
};
