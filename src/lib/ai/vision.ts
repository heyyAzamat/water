import "server-only";

import type { AnalysisEnvelope, VisionAnalysis } from "@/types";
import { env, hasVisionKey } from "@/lib/env";
import { heuristicAnalysis } from "./heuristic";
import type { ImageFeatures } from "./image-features";
import { describeFeatures } from "./image-features";
import { buildUserPrompt, RESPONSE_SCHEMA, SYSTEM_INSTRUCTION } from "./prompt";
import { normaliseAnalysis } from "./scoring";

export interface AnalyseInput {
  /** Base64 image payload without the data-URL prefix. */
  imageBase64: string;
  mimeType: string;
  features?: ImageFeatures | null;
  context?: {
    locationName?: string | null;
    waterBodyType?: string | null;
    region?: string | null;
    capturedAt?: string | null;
    userNotes?: string | null;
    observations?: string[];
  };
}

export const HEURISTIC_MODEL = "aquavision-heuristic-v1";

/**
 * Run the vision analysis.
 *
 * Order of preference:
 *  1. Gemini vision with a structured JSON schema.
 *  2. The colourimetric heuristic engine (no key configured, or the API
 *     failed/timed out). Marked `simulated` so the UI never overstates it.
 */
export async function analyseImage(
  input: AnalyseInput,
): Promise<AnalysisEnvelope> {
  const started = Date.now();

  if (!hasVisionKey()) {
    return {
      analysis: heuristicAnalysis(input.features ?? null, input.context),
      model: HEURISTIC_MODEL,
      latencyMs: Date.now() - started,
      simulated: true,
    };
  }

  try {
    const analysis = await callGemini(input);
    return {
      analysis,
      model: env.VISION_MODEL,
      latencyMs: Date.now() - started,
      simulated: false,
    };
  } catch (error) {
    console.error("[aquavision] vision provider failed, using heuristics:", error);
    return {
      analysis: heuristicAnalysis(input.features ?? null, input.context),
      model: HEURISTIC_MODEL,
      latencyMs: Date.now() - started,
      simulated: true,
    };
  }
}

async function callGemini(input: AnalyseInput): Promise<VisionAnalysis> {
  // Imported lazily so the SDK never lands in a bundle that does not need it.
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY! });

  const prompt = [
    buildUserPrompt(input.context),
    input.features
      ? `\nMeasured image statistics (computed client-side, use as corroborating evidence): ${describeFeatures(input.features)}.`
      : "",
    input.context?.observations?.length
      ? `\nReporter also checked these on-site observations: ${input.context.observations.join(", ")}. Treat as unverified.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.VISION_TIMEOUT_MS);

  try {
    const response = await ai.models.generateContent({
      model: env.VISION_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: input.mimeType,
                data: input.imageBase64,
              },
            },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 2400,
        responseMimeType: "application/json",
        // The SDK's schema type is stricter than the JSON Schema subset we
        // author here; the shape is validated again by `normaliseAnalysis`.
        responseSchema: RESPONSE_SCHEMA as never,
        abortSignal: controller.signal,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from vision model");

    return normaliseAnalysis(parseJson(text));
  } finally {
    clearTimeout(timeout);
  }
}

/** Models occasionally wrap JSON in fences despite the schema. Be forgiving. */
function parseJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Vision model returned unparseable JSON");
  }
}
