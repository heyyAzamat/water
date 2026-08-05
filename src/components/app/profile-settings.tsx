"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Crosshair, Save } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/provider";
import { formatCoords } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Switch, Separator } from "@/components/ui/misc";

export function ProfileSettings({
  user,
}: {
  user: {
    id: string;
    name: string;
    bio: string | null;
    region: string | null;
    isDemo: boolean;
  };
}) {
  const t = useT();
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [locating, setLocating] = React.useState(false);

  const [form, setForm] = React.useState({
    fullName: user.name,
    bio: user.bio ?? "",
    region: user.region ?? "",
    notifyNearby: true,
    notifyTrend: true,
    notifyRadiusKm: 25,
    homeLat: "",
    homeLng: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      toast.error(t.ui.settings.geoUnavailable);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        set("homeLat", position.coords.latitude.toFixed(6));
        set("homeLng", position.coords.longitude.toFixed(6));
        setLocating(false);
        toast.success(t.ui.settings.geoCentred);
      },
      () => {
        setLocating(false);
        toast.error(t.ui.settings.geoFailed);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          bio: form.bio.trim() || null,
          region: form.region.trim() || null,
          notifyNearby: form.notifyNearby,
          notifyTrend: form.notifyTrend,
          notifyRadiusKm: form.notifyRadiusKm,
          homeLat: form.homeLat ? Number(form.homeLat) : null,
          homeLng: form.homeLng ? Number(form.homeLng) : null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? `Failed (${response.status})`);
      }

      toast.success(t.ui.settings.saved);
      router.refresh();
    } catch (error) {
      toast.error(t.ui.settings.saveFailed, {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  const hasHome = form.homeLat !== "" && form.homeLng !== "";

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Profile &amp; notifications</CardTitle>
        <CardDescription>
          Your public details, and the area you want to be alerted about.
        </CardDescription>
      </CardHeader>

      <form onSubmit={save} className="flex flex-col gap-5 px-5 pb-6 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.ui.settings.displayName} htmlFor="fullName" required>
            <Input
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              maxLength={80}
              required
            />
          </Field>

          <Field
            label={t.ui.settings.region}
            htmlFor="region"
            hint={t.ui.settings.regionHint}
          >
            <Input
              value={form.region}
              onChange={(e) => set("region", e.target.value)}
              placeholder={t.ui.settings.regionPlaceholder}
              maxLength={120}
            />
          </Field>
        </div>

        <Field
          label={t.ui.settings.bio}
          htmlFor="bio"
          hint={t.ui.settings.bioHint}
        >
          <Textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value.slice(0, 280))}
            rows={3}
            placeholder={t.ui.settings.bioPlaceholder}
          />
        </Field>

        <Separator />

        <div>
          <h3 className="text-[14px] font-semibold text-ink-50">
            Alert preferences
          </h3>
          <p className="mt-1 text-[13px] text-ink-400">
            Alerts fire when a report is published inside your radius, or when a
            location&apos;s trend turns critical.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <ToggleRow
              id="notifyNearby"
              label={t.ui.settings.nearbyLabel}
              description={t.ui.settings.nearbyDescription}
              checked={form.notifyNearby}
              onChange={(v) => set("notifyNearby", v)}
            />
            <ToggleRow
              id="notifyTrend"
              label={t.ui.settings.trendLabel}
              description={t.ui.settings.trendDescription}
              checked={form.notifyTrend}
              onChange={(v) => set("notifyTrend", v)}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="radius"
            className="flex items-center justify-between text-[13px] font-medium text-ink-300"
          >
            Monitoring radius
            <span className="font-semibold tabular-nums text-ink-100">
              {form.notifyRadiusKm} km
            </span>
          </label>
          <input
            id="radius"
            type="range"
            min={1}
            max={200}
            step={1}
            value={form.notifyRadiusKm}
            onChange={(e) => set("notifyRadiusKm", Number(e.target.value))}
            className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-aqua-400 [&::-webkit-slider-thumb]:shadow-lg"
          />
        </div>

        <div>
          <div className="flex items-end gap-2">
            <Field
              label={t.ui.settings.homeLat}
              htmlFor="homeLat"
              className="flex-1"
            >
              <Input
                value={form.homeLat}
                onChange={(e) => set("homeLat", e.target.value)}
                placeholder="43.238900"
                inputMode="decimal"
              />
            </Field>
            <Field
              label={t.ui.settings.homeLng}
              htmlFor="homeLng"
              className="flex-1"
            >
              <Input
                value={form.homeLng}
                onChange={(e) => set("homeLng", e.target.value)}
                placeholder="76.889700"
                inputMode="decimal"
              />
            </Field>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={useMyLocation}
              loading={locating}
              aria-label={t.ui.settings.useMyLocation}
              title={t.ui.settings.useMyLocation}
            >
              {!locating && <Crosshair />}
            </Button>
          </div>
          {hasHome && (
            <p className="mt-2 font-mono text-[11.5px] text-ink-500">
              {formatCoords(Number(form.homeLat), Number(form.homeLng))} · alerts
              within {form.notifyRadiusKm} km
            </p>
          )}
        </div>

        {user.isDemo && (
          <p className="rounded-xl border border-aqua-400/20 bg-aqua-400/6 p-3 text-[12px] leading-relaxed text-ink-300">
            This instance runs on the bundled demo dataset, so profile changes
            are not persisted between restarts. Connect Supabase to store them.
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            <Save />
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-white/8 bg-white/[0.025] p-3.5">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="text-[13px] font-medium text-ink-100">
          {label}
        </label>
        <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">
          {description}
        </p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
