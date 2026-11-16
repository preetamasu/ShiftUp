// Which outside services have keys in .env.local. A route whose service is
// missing answers with fake data so the screen can still be built against it.
export const configured = {
  aws: () => Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION),
  grok: () => Boolean(process.env.GROK_API_KEY || process.env.XAI_API_KEY),
  claude: () => Boolean(process.env.ANTHROPIC_API_KEY),
  /** Either language model: Grok is preferred when both keys are present. */
  llm: () => Boolean(process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.ANTHROPIC_API_KEY),
  supermemory: () => Boolean(process.env.SUPERMEMORY_API_KEY),
  gemini: () => Boolean(process.env.GEMINI_API_KEY),
}
