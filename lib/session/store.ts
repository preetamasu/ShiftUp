import fs from "fs";
import path from "path";
import type { Session, LearnerProfile } from "@/types/contracts";

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "db.json");

type DB = {
  sessions: Record<string, Session>;
  profiles: Record<string, LearnerProfile>;
};

const MARIA: LearnerProfile = {
  learnerId: "maria",
  stories: [
    "Cared for an elderly client with dementia for two years",
    "Switched shifts with a coworker after a scheduling disagreement",
  ],
  weakSpots: [],
  weakTypes: ["conflict"],
};

function read(): DB {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return { sessions: {}, profiles: {} };
  }
}

function write(db: DB) {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

export function getSession(id: string): Session | null {
  return read().sessions[id] ?? null;
}

export function saveSession(session: Session) {
  const db = read();
  db.sessions[session.sessionId] = session;
  write(db);
}

export function getProfile(learnerId: string): LearnerProfile {
  const saved = read().profiles[learnerId];
  if (saved) return saved;
  if (learnerId === "maria") return MARIA;
  return { learnerId, stories: [], weakSpots: [], weakTypes: [] };
}

export function saveProfile(profile: LearnerProfile) {
  const db = read();
  db.profiles[profile.learnerId] = profile;
  write(db);
}