import { Suspense } from "react";
import { allMapReports, platformStats } from "@/lib/data/repository";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import {
  Benefits,
  Contact,
  Faq,
  Features,
  FinalCta,
  HowItWorks,
  SiteFooter,
  Statistics,
} from "@/components/landing/sections";
import { EditionMark } from "@/components/shared/abyss";
import { MapPreview, MapSkeleton } from "@/components/map/map-explorer";

export default async function LandingPage() {
  const [stats, user, t] = await Promise.all([
    platformStats(),
    getCurrentUser(),
    getT(),
  ]);

  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />

      <main id="main">
        <Hero stats={stats} />
        <HowItWorks />
        <Features />

        <section id="map" className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-5">
            <EditionMark left={t.mapSection.eyebrow} right="03" className="mb-12" />

            <div className="flex flex-col items-center text-center">
              <h2 className="text-lume-soft text-balance text-[clamp(2.2rem,6.5vw,4.25rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-ink-50">
                {t.mapSection.title}
                <span className="block text-ink-300/85">
                  {t.mapSection.titleSub}
                </span>
              </h2>
              <p className="mt-6 max-w-2xl text-pretty text-[15px] leading-relaxed text-ink-400 sm:text-base">
                {t.mapSection.description}
              </p>
            </div>

            {/* Streamed: the map payload is the heaviest query on the page and
                should not block the hero from painting. */}
            <div className="mt-14">
              <Suspense fallback={<MapSkeleton />}>
                <MapSection />
              </Suspense>
            </div>
          </div>
        </section>

        <Statistics stats={stats} />
        <Benefits />
        <Faq />
        <Contact />
        <FinalCta />
      </main>

      <SiteFooter />
    </>
  );
}

async function MapSection() {
  const reports = await allMapReports();
  return <MapPreview reports={reports} />;
}
