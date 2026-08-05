import { Suspense } from "react";
import { allMapReports, platformStats } from "@/lib/data/repository";
import { getCurrentUser } from "@/lib/auth";
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
import { SectionHeading } from "@/components/shared/primitives";
import { MapPreview, MapSkeleton } from "@/components/map/map-explorer";

export default async function LandingPage() {
  const [stats, user] = await Promise.all([platformStats(), getCurrentUser()]);

  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />

      <main id="main">
        <Hero stats={stats} />
        <HowItWorks />
        <Features />

        <section id="map" className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-5">
            <SectionHeading
              eyebrow="Live map"
              title="Every assessment, on one map"
              description="Markers are coloured by severity and cluster by density. Switch to the heat layer to see where pollution concentrates across a whole basin."
            />
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
