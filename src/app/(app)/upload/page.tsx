import type { Metadata } from "next";
import { Cpu, Info } from "lucide-react";
import { capabilities } from "@/lib/env";
import { listLocations } from "@/lib/data/repository";
import { Badge } from "@/components/ui/badge";
import { UploadFlow } from "@/components/upload/upload-flow";

export const metadata: Metadata = {
  title: "New analysis",
  description:
    "Upload a photograph of a water body and get an AI environmental assessment.",
};

export default async function UploadPage() {
  const locations = await listLocations();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.6rem] font-semibold tracking-[-0.035em] text-ink-50">
            Analyse a water body
          </h1>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-400">
            One photograph is enough. The vision model scores thirteen pollution
            indicators, a weighted matrix composes the overall severity, and the
            result joins the location&apos;s time series.
          </p>
        </div>

        <Badge
          variant={capabilities.vision === "gemini" ? "brand" : "neutral"}
          size="md"
          className="shrink-0"
        >
          <Cpu />
          {capabilities.vision === "gemini"
            ? "Gemini Vision active"
            : "Heuristic engine"}
        </Badge>
      </div>

      {capabilities.vision === "heuristic" && (
        <div className="mt-5 flex gap-3 rounded-xl border border-aqua-400/20 bg-aqua-400/6 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-aqua-300" aria-hidden />
          <p className="text-[12.5px] leading-relaxed text-ink-300">
            No vision API key is configured, so uploads are scored by the
            built-in colourimetric engine — it measures real image statistics
            (contrast, colour casts, edge density, hue entropy) and maps them
            onto the same indicator matrix. Set{" "}
            <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[11.5px] text-ink-200">
              GOOGLE_GENERATIVE_AI_API_KEY
            </code>{" "}
            in <code className="font-mono text-[11.5px] text-ink-200">.env.local</code>{" "}
            to switch to full model analysis.
          </p>
        </div>
      )}

      <div className="mt-6">
        <UploadFlow locations={locations} />
      </div>
    </div>
  );
}
