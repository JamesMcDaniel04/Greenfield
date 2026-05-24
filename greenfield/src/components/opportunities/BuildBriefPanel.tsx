import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Copy, Download, FileText, Loader2, Lock, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

type Props = {
  opportunityId: string;
  opportunitySlug: string;
  opportunityTitle: string;
};

/**
 * Pro / admin: shows the brief — read from cache if present, generate on demand
 * via the `generate-brief` edge function otherwise. Result is cached server-side
 * so subsequent requests skip Anthropic.
 *
 * Free: shows an upgrade CTA with a structural preview.
 */
export default function BuildBriefPanel({ opportunityId, opportunitySlug, opportunityTitle }: Props) {
  const { user, profile } = useAuth();
  const isPro = !!profile?.is_pro;
  const isAdmin = !!profile?.is_admin;
  const canAccess = isPro || isAdmin;
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  // 1. Try the cache first (RLS already gates this to Pro/admin readers)
  const cacheQ = useQuery({
    queryKey: ["build-brief-cache", opportunityId],
    enabled: canAccess,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("build_briefs")
        .select("markdown")
        .eq("opportunity_id", opportunityId)
        .maybeSingle();
      if (error) throw error;
      return data?.markdown ?? null;
    },
  });

  // 2. If no cache, generate via the edge function. Manual trigger only —
  //    we don't want a page view to silently spend tokens.
  const generate = useMutation({
    mutationFn: async (opts?: { force?: boolean }) => {
      const { data, error } = await supabase.functions.invoke<{ markdown: string; cached: boolean }>(
        "generate-brief",
        { body: { opportunity_id: opportunityId, force: opts?.force } },
      );
      if (error) throw error;
      if (!data?.markdown) throw new Error("No markdown returned");
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(["build-brief-cache", opportunityId], data.markdown);
      toast.success(data.cached ? "Loaded from cache" : "Brief generated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const brief = cacheQ.data ?? null;

  function download() {
    if (!brief) return;
    const blob = new Blob([brief], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${opportunitySlug}-brief.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Brief downloaded");
  }

  async function copy() {
    if (!brief) return;
    await navigator.clipboard.writeText(brief);
    toast.success("Brief copied — paste it into Claude Code, Cursor, or Codex");
  }

  // ---------- Free user view ----------
  if (!user || !canAccess) {
    return (
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-accent/10 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-accent/20 p-2">
            <Sparkles className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <h4 className="font-display text-base">Build brief — Pro</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              A prescriptive Markdown spec for this opportunity: stack, schema, weekly milestones.
              Paste it into Claude Code, Cursor, or Codex and start shipping.
            </p>
            <div className="mt-3 flex gap-2">
              <Button asChild>
                <Link to={`/pricing?next=${encodeURIComponent(`/opportunity/${opportunitySlug}`)}`}>
                  <Lock className="h-4 w-4" />
                  Upgrade to unlock
                </Link>
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost">Preview</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>What's in a build brief?</DialogTitle>
                    <DialogDescription>
                      Every opportunity in Greenfield ships with a structured Markdown brief.
                    </DialogDescription>
                  </DialogHeader>
                  <pre className="max-h-72 overflow-auto rounded-md bg-muted/60 p-3 text-xs leading-relaxed">
{`## Overview
## Stack (recommended)
## Data model
## Core flows
## Week-1 milestones
## Week-2 to launch
## Risks & open questions`}
                  </pre>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Pro/admin view ----------
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-1.5 font-display text-base">
            <FileText className="h-4 w-4" /> Build brief
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste this into Claude Code, Cursor, or Codex to scaffold {opportunityTitle}.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
          <Sparkles className="h-3 w-3" /> {isAdmin && !isPro ? "Admin" : "Pro"}
        </span>
      </div>

      {cacheQ.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : !brief ? (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            No brief cached for this opportunity yet. Generating one takes ~10 seconds
            and runs Claude on the server.
          </p>
          <Button
            className="mt-3"
            onClick={() => generate.mutate(undefined)}
            disabled={generate.isPending}
          >
            {generate.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
              : <><Sparkles className="h-4 w-4" /> Generate brief</>
            }
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => setOpen(true)}>
              <FileText className="h-4 w-4" />
              Open brief
            </Button>
            <Button variant="outline" onClick={copy}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button variant="outline" onClick={download}>
              <Download className="h-4 w-4" />
              Download .md
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                onClick={() => generate.mutate({ force: true })}
                disabled={generate.isPending}
                title="Admin only — regenerate from scratch"
              >
                {generate.isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <RefreshCw className="h-4 w-4" />}
                Regenerate
              </Button>
            )}
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{opportunityTitle} — Build brief</DialogTitle>
                <DialogDescription>
                  Markdown spec, ready to paste into your coding agent.
                </DialogDescription>
              </DialogHeader>
              <pre className="max-h-[60vh] overflow-auto rounded-md bg-muted/60 p-4 text-xs leading-relaxed whitespace-pre-wrap">
                {brief}
              </pre>
              <DialogFooter>
                <Button variant="outline" onClick={copy}><Copy className="h-4 w-4" />Copy</Button>
                <Button onClick={download}><Download className="h-4 w-4" />Download .md</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
