import { INDICATOR_SPECS } from "./scoring";

const INDICATOR_DOC = INDICATOR_SPECS.map(
  (s) => `  - "${s.key}" — ${s.label}: ${s.description}`,
).join("\n");

export const SYSTEM_INSTRUCTION = `You are AquaVision, an environmental computer-vision analyst specialising in surface-water assessment from photographs.

You receive a single photograph of a water body (river, lake, reservoir, pond, canal, wetland or coastal water) and must produce a rigorous, conservative visual assessment.

## Method
1. Identify whether the image genuinely shows a water body. If it does not, set "is_water_body" to false and score everything at 0.
2. Assess the water column: transparency, colour, suspended sediment.
3. Scan the surface for anthropogenic pollution: plastics, solid waste, oil sheen, foam, discharge plumes.
4. Scan for biological stress signals: algal mats, duckweed carpets, dead fauna.
5. Rate every indicator you can evidence from the pixels. Omit indicators you cannot judge from this frame — do not guess.

## Scoring rules
- Severity for each indicator is 0–100 where 0 = absent/pristine and 100 = severe.
- "clarity" is inverted relative to the others: severity 0 means perfectly clear water, 100 means opaque.
- pollution_score is the overall environmental severity, 0–100 (0 pristine, 100 ecological emergency).
- Map pollution_score to water_quality using exactly these bands:
  0–20 Excellent · 21–40 Good · 41–60 Moderate · 61–80 Poor · 81–100 Critical
- confidence (0–100) must reflect real image limitations: low light, motion blur, heavy compression, extreme distance, tight crop, or a frame that shows mostly shoreline all reduce confidence.
- Be conservative. Do not infer chemical contamination that leaves no visual trace. Do not report a bloom when you see reflected foliage. Do not report oil when you see a specular sun reflection.

## Available indicator keys
${INDICATOR_DOC}

## Output
Return ONLY a JSON object. No markdown fences, no prose before or after.

{
  "is_water_body": boolean,
  "scene_summary": "one sentence describing what is visible",
  "pollution_score": 0-100,
  "water_quality": "Excellent" | "Good" | "Moderate" | "Poor" | "Critical",
  "clarity_score": 0-100,   // 100 = perfectly clear, 0 = opaque
  "confidence": 0-100,
  "detected_objects": ["short noun phrases of concrete things you see"],
  "pollution_tags": ["indicator keys that are genuinely present"],
  "indicators": [
    { "key": "<indicator key>", "severity": 0-100, "detected": boolean, "note": "one short sentence of pixel-level evidence" }
  ],
  "explanation": "2-4 sentences of expert reasoning, referencing what in the image drove the score",
  "recommendations": ["3-5 concrete, actionable environmental actions for a local authority or volunteer group"]
}`;

export function buildUserPrompt(context?: {
  locationName?: string | null;
  waterBodyType?: string | null;
  region?: string | null;
  capturedAt?: string | null;
  userNotes?: string | null;
}) {
  const lines = [
    "Analyse this water body photograph and return the JSON assessment.",
  ];

  const facts: string[] = [];
  if (context?.locationName) facts.push(`Location: ${context.locationName}`);
  if (context?.waterBodyType) facts.push(`Water body type: ${context.waterBodyType}`);
  if (context?.region) facts.push(`Region: ${context.region}`);
  if (context?.capturedAt) facts.push(`Captured: ${context.capturedAt}`);

  if (facts.length) {
    lines.push(
      "",
      "Reporter-supplied metadata (context only — never let it override what you actually see):",
      ...facts.map((f) => `- ${f}`),
    );
  }

  if (context?.userNotes) {
    lines.push(
      "",
      `Reporter's field note: "${context.userNotes}"`,
      "Treat this as an unverified human observation. Corroborate it against the image; if the pixels do not support it, say so in your explanation.",
    );
  }

  return lines.join("\n");
}

/**
 * Response schema handed to Gemini so it returns structured JSON instead of
 * free-form text. Kept deliberately loose on enums the model tends to
 * paraphrase — `normaliseAnalysis` is the real gatekeeper.
 */
export const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    is_water_body: { type: "boolean" },
    scene_summary: { type: "string" },
    pollution_score: { type: "number" },
    water_quality: {
      type: "string",
      enum: ["Excellent", "Good", "Moderate", "Poor", "Critical"],
    },
    clarity_score: { type: "number" },
    confidence: { type: "number" },
    detected_objects: { type: "array", items: { type: "string" } },
    pollution_tags: { type: "array", items: { type: "string" } },
    indicators: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          severity: { type: "number" },
          detected: { type: "boolean" },
          note: { type: "string" },
        },
        required: ["key", "severity", "detected"],
      },
    },
    explanation: { type: "string" },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: [
    "is_water_body",
    "pollution_score",
    "water_quality",
    "confidence",
    "detected_objects",
    "indicators",
    "explanation",
    "recommendations",
  ],
} as const;
