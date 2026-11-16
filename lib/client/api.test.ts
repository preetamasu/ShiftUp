import { afterEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_NAME, loadName, loadSetup } from "./api"

const store = (saved: string | null) => ({ getItem: () => saved })

describe("the remembered name", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("is the name saved in this browser", () => {
    vi.stubGlobal("localStorage", store("Ana María"))
    expect(loadName()).toBe("Ana María")
  })

  it("is the default when nothing is saved", () => {
    vi.stubGlobal("localStorage", store(null))
    expect(loadName()).toBe("Jaciel")
  })

  it("is the new default in a browser that saved the old one", () => {
    vi.stubGlobal("localStorage", store("Haciel"))
    expect(loadName()).toBe(DEFAULT_NAME)
  })

  it("is not taken from a setup saved under the old default", () => {
    vi.stubGlobal("localStorage", store(null))
    vi.stubGlobal("sessionStorage", store(JSON.stringify({ learnerId: "haciel", name: "Haciel", role: "home_health_aide", spanishFirst: false })))
    expect(loadSetup()).toMatchObject({ name: "Jaciel", learnerId: "jaciel" })
  })
})
