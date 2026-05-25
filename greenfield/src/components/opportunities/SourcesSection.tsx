import { ExternalLink, MessageSquare, Newspaper, Radio, Rss } from "lucide-react";

import type { SourceCitation, SourceType } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  sources: SourceCitation[];
};

/**
 * Cited sources / research signals for an opportunity. Surfaces freshness
 * so the reader can audit whether the demand case is current or stale.
 * Populated by the n8n ingestion pipeline (see n8n-workflows/).
 */
export default function SourcesSection({ sources }: Props) {
  if (!sources?.length) {
    return (
      <section>
        <SectionHeader />
        <p className="text-sm text-muted-foreground">
          No external signals cited yet. New sources land here as the ingestion pipeline picks them up.
        </p>
      </section>
    );
  }

  const sorted = [...sources].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
  );
  const newestDays = daysAgo(sorted[0].published_at);
  const oldestDays = daysAgo(sorted[sorted.length - 1].published_at);

  return (
    <section>
      <SectionHeader count={sources.length} newestDays={newestDays} oldestDays={oldestDays} />
      <ol className="mt-4 space-y-3">
        {sorted.map((s, i) => (
          <li key={`${s.url}-${i}`}>
            <SourceRow source={s} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function SectionHeader({
  count, newestDays, oldestDays,
}: {
  count?: number;
  newestDays?: number;
  oldestDays?: number;
}) {
  return (
    <div>
      <h2 className="font-display text-xl">Sources & signals</h2>
      {count !== undefined && newestDays !== undefined && oldestDays !== undefined ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {count} cited source{count === 1 ? "" : "s"} · newest {relative(newestDays)} · oldest {relative(oldestDays)}.
          Audit freshness before you invest months — markets that looked hot 18 months ago may be saturated by now.
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          External signals informing this opportunity, oldest to newest.
        </p>
      )}
    </div>
  );
}

function SourceRow({ source }: { source: SourceCitation }) {
  const meta = SOURCE_META[source.source_type] ?? SOURCE_META.other;
  const days = daysAgo(source.published_at);

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group flex items-start gap-3 rounded-lg border bg-card p-4 transition-all",
        "hover:border-primary/40 hover:shadow-sm",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-xs font-semibold",
          meta.tone,
        )}
        aria-hidden
      >
        {meta.icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {meta.label}
          </span>
          <span className="text-[11px] text-muted-foreground" title={new Date(source.published_at).toUTCString()}>
            · {relative(days)}
          </span>
          <FreshnessChip days={days} />
        </div>
        <p className="mt-0.5 text-sm font-medium leading-snug group-hover:underline">
          {source.title}
        </p>
        {source.snippet && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{source.snippet}</p>
        )}
      </div>

      <ExternalLink className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}

function FreshnessChip({ days }: { days: number }) {
  let tone = "bg-muted text-muted-foreground";
  let label = "older";
  if (days <= 14)      { tone = "bg-emerald-50  text-emerald-800 border border-emerald-200"; label = "fresh"; }
  else if (days <= 60) { tone = "bg-amber-50    text-amber-800   border border-amber-200";   label = "recent"; }
  else if (days <= 365){ tone = "bg-orange-50   text-orange-800  border border-orange-200";  label = "aging"; }
  else                 { tone = "bg-rose-50     text-rose-800    border border-rose-200";    label = "stale"; }
  return <span className={cn("rounded-full px-1.5 py-px text-[10px] font-medium", tone)}>{label}</span>;
}

function daysAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function relative(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days}d ago`;
  if (days < 60) return `${Math.round(days / 7)}w ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${(days / 365).toFixed(1)}y ago`;
}

const SOURCE_META: Record<SourceType, { label: string; tone: string; icon: React.ReactNode }> = {
  techcrunch: { label: "TechCrunch",  tone: "bg-emerald-100 text-emerald-900", icon: <Newspaper className="h-4 w-4" /> },
  reddit:     { label: "Reddit",      tone: "bg-orange-100  text-orange-900",  icon: <span>r/</span> },
  x:          { label: "X",           tone: "bg-foreground/85 text-background", icon: <span>𝕏</span> },
  hackernews: { label: "Hacker News", tone: "bg-orange-200  text-orange-900",  icon: <span>Y</span> },
  crunchbase: { label: "Crunchbase",  tone: "bg-sky-100     text-sky-900",     icon: <span>CB</span> },
  arxiv:      { label: "arXiv",       tone: "bg-rose-100    text-rose-900",    icon: <span>𝛼</span> },
  github:     { label: "GitHub",      tone: "bg-zinc-200    text-zinc-900",    icon: <span>GH</span> },
  blog:       { label: "Blog",        tone: "bg-violet-100  text-violet-900",  icon: <Rss className="h-4 w-4" /> },
  podcast:    { label: "Podcast",     tone: "bg-amber-100   text-amber-900",   icon: <Radio className="h-4 w-4" /> },
  other:      { label: "Source",      tone: "bg-muted       text-foreground",  icon: <MessageSquare className="h-4 w-4" /> },
};
