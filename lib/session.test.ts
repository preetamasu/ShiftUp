import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./config", () => ({ configured: { llm: vi.fn(() => true) } }))
vi.mock("./llm", () => ({ writeQuestion: vi.fn() }))

import { configured } from "./config"
import { writeQuestion } from "./llm"
import { QUESTION_BANK } from "./questions"
import { createSession, nextQuestion } from "./session"

const llm = vi.mocked(configured.llm)
const write = vi.mocked(writeQuestion)
const written = (move: "followup" | "next") => ({ move, textEn: "Written?", textEs: "¿Escrita?", askingEn: "Hear this.", askingEs: "Oír esto." })
const start = (extra: { jobPosting?: string; resume?: string } = {}) =>
  createSession({ learnerId: "t", name: "T", role: "home_health_aide", profile: { stories: [], weakSpots: [] }, ...extra })

beforeEach(() => {
  llm.mockReturnValue(true)
  write.mockReset()
})

describe("nextQuestion", () => {
  it("asks the bank question as written when there is nothing to react to", async () => {
    const session = start()
    expect(await nextQuestion(session)).toEqual(QUESTION_BANK[0])
    expect(write).not.toHaveBeenCalled()
  })

  it("follows up on an answered question, keeping its type", async () => {
    const session = start()
    const first = await nextQuestion(session)
    session.answers = { [first.id]: "I made a schedule with her." }
    write.mockResolvedValue(written("followup"))
    const second = await nextQuestion(session)
    expect(second).toMatchObject({ source: "followup", type: first.type, textEn: "Written?" })
    expect(second.id).not.toBe(first.id)
  })

  it("never follows up twice in a row", async () => {
    const session = start()
    const first = await nextQuestion(session)
    session.answers = { [first.id]: "I made a schedule with her." }
    write.mockResolvedValue(written("followup"))
    const second = await nextQuestion(session)
    session.answers[second.id] = "She took it."
    expect(await nextQuestion(session)).toEqual(QUESTION_BANK[1])
    expect(write).toHaveBeenCalledTimes(1)
  })

  it("moves on to the bank question when the model chooses to", async () => {
    const session = start()
    const first = await nextQuestion(session)
    session.answers = { [first.id]: "A complete answer." }
    write.mockResolvedValue(written("next"))
    expect(await nextQuestion(session)).toEqual(QUESTION_BANK[1])
  })

  it("words the planned question around a posting or resume, keeping its id and type", async () => {
    const session = start({ jobPosting: "Weekend availability required." })
    write.mockResolvedValue(written("next"))
    const first = await nextQuestion(session)
    expect(first).toMatchObject({ id: QUESTION_BANK[0].id, type: QUESTION_BANK[0].type, source: "posting", textEn: "Written?" })
    expect(write.mock.calls[0][0].allowFollowup).toBe(false)
  })

  it("ignores a follow-up the model wrote when none was allowed", async () => {
    const session = start({ resume: "Caregiver, 2021 to 2023." })
    write.mockResolvedValue(written("followup"))
    expect(await nextQuestion(session)).toEqual(QUESTION_BANK[0])
  })

  it("falls back to the bank when the model fails or there is no model", async () => {
    const session = start({ jobPosting: "Weekend availability required." })
    write.mockRejectedValue(new Error("down"))
    expect(await nextQuestion(session)).toEqual(QUESTION_BANK[0])
    llm.mockReturnValue(false)
    expect(await nextQuestion(session)).toEqual(QUESTION_BANK[1])
    expect(write).toHaveBeenCalledTimes(1)
  })
})
