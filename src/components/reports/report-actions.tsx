"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Download,
  Link2,
  Loader2,
  Printer,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { ModerationStatus } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";

export function ReportActions({
  reportId,
  shareToken,
  title,
  canModerate,
  canDelete,
  status,
}: {
  reportId: string;
  shareToken: string;
  title: string;
  canModerate: boolean;
  canDelete: boolean;
  status: ModerationStatus;
}) {
  const router = useRouter();
  const [exporting, setExporting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/r/${shareToken}`
      : `/r/${shareToken}`;

  /**
   * PDF export.
   *
   * html2canvas-pro rather than html2canvas: the design system is authored in
   * oklch, which classic html2canvas cannot parse and silently renders black.
   */
  async function exportPdf() {
    setExporting(true);
    try {
      const target = document.getElementById("report-document");
      if (!target) throw new Error("Report content not found");

      const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0b1220",
        logging: false,
      });

      const pdf = new JsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const usableWidth = pageWidth - margin * 2;
      const scaledHeight = (canvas.height * usableWidth) / canvas.width;

      const image = canvas.toDataURL("image/jpeg", 0.92);

      // Slice the tall canvas across as many A4 pages as it needs.
      let remaining = scaledHeight;
      let offset = 0;

      while (remaining > 0) {
        pdf.addImage(
          image,
          "JPEG",
          margin,
          margin - offset,
          usableWidth,
          scaledHeight,
          undefined,
          "FAST",
        );
        remaining -= pageHeight - margin * 2;
        offset += pageHeight - margin * 2;
        if (remaining > 0) pdf.addPage();
      }

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 60);

      pdf.save(`aquavision-${slug || reportId}.pdf`);
      toast.success("PDF exported");
    } catch (error) {
      console.error(error);
      toast.error("Could not generate the PDF", {
        description: "Try the print option instead — it produces the same layout.",
      });
    } finally {
      setExporting(false);
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Clipboard unavailable", { description: shareUrl });
    }
  }

  async function moderate(next: ModerationStatus) {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) throw new Error(`Failed (${response.status})`);
      toast.success(`Report marked ${next}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Moderation failed");
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`Failed (${response.status})`);
      toast.success("Report deleted");
      router.push("/reports");
    } catch (error) {
      console.error(error);
      toast.error("Could not delete this report");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 no-print">
        <Button variant="secondary" size="sm" onClick={exportPdf} disabled={exporting}>
          {exporting ? <Loader2 className="animate-spin" /> : <Download />}
          {exporting ? "Generating…" : "Export PDF"}
        </Button>

        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer />
          Print
        </Button>

        <Button variant="outline" size="sm" onClick={copyShareLink}>
          {copied ? <Check /> : <Link2 />}
          {copied ? "Copied" : "Share link"}
        </Button>

        {(canModerate || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <ShieldCheck />
                Manage
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {canModerate && (
                <>
                  <DropdownMenuLabel>Moderation · {status}</DropdownMenuLabel>
                  <DropdownMenuItem onSelect={() => moderate("approved")}>
                    <Check />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => moderate("flagged")}>
                    <ShieldCheck />
                    Flag for review
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => moderate("rejected")}>
                    <Trash2 />
                    Reject
                  </DropdownMenuItem>
                </>
              )}

              {canDelete && (
                <>
                  {canModerate && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    destructive
                    onSelect={() => setConfirmDelete(true)}
                  >
                    <Trash2 />
                    Delete permanently
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this report?</DialogTitle>
            <DialogDescription>
              The photograph, its AI analysis and every comment will be removed.
              This cannot be undone, and the location loses this point from its
              trend series.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              Keep it
            </Button>
            <Button variant="danger" onClick={remove} loading={deleting}>
              <Trash2 />
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ShareLinkBox({ shareToken }: { shareToken: string }) {
  const [copied, setCopied] = React.useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/r/${shareToken}`
      : `/r/${shareToken}`;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2 pl-3">
      <code className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-ink-400">
        {url}
      </code>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Copy share link"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            toast.error("Clipboard unavailable");
          }
        }}
      >
        {copied ? <Check className="text-grade-excellent" /> : <Copy />}
      </Button>
    </div>
  );
}
