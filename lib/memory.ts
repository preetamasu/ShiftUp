import { NotFoundError, Supermemory } from "supermemory"
import { configured } from "./config"
import { readJson, removeJson, writeJson } from "./localStore"
import type { Profile } from "./types"

// Learner memory lives in two places. Supermemory is the long-term memory: it
// extracts her stories and struggles from each turn and keeps them across
// sessions. A local JSON copy holds the structured state the app steers by
// (which question types to revisit) and is the fallback when Supermemory is
// slow or has no key, so the "last time you struggled with..." moment never
// depends on the network.

const EMPTY: Profile = { stories: [], weakSpots: [] }
const key = (learnerId: string) => `profile_${learnerId}`
const namespace = (learnerId: string) => `learner_${learnerId.replace(/[^a-zA-Z0-9_:-]/g, "_")}`

const BUCKETS = {
  stories: "Real work stories the learner has told: what happened, what she did, and how it ended",
  weak_spots: "Interview question types, English phrases and speaking habits the learner struggles with or asked for help with",
}

let client: Supermemory | undefined
const supermemory = () => (client ??= new Supermemory()) // reads SUPERMEMORY_API_KEY

const localProfile = (learnerId: string) => readJson<Profile>(key(learnerId), EMPTY)

/** Her profile at session start. Stories come from Supermemory when it has any; everything falls back to the local copy. */
export async function getProfile(learnerId: string): Promise<Profile> {
  const local = await localProfile(learnerId)
  if (!configured.supermemory()) return local
  try {
    const { profile } = await supermemory().profile(
      namespace(learnerId),
      { buckets: ["stories", "weak_spots"] },
      { timeoutInSeconds: 5, maxRetries: 0 },
    )
    const stories = (profile.buckets?.stories ?? []).map((m) => m.memory)
    const remembered = (profile.buckets?.weak_spots ?? []).map((m) => m.memory)
    return { stories: stories.length ? stories : local.stories, weakSpots: local.weakSpots, remembered }
  } catch (err) {
    console.warn("Supermemory profile read failed; using the local copy.", err instanceof Error ? err.message : err)
    return local
  }
}

export type Turn = {
  sessionId: string
  /** Plain-text record of what happened, for Supermemory to extract memories from. */
  record: string
  story?: string | null
  weakSpot?: string | null
}

/** Saves a turn. The local write is awaited; the Supermemory write runs in the background so it never delays her feedback. */
export async function rememberTurn(learnerId: string, turn: Turn): Promise<void> {
  const profile = await localProfile(learnerId)
  const stories = turn.story && !profile.stories.includes(turn.story) ? [...profile.stories, turn.story] : profile.stories
  // Most recent weak spot first, no duplicates.
  const weakSpots = turn.weakSpot ? [turn.weakSpot, ...profile.weakSpots.filter((w) => w !== turn.weakSpot)] : profile.weakSpots
  await writeJson(key(learnerId), { stories, weakSpots })

  if (!configured.supermemory()) return
  // Reusing the session id keeps one session as one growing document. "instant"
  // makes the memories readable right away instead of minutes later.
  const ns = namespace(learnerId)
  void supermemory()
    .add(ns, { content: turn.record, id: turn.sessionId, metadata: { source: "interview-practice" }, dreaming: "instant" })
    .then(() => ensureBuckets(ns))
    .catch((err) => console.warn("Supermemory write failed; the local copy has this turn.", err instanceof Error ? err.message : err))
}

// Buckets can only be set once the namespace exists, which is after its first document.
const bucketsSet = new Set<string>()
async function ensureBuckets(ns: string): Promise<void> {
  if (bucketsSet.has(ns)) return
  await supermemory().profiles.setBuckets(ns, { buckets: BUCKETS })
  bucketsSet.add(ns)
}

/** Loads a known profile (the demo persona) into both stores. Returns Supermemory's processing state. */
export async function seedProfile(learnerId: string, about: string, profile: Profile): Promise<"off" | "done" | "pending" | "failed"> {
  await writeJson(key(learnerId), profile)
  if (!configured.supermemory()) return "off"
  try {
    const ns = namespace(learnerId)
    const record = [
      "Notes from this learner's earlier interview-practice sessions.",
      ...profile.stories.map((s) => `Work story the learner told: ${s}.`),
      ...profile.weakSpots.map((w) => `The learner struggles with: ${w}.`),
    ].join("\n")
    // A namespace only exists after its first document, and buckets can only be
    // set on an existing namespace. So: who she is, then the buckets, then the
    // record, whose memories are sorted into those buckets.
    await supermemory().add(ns, { content: about, id: "about", metadata: { source: "seed" }, dreaming: "instant" })
    await supermemory().profiles.setBuckets(ns, { buckets: BUCKETS })
    bucketsSet.add(ns)
    const { id } = await supermemory().add(ns, { content: record, id: "seed", metadata: { source: "seed" }, dreaming: "instant" })
    // Wait until the memories exist, so a session started right after seeding can
    // read them. The document reaches "done" first; memory formation ("dreaming")
    // finishes some seconds later. The SDK types do not declare dreamingStatus yet.
    for (let attempt = 0; attempt < 20; attempt++) {
      const doc = await supermemory().documents.get(ns, id)
      const system = doc.system as { status?: string; dreamingStatus?: string } | undefined
      if (system?.status === "failed") return "failed"
      if (system?.status === "done" && system.dreamingStatus === "done") return "done"
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
    return "pending"
  } catch (err) {
    console.warn("Supermemory seed failed; the local copy is loaded.", err instanceof Error ? err.message : err)
    return "failed"
  }
}

/** Forgets a learner in both stores. */
export async function clearProfile(learnerId: string): Promise<void> {
  await removeJson(key(learnerId))
  if (!configured.supermemory()) return
  try {
    bucketsSet.delete(namespace(learnerId))
    await supermemory().namespaces.delete(namespace(learnerId))
  } catch (err) {
    if (!(err instanceof NotFoundError)) console.warn("Supermemory reset failed.", err instanceof Error ? err.message : err)
  }
}
