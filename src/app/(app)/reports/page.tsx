import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FileSearch, ScanLine } from "lucide-react";
import type { ReportFilters as Filters, WaterBodyType, WaterQuality } from "@/types";
import { listLocations, listReports } from "@/lib/data/repository";
import { getT } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { EmptyState } from "@/components/shared/primitives";
import { ReportCard } from "@/components/reports/report-card";
import { Pagination, ReportFilters } from "@/components/reports/report-filters";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t.pages.reports.metaTitle,
    description: t.pages.reports.metaDescription,
  };
}

interface SearchParams {
  q?: string;
  quality?: string;
  type?: string;
  region?: string;
  minScore?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string;
  locationId?: string;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [params, t] = await Promise.all([searchParams, getT()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[1.6rem] font-semibold tracking-[-0.035em] text-ink-50">
            {t.pages.reports.title}
          </h1>
          <p className="mt-1.5 text-[14px] text-ink-400">
            {t.pages.reports.description}
          </p>
        </div>
        <Button asChild>
          <Link href="/upload">
            <ScanLine aria-hidden />
            {t.pages.reports.newAnalysis}
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <ReportsResults params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function ReportsResults({ params }: { params: SearchParams }) {
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const filters: Filters = {
    q: params.q,
    quality: (params.quality as WaterQuality | "all") ?? undefined,
    waterBodyType: (params.type as WaterBodyType | "all") ?? undefined,
    region: params.region && params.region !== "all" ? params.region : undefined,
    minScore: params.minScore ? Number(params.minScore) : undefined,
    from: params.from || undefined,
    to: params.to ? `${params.to}T23:59:59.999Z` : undefined,
    sort: (params.sort as Filters["sort"]) ?? "recent",
    locationId: params.locationId || undefined,
    page,
    pageSize: 12,
  };

  const [result, locations, t] = await Promise.all([
    listReports(filters),
    listLocations(),
    getT(),
  ]);

  const regions = [
    ...new Set(locations.map((l) => l.region).filter((r): r is string => Boolean(r))),
  ].sort();

  return (
    <>
      <ReportFilters
        locations={locations}
        regions={regions}
        total={result.total}
      />

      {result.items.length === 0 ? (
        <EmptyState
          icon={<FileSearch />}
          title={t.pages.reports.emptyTitle}
          description={t.pages.reports.emptyDescription}
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/reports">{t.pages.reports.resetFilters}</Link>
            </Button>
          }
          className="mt-6"
        />
      ) : (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((report, index) => (
              <ReportCard key={report.id} report={report} index={index} />
            ))}
          </div>

          <Pagination page={result.page} totalPages={result.totalPages} />
        </>
      )}
    </>
  );
}
