export type Bilingual = { en: string; es: string };

export type Question = {
  id: string;
  type: string;
  weakSpotTag: string;
  en: string;
  es: string;
};

export type DeliveryMetrics = {
  startDelayMs: number;
  longPauseCount: number;
  wordsPerMinute: number;
  restartCount: number;
  hedgePhrases: string[];
  unclearWords: string[];
};

export type ContentFeedback = {
  good: Bilingual;
  fix: Bilingual;
  sampleAnswer: Bilingual;
  detailsUsed: string[];
};

export type DeliveryFeedback = {
  clarity: Bilingual;
  confidence: Bilingual;
  naturalness: Bilingual;
  practiceNext: Bilingual;
};

export type AnswerFeedback = {
  content: ContentFeedback;
  delivery: DeliveryFeedback | null;
  weakSpotTag: string | null;
};

export type Turn = {
  question: Question;
  transcript: string;
  metrics: DeliveryMetrics | null;
  feedback: AnswerFeedback;
};

export type Session = {
  sessionId: string;
  learnerId: string;
  role: string;
  posting: string | null;
  turns: Turn[];
  startedAt: string;
};

export type LearnerProfile = {
  learnerId: string;
  stories: string[];
  weakSpots: string[];
};

export type ProgressEntry = {
  sessionId: string;
  date: string;
  avgStartDelayMs: number;
  avgLongPauses: number;
  avgWordsPerMinute: number;
  contentFixCount: number;
};

export type SessionStartResponse = {
  session: Session;
  profile: LearnerProfile;
  firstQuestion: Question;
  memoryNote: Bilingual | null;
};

export type CoachRequest = { sessionId: string; questionId: string; textEs: string };
export type CoachResponse = { replyEs: string };
