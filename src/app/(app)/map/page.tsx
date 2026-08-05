import type { Metadata } from "next";
import { allMapReports } from "@/lib/data/repository";
import { getT } from "@/lib/i18n/server";
import { MapExplorer } from "@/components/map/map-explorer";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t.ui.mapPage.metaTitle,
    description: t.ui.mapPage.metaDescription,
  };
}

export default async function MapPage() {
  const reports = await allMapReports();
  return <MapExplorer reports={reports} />;
}
