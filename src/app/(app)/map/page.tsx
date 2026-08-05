import type { Metadata } from "next";
import { allMapReports } from "@/lib/data/repository";
import { MapExplorer } from "@/components/map/map-explorer";

export const metadata: Metadata = {
  title: "Live map",
  description:
    "Every water assessment, clustered and heat-mapped by pollution severity.",
};

export default async function MapPage() {
  const reports = await allMapReports();
  return <MapExplorer reports={reports} />;
}
