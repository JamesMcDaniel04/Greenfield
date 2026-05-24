import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectNative } from "@/components/ui/select-native";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { VOCAB } from "@/lib/vocab";
import { slugify } from "@/lib/admin";
import type { Opportunity } from "@/lib/types";

type FormState = Omit<Opportunity, "id" | "created_at" | "updated_at" | "cover_image_url"> & {
  cover_image_url?: string | null;
};

const EMPTY: FormState = {
  slug: "",
  title: "",
  one_liner: "",
  the_gap: "",
  the_play: "",
  market_size_summary: "",
  timing_rationale: "",
  build_path: "",
  model_type: VOCAB.model_type[0],
  audience: VOCAB.audience[0],
  industry: "",
  niche: "",
  revenue_ceiling: "Lifestyle ($100k-$1M ARR)",
  founder_path: "Bootstrap",
  difficulty: VOCAB.difficulty[0],
  starting_capital: VOCAB.starting_capital[0],
  time_to_launch: VOCAB.time_to_launch[0],
  build_stack_hint: VOCAB.build_stack_hint[0],
  moat: "Distribution",
  distribution_play: "SEO content",
  demand_trend: "Steady growth",
  featured: false,
  rank: 100,
  cover_image_url: null,
};

// Vocabularies the seed script doesn't export — keep in sync with scripts/seed.ts
const EXTRA_VOCAB = {
  revenue_ceiling: [
    "Side income ($0-100k ARR)",
    "Lifestyle ($100k-$1M ARR)",
    "Scale ($1M-$10M ARR)",
    "Venture ($10M+ ARR)",
  ],
  founder_path: ["Bootstrap", "Indie / Side project", "VC-backed", "Acquihire-bound"],
  moat: [
    "Distribution", "Network effects", "Proprietary data",
    "Capital intensity", "Regulatory access", "Brand & community",
    "Speed of execution",
  ],
  distribution_play: [
    "SEO content", "Cold outbound", "Partnerships",
    "Paid acquisition", "Community-led", "Marketplace flywheel",
    "Product-led growth", "Direct sales",
  ],
  demand_trend: ["Emerging", "Steady growth", "Accelerating", "Niche but durable"],
};

type Props = {
  /** Existing opportunity for edit mode, undefined for create */
  existing?: Opportunity;
};

export default function OpportunityForm({ existing }: Props) {
  const isEdit = !!existing;
  const navigate = useNavigate();
  const [state, setState] = useState<FormState>(() => existing ? toFormState(existing) : EMPTY);
  const [slugTouched, setSlugTouched] = useState(isEdit);

  // Auto-fill slug from title until the user types in the slug box
  useEffect(() => {
    if (!slugTouched && state.title) {
      setState((s) => ({ ...s, slug: slugify(state.title) }));
    }
  }, [state.title, slugTouched]);

  const dirty = useMemo(
    () => JSON.stringify(state) !== JSON.stringify(isEdit ? toFormState(existing!) : EMPTY),
    [state, isEdit, existing],
  );

  const save = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        const { error } = await supabase
          .from("opportunities")
          .update({ ...state, updated_at: new Date().toISOString() })
          .eq("id", existing!.id);
        if (error) throw error;
        return existing!.slug;
      }
      const { data, error } = await supabase
        .from("opportunities")
        .insert({ ...state })
        .select("slug")
        .single();
      if (error) throw error;
      return data!.slug as string;
    },
    onSuccess: (slug) => {
      toast.success(isEdit ? "Opportunity updated" : "Opportunity created");
      navigate(`/admin/edit/${slug}`, { replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!state.title.trim() || !state.slug.trim() || !state.one_liner.trim()) {
      toast.error("Title, slug, and one-liner are required");
      return;
    }
    save.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <Group title="Core">
        <Field label="Title" required>
          <Input value={state.title} onChange={(e) => update("title", e.target.value)} required />
        </Field>
        <Field label="Slug" required hint="URL-safe id. Auto-generated from title until you edit it.">
          <Input
            value={state.slug}
            onChange={(e) => { setSlugTouched(true); update("slug", slugify(e.target.value)); }}
            required
          />
        </Field>
        <Field label="One-liner" required hint="One sentence under 160 chars.">
          <Input
            value={state.one_liner}
            onChange={(e) => update("one_liner", e.target.value)}
            maxLength={200}
            required
          />
        </Field>
      </Group>

      <Group title="The brief">
        <Field label="The gap"            ><Textarea rows={3} value={state.the_gap}             onChange={(e) => update("the_gap", e.target.value)} /></Field>
        <Field label="The play"           ><Textarea rows={3} value={state.the_play}            onChange={(e) => update("the_play", e.target.value)} /></Field>
        <Field label="Market size"        ><Textarea rows={3} value={state.market_size_summary} onChange={(e) => update("market_size_summary", e.target.value)} /></Field>
        <Field label="Why now"            ><Textarea rows={3} value={state.timing_rationale}    onChange={(e) => update("timing_rationale", e.target.value)} /></Field>
        <Field label="How to build it"    ><Textarea rows={4} value={state.build_path}          onChange={(e) => update("build_path", e.target.value)} /></Field>
      </Group>

      <Group title="Taxonomy">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Industry" required>
            <Input value={state.industry} onChange={(e) => update("industry", e.target.value)} required />
          </Field>
          <Field label="Niche">
            <Input value={state.niche ?? ""} onChange={(e) => update("niche", e.target.value)} />
          </Field>
          <Field label="Model type">
            <SelectNative value={state.model_type} onChange={(e) => update("model_type", e.target.value)}>
              {VOCAB.model_type.map((v) => <option key={v}>{v}</option>)}
            </SelectNative>
          </Field>
          <Field label="Audience">
            <SelectNative value={state.audience} onChange={(e) => update("audience", e.target.value)}>
              {VOCAB.audience.map((v) => <option key={v}>{v}</option>)}
            </SelectNative>
          </Field>
        </div>
      </Group>

      <Group title="At-a-glance">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Difficulty">
            <SelectNative value={state.difficulty} onChange={(e) => update("difficulty", e.target.value)}>
              {VOCAB.difficulty.map((v) => <option key={v}>{v}</option>)}
            </SelectNative>
          </Field>
          <Field label="Starting capital">
            <SelectNative value={state.starting_capital} onChange={(e) => update("starting_capital", e.target.value)}>
              {VOCAB.starting_capital.map((v) => <option key={v}>{v}</option>)}
            </SelectNative>
          </Field>
          <Field label="Time to launch">
            <SelectNative value={state.time_to_launch} onChange={(e) => update("time_to_launch", e.target.value)}>
              {VOCAB.time_to_launch.map((v) => <option key={v}>{v}</option>)}
            </SelectNative>
          </Field>
          <Field label="Build approach">
            <SelectNative value={state.build_stack_hint} onChange={(e) => update("build_stack_hint", e.target.value)}>
              {VOCAB.build_stack_hint.map((v) => <option key={v}>{v}</option>)}
            </SelectNative>
          </Field>
          <Field label="Revenue ceiling">
            <SelectNative value={state.revenue_ceiling} onChange={(e) => update("revenue_ceiling", e.target.value)}>
              {EXTRA_VOCAB.revenue_ceiling.map((v) => <option key={v}>{v}</option>)}
            </SelectNative>
          </Field>
          <Field label="Founder path">
            <SelectNative value={state.founder_path} onChange={(e) => update("founder_path", e.target.value)}>
              {EXTRA_VOCAB.founder_path.map((v) => <option key={v}>{v}</option>)}
            </SelectNative>
          </Field>
          <Field label="Moat">
            <SelectNative value={state.moat} onChange={(e) => update("moat", e.target.value)}>
              {EXTRA_VOCAB.moat.map((v) => <option key={v}>{v}</option>)}
            </SelectNative>
          </Field>
          <Field label="Distribution play">
            <SelectNative value={state.distribution_play} onChange={(e) => update("distribution_play", e.target.value)}>
              {EXTRA_VOCAB.distribution_play.map((v) => <option key={v}>{v}</option>)}
            </SelectNative>
          </Field>
          <Field label="Demand trend">
            <SelectNative value={state.demand_trend} onChange={(e) => update("demand_trend", e.target.value)}>
              {EXTRA_VOCAB.demand_trend.map((v) => <option key={v}>{v}</option>)}
            </SelectNative>
          </Field>
          <Field label="Rank" hint="Lower = higher in catalogue order.">
            <Input
              type="number"
              value={state.rank}
              onChange={(e) => update("rank", Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </Group>

      <Group title="Display">
        <div className="flex items-center gap-2">
          <Checkbox
            id="featured"
            checked={state.featured}
            onCheckedChange={(v) => update("featured", v === true)}
          />
          <Label htmlFor="featured" className="font-normal cursor-pointer">
            Featured — pin to the top of the catalogue
          </Label>
        </div>
        <Field label="Cover image URL" hint="Optional. Leave blank if you don't have one.">
          <Input
            value={state.cover_image_url ?? ""}
            onChange={(e) => update("cover_image_url", e.target.value || null)}
            placeholder="https://…"
          />
        </Field>
      </Group>

      <div className="sticky bottom-0 -mx-6 border-t bg-background/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {dirty ? "Unsaved changes" : "Up to date"}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => navigate("/admin")}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending || !dirty}>
              {save.isPending ? "Saving…" : isEdit ? "Save changes" : "Create opportunity"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-display text-lg mb-3">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label, hint, required, children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function toFormState(opp: Opportunity): FormState {
  const { id: _id, created_at: _c, updated_at: _u, ...rest } = opp;
  void _id; void _c; void _u;
  return rest;
}
