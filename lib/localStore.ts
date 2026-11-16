import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

// Small JSON files under data/local (git-ignored). Used for the session log and
// as the local fallback copy of what Supermemory holds.
const DIR = path.join(process.cwd(), "data", "local")
const fileFor = (name: string) => path.join(DIR, `${name.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`)

export async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(fileFor(name), "utf8")) as T
  } catch {
    return fallback
  }
}

export async function writeJson(name: string, value: unknown): Promise<void> {
  await mkdir(DIR, { recursive: true })
  await writeFile(fileFor(name), JSON.stringify(value, null, 2), "utf8")
}

export async function removeJson(name: string): Promise<void> {
  await rm(fileFor(name), { force: true })
}
