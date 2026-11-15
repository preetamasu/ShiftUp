import Anthropic from "@anthropic-ai/sdk";
import type {
  AnswerFeedback,
  DeliveryMetrics,
  Question,
} from "@/types/contracts";
import { FEEDBACK_SYSTEM_PROMPT } from "./prompt";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

const bilingual = {
  type: "object",
  properties: { en: { type: "string" }, es: { type: "string" } },
  required: ["en", "es"],
};

const feedbackTool = {
  name: "submit_feedback",
  description: "Submit the coaching feedback for this answer.",
  input_schema: {
    type: "object" as const,
    properties: {
      content: {
        type: "object",
        properties: {
          good: bilingual,
          fix: bilingual,
          sampleAnswer: bilingual,
          detailsUsed: { type: "array", items: { type: "string" } },
        },
        required: ["good", "fix", "sampleAnswer", "detailsUsed"],
      },
      delivery: {
        type: ["object", "null"],
        properties: {
          clarity: bilingual,
          confidence: bilingual,
          naturalness: bilingual,
          practiceNext: bilingual,
        },
      },
      weakSpotTag: { type: ["string", "null"] },
    },
    required: ["content", "delivery", "weakSpotTag"],
  },
};

export async function generateFeedback(args: {
  question: Question;
  transcript: string;
  metrics: DeliveryMetrics | null;
  knownStories?: string[];
}): Promise<AnswerFeedback> {
  const { question, transcript, metrics, knownStories = [] } = args;

  const userMessage = [
    `Question (tag: ${question.weakSpotTag}): ${question.en}`,
    `Worker's answer: ${transcript}`,
    metrics
      ? `Delivery numbers: ${JSON.stringify(metrics)}`
      : "Delivery numbers: none (typed or Spanish answer)",
    knownStories.length
      ? `Other details she told us before: ${knownStories.join("; ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 1500,
    system: FEEDBACK_SYSTEM_PROMPT,
    tools: [feedbackTool],
    tool_choice: { type: "tool", name: "submit_feedback" },
    messages: [{ role: "user", content: userMessage }],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("Claude did not return feedback");
  }
  const fb = block.input as AnswerFeedback;

  // Safety checks
  if (!metrics) fb.delivery = null;
  // Keep only details that really appear in what she said or told us before.
  const source = (transcript + " " + knownStories.join(" ")).toLowerCase();
  fb.content.detailsUsed = fb.content.detailsUsed.filter((d) =>
    source.includes(d.toLowerCase())
  );
  return fb;
}