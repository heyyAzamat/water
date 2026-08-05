"use client";

import * as React from "react";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { useI18n, useT } from "@/lib/i18n/provider";
import { fmt, intlLocale } from "@/lib/i18n/format";
import type { Author, Comment } from "@/types";
import { timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/field";
import { Avatar } from "@/components/ui/misc";
import { EmptyState } from "@/components/shared/primitives";

const MAX_LENGTH = 2000;

export function CommentThread({
  reportId,
  initialComments,
  currentUser,
}: {
  reportId: string;
  initialComments: Comment[];
  currentUser: Author | null;
}) {
  const t = useT();
  const dateLocale = intlLocale(useI18n().locale);
  const [comments, setComments] = React.useState(initialComments);
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || !currentUser) return;

    setSending(true);

    // Optimistic insert — the thread should feel instant, and a failure rolls
    // the entry back rather than leaving a phantom comment.
    const optimistic: Comment = {
      id: `optimistic-${Date.now()}`,
      body: trimmed,
      createdAt: new Date().toISOString(),
      author: currentUser,
    };
    setComments((prev) => [optimistic, ...prev]);
    setBody("");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, body: trimmed }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? `Failed (${response.status})`);
      }

      const { comment } = (await response.json()) as { comment: Comment };
      setComments((prev) =>
        prev.map((c) => (c.id === optimistic.id ? comment : c)),
      );
    } catch (error) {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setBody(trimmed);
      toast.error(t.ui.comments.failed, {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {currentUser ? (
        <form onSubmit={submit} className="flex gap-3">
          <Avatar
            name={currentUser.name}
            src={currentUser.avatarUrl}
            size={34}
            className="mt-1"
          />
          <div className="min-w-0 flex-1">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
              rows={3}
              placeholder={t.ui.comments.placeholder}
              aria-label={t.ui.comments.label}
              disabled={sending}
              onKeyDown={(event) => {
                // ⌘/Ctrl+Enter submits — the convention people expect in a
                // multi-line composer.
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void submit(event as unknown as React.FormEvent);
                }
              }}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[11px] text-ink-600">
                {fmt(t.ui.comments.hint, {
                  count: body.length,
                  max: MAX_LENGTH,
                })}
              </span>
              <Button
                type="submit"
                size="sm"
                loading={sending}
                disabled={!body.trim()}
              >
                <Send />
                {t.ui.comments.post}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center">
          <p className="text-[13px] text-ink-400">
            {t.ui.comments.signedOut}
          </p>
        </div>
      )}

      {comments.length === 0 ? (
        <EmptyState
          icon={<MessageSquare />}
          title={t.ui.comments.emptyTitle}
          description={t.ui.comments.emptyBody}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3.5"
            >
              <Avatar
                name={comment.author.name}
                src={comment.author.avatarUrl}
                size={32}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium text-ink-100">
                    {comment.author.name}
                  </span>
                  {comment.author.role !== "user" && (
                    <Badge variant="brand" size="sm">
                      {comment.author.role}
                    </Badge>
                  )}
                  <span className="text-[11px] text-ink-600">
                    {timeAgo(comment.createdAt, dateLocale)}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-300">
                  {comment.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
