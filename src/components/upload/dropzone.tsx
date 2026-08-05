"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImageUp, Loader2, RotateCcw, Upload, X } from "lucide-react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/provider";
import { fmt } from "@/lib/i18n/format";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  extractImageFeatures,
  type ImageFeatures,
} from "@/lib/ai/image-features";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_INPUT_BYTES = 25 * 1024 * 1024; // 25 MB before compression

export interface PreparedImage {
  /** Compressed file, ready to upload. */
  file: File;
  /** Object URL for preview — revoked when replaced. */
  previewUrl: string;
  /** Data URL without the prefix, for the vision request body. */
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  originalBytes: number;
  compressedBytes: number;
  features: ImageFeatures | null;
  capturedAt: string | null;
}

export function Dropzone({
  value,
  onChange,
  disabled,
}: {
  value: PreparedImage | null;
  onChange: (image: PreparedImage | null) => void;
  disabled?: boolean;
}) {
  const t = useT();
  const [dragging, setDragging] = React.useState(false);
  const [preparing, setPreparing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Object URLs leak if we don't revoke them when the image is swapped out.
  const previousUrl = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (previousUrl.current && previousUrl.current !== value?.previewUrl) {
      URL.revokeObjectURL(previousUrl.current);
    }
    previousUrl.current = value?.previewUrl ?? null;
  }, [value?.previewUrl]);

  React.useEffect(
    () => () => {
      if (previousUrl.current) URL.revokeObjectURL(previousUrl.current);
    },
    [],
  );

  const prepare = React.useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type as (typeof ACCEPTED)[number])) {
        toast.error(t.ui.dropzone.unsupported, {
          description: t.ui.dropzone.unsupportedBody,
        });
        return;
      }

      if (file.size > MAX_INPUT_BYTES) {
        toast.error(t.ui.dropzone.tooLarge, {
          description: fmt(t.ui.dropzone.tooLargeBody, {
            size: formatBytes(file.size),
          }),
        });
        return;
      }

      setPreparing(true);
      setProgress(4);

      try {
        // Compress before anything else: everything downstream — the vision
        // request, storage, the thumbnail — gets cheaper.
        const compressed = await imageCompression(file, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.86,
          fileType: file.type === "image/png" ? "image/png" : "image/jpeg",
          onProgress: (p) => setProgress(Math.max(4, Math.round(p * 0.6))),
        });

        setProgress(66);

        const [dimensions, features, base64] = await Promise.all([
          readDimensions(compressed),
          extractImageFeatures(compressed),
          fileToBase64(compressed),
        ]);

        setProgress(94);

        onChange({
          file: compressed,
          previewUrl: URL.createObjectURL(compressed),
          base64,
          mimeType: compressed.type,
          width: dimensions.width,
          height: dimensions.height,
          originalBytes: file.size,
          compressedBytes: compressed.size,
          features,
          capturedAt: file.lastModified
            ? new Date(file.lastModified).toISOString()
            : null,
        });

        setProgress(100);
      } catch (error) {
        console.error(error);
        toast.error(t.ui.dropzone.unreadable, {
          description: t.ui.dropzone.unreadableBody,
        });
      } finally {
        setPreparing(false);
        setTimeout(() => setProgress(0), 600);
      }
    },
    [onChange],
  );

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void prepare(file);
  }

  if (value) {
    const saved = value.originalBytes - value.compressedBytes;
    const savedPct = Math.round((saved / value.originalBytes) * 100);

    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="relative aspect-[16/10] bg-ink-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.previewUrl}
            alt={t.ui.dropzone.selectedAlt}
            className="size-full object-contain"
          />
          <div className="absolute right-3 top-3 flex gap-2">
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              aria-label={t.ui.dropzone.replace}
            >
              <RotateCcw />
            </Button>
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={() => onChange(null)}
              disabled={disabled}
              aria-label={t.ui.dropzone.remove}
            >
              <X />
            </Button>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/8 p-4 sm:grid-cols-4">
          <Meta
            label={t.ui.dropzone.dimensions}
            value={`${value.width} × ${value.height}`}
          />
          <Meta
            label={t.ui.dropzone.format}
            value={value.mimeType.replace("image/", "").toUpperCase()}
          />
          <Meta
            label={t.ui.dropzone.size}
            value={formatBytes(value.compressedBytes)}
          />
          <Meta
            label={t.ui.dropzone.compressed}
            value={savedPct > 0 ? `−${savedPct}%` : t.ui.dropzone.noGain}
            accent={savedPct > 0}
          />
        </dl>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void prepare(file);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300",
        dragging
          ? "border-aqua-400/60 bg-aqua-400/8"
          : "border-white/12 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.035]",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || preparing}
        className="flex w-full flex-col items-center gap-4 px-6 py-14 text-center"
      >
        <AnimatePresence mode="wait">
          {preparing ? (
            <motion.span
              key="preparing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="grid size-14 place-items-center rounded-2xl border border-aqua-400/25 bg-aqua-400/12"
            >
              <Loader2 className="size-6 animate-spin text-aqua-300" aria-hidden />
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "grid size-14 place-items-center rounded-2xl border transition-colors",
                dragging
                  ? "border-aqua-400/40 bg-aqua-400/15 text-aqua-200"
                  : "border-white/10 bg-white/5 text-ink-400",
              )}
            >
              {dragging ? (
                <ImageUp className="size-6" aria-hidden />
              ) : (
                <Upload className="size-6" aria-hidden />
              )}
            </motion.span>
          )}
        </AnimatePresence>

        <span>
          <span className="block text-[15px] font-medium text-ink-100">
            {preparing
              ? t.ui.dropzone.preparing
              : dragging
                ? t.ui.dropzone.dropToAnalyse
                : t.ui.dropzone.dragHere}
          </span>
          <span className="mt-1.5 block text-[13px] text-ink-500">
            {preparing
              ? t.ui.dropzone.preparingHint
              : t.ui.dropzone.browseHint}
          </span>
        </span>

        {preparing && (
          <span className="h-1 w-56 overflow-hidden rounded-full bg-white/8">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-lume-400 to-flux-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void prepare(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function Meta({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-600">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 font-mono text-[12.5px]",
          accent ? "text-grade-excellent" : "text-ink-200",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function readDimensions(file: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
