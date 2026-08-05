import Link from "next/link";
import { ArrowLeft, Droplets, ScanLine, TrendingDown } from "lucide-react";
import { AmbientBackdrop, Logo } from "@/components/shared/primitives";
import { platformStats } from "@/lib/data/repository";
import { compactNumber } from "@/lib/utils";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stats = await platformStats();

  return (
    <div className="relative isolate grid min-h-dvh lg:grid-cols-2">
      <AmbientBackdrop intensity={0.7} />

      {/* Form column */}
      <div className="relative flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-ink-400 transition-colors hover:bg-white/6 hover:text-ink-100"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to site
          </Link>
        </div>

        <main
          id="main"
          className="flex flex-1 items-center justify-center py-10"
        >
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <p className="text-center text-[11.5px] text-ink-600">
          By continuing you agree that assessments you publish are visible to
          everyone — environmental data is a public good.
        </p>
      </div>

      {/* Marketing column */}
      <aside className="relative hidden overflow-hidden border-l border-white/8 bg-ink-900/40 lg:flex lg:flex-col lg:justify-center">
        <div
          className="pointer-events-none absolute inset-0 grid-noise opacity-50"
          aria-hidden
        />
        <div className="relative px-14 py-16">
          <h2 className="max-w-md text-balance text-[2.1rem] font-semibold leading-[1.12] tracking-[-0.035em] text-ink-50">
            Join the network watching{" "}
            <span className="text-gradient-aqua">the water nobody measures.</span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-400">
            {compactNumber(stats.contributors)} contributors have published{" "}
            {compactNumber(stats.reports)} AI assessments across{" "}
            {stats.locations} water bodies in {stats.countries} countries.
          </p>

          <ul className="mt-10 flex flex-col gap-5">
            {[
              {
                icon: ScanLine,
                title: "Analysis in seconds",
                body: "Thirteen pollution indicators scored from a single photograph, with an evidence note for each.",
              },
              {
                icon: TrendingDown,
                title: "Trends you can defend",
                body: "Confidence-weighted regression with a noise floor, so seasonal variation is never reported as a crisis.",
              },
              {
                icon: Droplets,
                title: "No hardware, ever",
                body: "A camera and a browser. Nothing to procure, install, calibrate or maintain in the field.",
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-aqua-400/20 bg-aqua-400/10 text-aqua-200">
                  <item.icon className="size-[18px]" aria-hidden />
                </span>
                <div>
                  <p className="text-[14.5px] font-medium text-ink-100">
                    {item.title}
                  </p>
                  <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-500">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
