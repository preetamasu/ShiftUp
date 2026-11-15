import fs from "fs";
import path from "path";
import type { Session, LearnerProfile } from "@/types/contracts";
import fakeProfile from "@/data/fake/profile.json";

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "db.json");

type DB = {
  sessions: Record<string, Session>;
  profiles: Record<string, LearnerProfile>;
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
  const db = read();
  if (db.profiles[learnerId]) return db.profiles[learnerId];
  if (learnerId === "maria") return fakeProfile as LearnerProfile;
  return { learnerId, stories: [], weakSpots: [] };
}

export function saveProfile(profile: LearnerProfile) {
  const db = read();
  db.profiles[profile.learnerId] = profile;
  write(db);
}