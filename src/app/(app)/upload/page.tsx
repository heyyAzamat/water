import type { Metadata } from "next";
import { Cpu } from "lucide-react";
import { capabilities } from "@/lib/env";
import { listLocations } from "@/lib/data/repository";
import { getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { UploadFlow } from "@/components/upload/upload-flow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t.pages.upload.metaTitle,
    description: t.pages.upload.metaDescription,
  };
}

export default async function UploadPage() {
  const [locations, t] = await Promise.all([listLocations(), getT()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.6rem] font-semibold tracking-[-0.035em] text-ink-50">
            {t.pages.upload.title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-400">
            {t.pages.upload.description}
          </p>
        </div>

        <Badge variant="brand" size="md" className="shrink-0">
          <Cpu />
          {capabilities.vision === "gemini"
            ? t.pages.upload.engineGemini
            : t.pages.upload.engineDefault}
        </Badge>
      </div>


      <div className="mt-6">
        <UploadFlow locations={locations} />
      </div>
    </div>
  );
}
