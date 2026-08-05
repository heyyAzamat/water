"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Crosshair,
  Cpu,
  FileText,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AnalysisEnvelope,
  CommunityObservation,
  WaterBodyType,
  WaterLocation,
} from "@/types";
import { gradeForScore } from "@/lib/ai/scoring";
import { cn, formatCoords } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { useT } from "@/lib/i18n/provider";
import { fmt } from "@/lib/i18n/format";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/field";
import { ScoreRing } from "@/components/shared/score-ring";
import { QualityBadge } from "@/components/shared/primitives";
import { IndicatorBars } from "@/components/charts/score-charts";
import { Dropzone, type PreparedImage } from "./dropzone";

const OBSERVATIONS: CommunityObservation[] = [
  "bad_smell",
  "dead_fish",
  "foam",
  "illegal_dumping",
  "nearby_factory",
  "discolored_water",
  "oil_sheen",
  "excess_vegetation",
];

const WATER_TYPES: WaterBodyType[] = [
  "river",
  "lake",
  "reservoir",
  "pond",
  "canal",
  "wetland",
  "sea",
  "other",
];

type Stage = "compose" | "analysing" | "review" | "publishing";

export function UploadFlow({ locations }: { locations: WaterLocation[] }) {
  const t = useT();
  const router = useRouter();

  const [image, setImage] = React.useState<PreparedImage | null>(null);
  const [stage, setStage] = React.useState<Stage>("compose");
  const [envelope, setEnvelope] = React.useState<AnalysisEnvelope | null>(null);
  const [step, setStep] = React.useState(0);

  const [locationId, setLocationId] = React.useState("");
  const [newLocationName, setNewLocationName] = React.useState("");
  const [waterType, setWaterType] = React.useState<WaterBodyType>("river");
  const [region, setRegion] = React.useState("");
  const [coords, setCoords] = React.useState<{ lat: string; lng: string }>({
    lat: "",
    lng: "",
  });
  const [locating, setLocating] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [observations, setObservations] = React.useState<CommunityObservation[]>([]);

  const selectedLocation = locations.find((l) => l.id === locationId) ?? null;
  const resolvedName = selectedLocation?.name ?? newLocationName.trim();

  const hasCoords =
    Number.isFinite(Number(coords.lat)) &&
    Number.isFinite(Number(coords.lng)) &&
    coords.lat !== "" &&
    coords.lng !== "";

  const canAnalyse = Boolean(image) && stage === "compose";
  const canPublish =
    Boolean(envelope) &&
    title.trim().length >= 3 &&
    (Boolean(selectedLocation) || (resolvedName.length >= 2 && hasCoords));

  /* ----------------------------- geolocation ----------------------------- */
  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      toast.error(t.ui.upload.geoUnavailable);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        });
        setLocating(false);
        toast.success(t.ui.upload.geoCaptured);
      },
      (error) => {
        setLocating(false);
        toast.error(t.ui.upload.geoFailed, {
          description:
            error.code === error.PERMISSION_DENIED
              ? t.ui.upload.geoDenied
              : error.message,
        });
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  /* ------------------------------- analyse ------------------------------- */
  async function analyse() {
    if (!image) return;

    setStage("analysing");
    setStep(0);

    // Staged copy while the request is in flight — the request is one round
    // trip, but the user should see what the pipeline is doing.
    const ticker = setInterval(() => setStep((s) => Math.min(s + 1, 3)), 1100);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: image.base64,
          mimeType: image.mimeType,
          features: image.features,
          context: {
            locationName: resolvedName || null,
            waterBodyType: selectedLocation?.type ?? waterType,
            region: selectedLocation?.region ?? region ?? null,
            capturedAt: image.capturedAt,
            userNotes: description.trim() || null,
            observations,
          },
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Analysis failed (${response.status})`);
      }

      const result = (await response.json()) as AnalysisEnvelope;
      setEnvelope(result);

      if (!result.analysis.is_water_body) {
        toast.warning(t.ui.upload.notWaterToastTitle, {
          description:
            t.ui.upload.notWaterToastBody,
        });
      }

      // Suggest a title so publishing is one click for most people.
      if (!title.trim()) {
        setTitle(suggestTitle(t, result, resolvedName));
      }

      setStage("review");
    } catch (error) {
      console.error(error);
      toast.error(t.ui.upload.analysisFailed, {
        description:
          error instanceof Error ? error.message : t.ui.upload.tryAgain,
      });
      setStage("compose");
    } finally {
      clearInterval(ticker);
    }
  }

  /* ------------------------------- publish ------------------------------- */
  async function publish() {
    if (!image || !envelope) return;
    setStage("publishing");

    try {
      const form = new FormData();
      form.append("image", image.file, image.file.name || "upload.jpg");
      form.append(
        "payload",
        JSON.stringify({
          analysis: envelope.analysis,
          model: envelope.model,
          latencyMs: envelope.latencyMs,
          simulated: envelope.simulated,
          title: title.trim(),
          description: description.trim() || null,
          observations,
          capturedAt: image.capturedAt,
          width: image.width,
          height: image.height,
          bytes: image.compressedBytes,
          mimeType: image.mimeType,
          features: image.features,
          location: selectedLocation
            ? { id: selectedLocation.id }
            : {
                name: resolvedName,
                waterBodyType: waterType,
                region: region.trim() || null,
                lat: Number(coords.lat),
                lng: Number(coords.lng),
              },
          lat: selectedLocation ? selectedLocation.lat : Number(coords.lat),
          lng: selectedLocation ? selectedLocation.lng : Number(coords.lng),
        }),
      );

      const response = await fetch("/api/reports", { method: "POST", body: form });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Could not publish (${response.status})`);
      }

      const { id } = (await response.json()) as { id: string };
      toast.success(t.ui.upload.published, {
        description: t.ui.upload.publishedBody,
      });
      router.push(`/reports/${id}`);
    } catch (error) {
      console.error(error);
      toast.error(t.ui.upload.publishFailed, {
        description:
          error instanceof Error ? error.message : t.ui.upload.tryAgain,
      });
      setStage("review");
    }
  }

  const busy = stage === "analysing" || stage === "publishing";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr] [&>*]:min-w-0">
      {/* ------------------------------ Left: input ------------------------------ */}
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle as="h2">{t.ui.upload.step1Title}</CardTitle>
            <CardDescription>
              {t.ui.upload.step1Body}
            </CardDescription>
          </CardHeader>
          <div className="px-5 pb-5 sm:px-6">
            <Dropzone value={image} onChange={setImage} disabled={busy} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">{t.ui.upload.step2Title}</CardTitle>
            <CardDescription>
              {t.ui.upload.step2Body}
            </CardDescription>
          </CardHeader>

          <div className="flex flex-col gap-4 px-5 pb-5 sm:px-6">
            <Field
              label={t.ui.upload.knownWaterBody}
              htmlFor="locationId"
              hint={t.ui.upload.knownWaterBodyHint}
            >
              <NativeSelect
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                disabled={busy}
              >
                <option value="">{t.ui.upload.addNewLocation}</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                    {location.region ? ` — ${location.region}` : ""}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            {!selectedLocation && (
              <div className="flex flex-col gap-4 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <Field label={t.ui.upload.locationName} htmlFor="newLocationName" required>
                  <Input
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder={t.ui.upload.locationNamePlaceholder}
                    disabled={busy}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={t.ui.upload.waterBodyType} htmlFor="waterType">
                    <NativeSelect
                      value={waterType}
                      onChange={(e) => setWaterType(e.target.value as WaterBodyType)}
                      disabled={busy}
                    >
                      {WATER_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {t.domain.waterBody[type]}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>

                  <Field
                    label={t.ui.upload.region}
                    htmlFor="region"
                    hint={t.ui.upload.regionOptional}
                  >
                    <Input
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder={t.ui.upload.regionPlaceholder}
                      disabled={busy}
                    />
                  </Field>
                </div>

                <div>
                  {/* Wraps rather than squeezing: two number inputs plus a
                      button do not fit side by side on a 320 px screen. */}
                  <div className="flex flex-wrap items-end gap-2">
                    <Field
                      label={t.ui.upload.latitude}
                      htmlFor="lat"
                      required
                      className="min-w-28 flex-1"
                    >
                      <Input
                        value={coords.lat}
                        onChange={(e) =>
                          setCoords((c) => ({ ...c, lat: e.target.value }))
                        }
                        placeholder="51.128100"
                        inputMode="decimal"
                        disabled={busy}
                      />
                    </Field>
                    <Field
                      label={t.ui.upload.longitude}
                      htmlFor="lng"
                      required
                      className="min-w-28 flex-1"
                    >
                      <Input
                        value={coords.lng}
                        onChange={(e) =>
                          setCoords((c) => ({ ...c, lng: e.target.value }))
                        }
                        placeholder="71.430400"
                        inputMode="decimal"
                        disabled={busy}
                      />
                    </Field>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={useMyLocation}
                      loading={locating}
                      disabled={busy}
                      aria-label={t.ui.upload.useMyLocation}
                      title={t.ui.upload.useMyLocation}
                    >
                      {!locating && <Crosshair />}
                    </Button>
                  </div>
                  {hasCoords && (
                    <p className="mt-2 font-mono text-[11.5px] text-ink-500">
                      {formatCoords(Number(coords.lat), Number(coords.lng))}
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedLocation && (
              <div className="flex items-center gap-3 rounded-xl border border-lume-400/20 bg-lume-400/6 p-3.5">
                <MapPin className="size-4 shrink-0 text-lume-300" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-ink-100">
                    {selectedLocation.name}
                  </p>
                  <p className="font-mono text-[11px] text-ink-500">
                    {formatCoords(selectedLocation.lat, selectedLocation.lng)} ·{" "}
                    {t.domain.waterBody[selectedLocation.type]}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">{t.ui.upload.step3Title}</CardTitle>
            <CardDescription>
              {t.ui.upload.step3Body}
            </CardDescription>
          </CardHeader>

          <div className="flex flex-col gap-4 px-5 pb-5 sm:px-6">
            <fieldset>
              <legend className="mb-2.5 text-[13px] font-medium text-ink-300">
                {t.ui.upload.observationsLegend}
              </legend>
              <div className="flex flex-wrap gap-2">
                {OBSERVATIONS.map((observation) => {
                  const active = observations.includes(observation);
                  return (
                    <button
                      key={observation}
                      type="button"
                      role="checkbox"
                      aria-checked={active}
                      disabled={busy}
                      onClick={() =>
                        setObservations((prev) =>
                          active
                            ? prev.filter((v) => v !== observation)
                            : [...prev, observation],
                        )
                      }
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-[12.5px] font-medium transition-all duration-200",
                        active
                          ? "border-lume-400/40 bg-lume-400/12 text-lume-100"
                          : "border-white/10 bg-white/[0.03] text-ink-400 hover:border-white/20 hover:text-ink-200",
                      )}
                    >
                      {t.domain.observations[observation]}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <Field
              label={t.ui.upload.fieldNote}
              htmlFor="description"
              hint={t.ui.upload.fieldNoteHint}
            >
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={busy}
                placeholder={t.ui.upload.fieldNotePlaceholder}
              />
            </Field>
          </div>
        </Card>
      </div>

      {/* ----------------------------- Right: result ----------------------------- */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <AnimatePresence mode="wait">
          {stage === "analysing" ? (
            <motion.div
              key="analysing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <AnalysingPanel step={step} image={image} />
            </motion.div>
          ) : envelope ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <ResultPanel
                envelope={envelope}
                title={title}
                onTitleChange={setTitle}
                onPublish={publish}
                canPublish={canPublish}
                publishing={stage === "publishing"}
                onReanalyse={() => {
                  setEnvelope(null);
                  setStage("compose");
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <Card className="p-6">
                <span className="grid size-11 place-items-center rounded-xl border border-lume-400/20 bg-lume-400/10 text-lume-200">
                  <Brain className="size-5" aria-hidden />
                </span>
                <h2 className="mt-4 text-[16px] font-semibold text-ink-50">
                  {t.ui.upload.readyTitle}
                </h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-400">
                  {t.ui.upload.readyBody}
                </p>

                <ul className="mt-5 flex flex-col gap-2.5">
                  {t.ui.upload.readyList.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-[13px] text-ink-400"
                    >
                      <CheckCircle2
                        className="size-3.5 shrink-0 text-lume-400"
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  className="mt-6 w-full"
                  disabled={!canAnalyse}
                  onClick={analyse}
                >
                  <Sparkles aria-hidden />
                  {image ? t.ui.upload.runAnalysis : t.ui.upload.addPhotoFirst}
                </Button>

                {image && !hasCoords && !selectedLocation && (
                  <p className="mt-3 flex gap-2 text-[12px] leading-relaxed text-ink-500">
                    <AlertTriangle
                      className="mt-0.5 size-3.5 shrink-0 text-grade-moderate"
                      aria-hidden
                    />
                    {t.ui.upload.coordsWarning}
                  </p>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Panels
 * ------------------------------------------------------------------ */

/** Icons only — labels and details come from the dictionary, by index. */
const STAGE_ICONS = [Cpu, Brain, Sparkles, FileText];

function AnalysingPanel({
  step,
  image,
}: {
  step: number;
  image: PreparedImage | null;
}) {
  const t = useT();

  return (
    <Card className="overflow-hidden">
      {image && (
        <div className="relative aspect-[16/10] overflow-hidden bg-abyss-1000">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.previewUrl}
            alt=""
            className="size-full object-cover opacity-70"
          />
          <div className="absolute inset-0 overflow-hidden" aria-hidden>
            <div
              className="absolute inset-x-0 h-20 animate-scan"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, oklch(0.82 0.11 193 / 0.3), transparent)",
                boxShadow: "0 0 50px 10px oklch(0.82 0.11 193 / 0.22)",
              }}
            />
          </div>
        </div>
      )}

      <div className="p-6">
        <h2 className="text-[16px] font-semibold text-ink-50">
          {t.ui.upload.analysingTitle}
        </h2>
        <p className="mt-1.5 text-[13px] text-ink-400">
          {t.ui.upload.analysingBody}
        </p>

        <ol className="mt-5 flex flex-col gap-3">
          {t.ui.upload.stages.map((entry, i) => {
            const done = i < step;
            const active = i === step;
            const Icon = STAGE_ICONS[i] ?? Cpu;
            return (
              <li key={entry.label} className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg border transition-colors",
                    done
                      ? "border-grade-excellent/30 bg-grade-excellent/12 text-grade-excellent"
                      : active
                        ? "border-lume-400/35 bg-lume-400/12 text-lume-200"
                        : "border-white/8 bg-white/4 text-ink-600",
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="size-4" aria-hidden />
                  ) : active ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Icon className="size-4" aria-hidden />
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-[13px] font-medium",
                      done || active ? "text-ink-100" : "text-ink-500",
                    )}
                  >
                    {entry.label}
                  </span>
                  <span className="block text-[11.5px] text-ink-600">
                    {entry.detail}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}

function ResultPanel({
  envelope,
  title,
  onTitleChange,
  onPublish,
  canPublish,
  publishing,
  onReanalyse,
}: {
  envelope: AnalysisEnvelope;
  title: string;
  onTitleChange: (value: string) => void;
  onPublish: () => void;
  canPublish: boolean;
  publishing: boolean;
  onReanalyse: () => void;
}) {
  const t = useT();
  const { analysis } = envelope;
  const grade = gradeForScore(analysis.pollution_score);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-col items-center gap-4 p-6 pb-5">
          <ScoreRing score={analysis.pollution_score} size={176} />
          <QualityBadge
            quality={analysis.water_quality}
            score={analysis.pollution_score}
            size="lg"
          />
          <p className="text-center text-[13px] leading-relaxed text-ink-400">
            {t.grades[grade.quality].blurb}
          </p>

          <div className="flex w-full items-center justify-center gap-4 border-t border-white/8 pt-4 text-center">
            <Metric
              label={t.ui.upload.metricConfidence}
              value={`${analysis.confidence}%`}
            />
            <div className="h-8 w-px bg-white/8" aria-hidden />
            <Metric
              label={t.ui.upload.metricClarity}
              value={`${analysis.clarity_score}/100`}
            />
            <div className="h-8 w-px bg-white/8" aria-hidden />
            <Metric
              label={t.ui.upload.metricLatency}
              value={`${(envelope.latencyMs / 1000).toFixed(1)}s`}
            />
          </div>

          <Badge variant={envelope.simulated ? "neutral" : "brand"} size="sm">
            <Cpu />
            {envelope.simulated ? t.ui.upload.heuristicEngine : envelope.model}
          </Badge>
          {envelope.simulated && (
            <p className="text-center text-[11.5px] leading-relaxed text-ink-600">
              {t.ui.upload.heuristicNote}
            </p>
          )}
        </div>
      </Card>

      {!analysis.is_water_body && (
        <div className="flex gap-3 rounded-xl border border-grade-moderate/30 bg-grade-moderate/8 p-4">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-grade-moderate"
            aria-hidden
          />
          <p className="text-[12.5px] leading-relaxed text-ink-200">
            {t.ui.upload.notWaterWarning}
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t.ui.upload.explanationTitle}</CardTitle>
        </CardHeader>
        <div className="px-5 pb-5 sm:px-6">
          <p className="text-[13.5px] leading-relaxed text-ink-300">
            {analysis.explanation}
          </p>

          {analysis.detected_objects.length > 0 && (
            <>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-600">
                {t.ui.upload.detected}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {analysis.detected_objects.map((object) => (
                  <Badge key={object} variant="outline" size="sm">
                    {object}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t.ui.upload.indicatorsTitle}</CardTitle>
          <CardDescription>{t.ui.upload.indicatorsBody}</CardDescription>
        </CardHeader>
        <div className="px-5 pb-5 sm:px-6">
          <IndicatorBars indicators={analysis.indicators} />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t.ui.upload.recommendationsTitle}</CardTitle>
        </CardHeader>
        <div className="px-5 pb-5 sm:px-6">
          <ul className="flex flex-col gap-2.5">
            {analysis.recommendations.map((recommendation) => (
              <li
                key={recommendation}
                className="flex gap-2.5 text-[13px] leading-relaxed text-ink-300"
              >
                <ArrowRight
                  className="mt-1 size-3.5 shrink-0 text-lume-400"
                  aria-hidden
                />
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t.ui.upload.publishTitle}</CardTitle>
          <CardDescription>{t.ui.upload.publishBody}</CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-4 px-5 pb-5 sm:px-6">
          <Field label={t.ui.upload.reportTitle} htmlFor="title" required>
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={t.ui.upload.reportTitlePlaceholder}
              maxLength={160}
            />
          </Field>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              className="flex-1"
              onClick={onPublish}
              loading={publishing}
              disabled={!canPublish}
            >
              <FileText aria-hidden />
              {t.ui.upload.publish}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onReanalyse}
              disabled={publishing}
            >
              {t.ui.upload.startOver}
            </Button>
          </div>

          {!canPublish && !publishing && (
            <p className="text-[12px] leading-relaxed text-ink-500">
              {t.ui.upload.publishBlocked}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-600">
        {label}
      </p>
      <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-ink-100">
        {value}
      </p>
    </div>
  );
}

function suggestTitle(
  t: Dictionary,
  envelope: AnalysisEnvelope,
  place: string,
) {
  const { analysis } = envelope;
  const where = place || t.ui.upload.titleFallbackPlace;

  if (analysis.pollution_score >= 81) {
    return fmt(t.ui.upload.titleCritical, { place: where });
  }
  const worst = [...analysis.indicators]
    .filter((i) => i.key !== "clarity" && i.detected)
    .sort((a, b) => b.severity - a.severity)[0];

  if (worst) {
    return fmt(t.ui.upload.titleDetected, {
      indicator: t.domain.indicators[worst.key].label,
      place: where,
    });
  }
  return fmt(t.ui.upload.titleBaseline, { place: where });
}
