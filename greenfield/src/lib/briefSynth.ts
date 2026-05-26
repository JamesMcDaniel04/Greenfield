import type { Opportunity } from "@/lib/types";
import { SAMPLE_BUILD_BRIEFS } from "@/lib/fixtures";

/**
 * Returns a Markdown build brief for an opportunity. If a hand-crafted brief
 * is cached in fixtures (SAMPLE_BUILD_BRIEFS) we use that; otherwise we
 * synthesise one from the opportunity's existing rich fields so the landing-page
 * preview always has something to show.
 *
 * The synth output is intentionally prescriptive (sections, milestones, paste
 * blocks for Claude Code / Codex) so it reads like a real spec rather than a
 * regurgitation of the catalogue card.
 */
export function briefForOpportunity(opp: Opportunity): string {
  const cached = SAMPLE_BUILD_BRIEFS[opp.slug];
  if (cached) return cached;
  return synthesiseBrief(opp);
}

function synthesiseBrief(opp: Opportunity): string {
  const niche = opp.niche ? ` (${opp.niche})` : "";
  return `# ${opp.title}

> ${opp.one_liner}

**Industry:** ${opp.industry}${niche}
**Audience:** ${opp.audience}
**Model:** ${opp.model_type}
**Difficulty:** ${opp.difficulty}
**Starting capital:** ${opp.starting_capital}
**Time to launch:** ${opp.time_to_launch}

---

## 1. The opportunity

### The gap
${opp.the_gap}

### The play
${opp.the_play}

### Why now
${opp.timing_rationale}

### Market sizing
${opp.market_size_summary}

---

## 2. Recommended stack

${opp.build_stack_hint}

Keep the surface area small for v1:

- One web app (Next.js or Vite + React)
- One Postgres database (Supabase / Neon)
- One background worker if needed (Cloudflare Workers, Inngest, or a single cron)
- Auth + email out of the box (Supabase Auth or Clerk)
- Stripe for any paid surface

---

## 3. Data model (starter)

\`\`\`sql
-- Replace the column names below to match your domain.

create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  created_at    timestamptz not null default now()
);

create table accounts (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references users(id) on delete cascade,
  name          text not null,
  plan          text not null default 'free',
  created_at    timestamptz not null default now()
);

-- The single workflow that defines this product. Rename + extend.
create table jobs (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references accounts(id) on delete cascade,
  status        text not null default 'queued' check (status in ('queued','running','succeeded','failed')),
  payload       jsonb not null default '{}'::jsonb,
  result        jsonb,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);
\`\`\`

---

## 4. Build plan

### Week 1 — prove the core loop
- Stand up the schema above and seed 3 fake accounts.
- Build the one screen that demonstrates the value: ${shortenForBullet(opp.the_play)}
- Wire ${opp.build_path.split(".")[0] || "the single most important integration"} end to end.
- Ship a working demo at a public URL (Vercel + Supabase).

### Week 2 — first design partner
- Recruit one user who matches the audience: ${opp.audience}.
- Onboard them manually. Watch them use it. Take notes.
- Fix the three things they trip on.

### Week 3 — pricing + payments
- Add Stripe checkout. Charge ${opp.starting_capital === "Less than $1k" ? "a small recurring fee" : "for the highest-leverage workflow"}.
- Add a usage limit on the free tier so paid feels different.

### Week 4 — distribution
- ${opp.distribution_play}
- Publish one piece of content that hits the audience's exact search.

---

## 5. Moat

${opp.moat}

---

## 6. How to ship this with a coding agent

Paste the following into **Claude Code**, **Codex**, or **Cursor**:

> Build me an MVP of the product described above. Stack: ${opp.build_stack_hint}.
> Start by scaffolding the schema in section 3, then implement the Week 1 core
> loop in section 4. Use Tailwind for the UI. Don't add features beyond what's
> required for the Week 1 milestones. Keep the file count small.

The agent should produce a runnable app within an hour. If it stalls, give it
the specific Week 1 bullet that's blocking and ask it to focus there.

---

## 7. Risks & open questions

- **Demand**: is the audience (${opp.audience}) actually paying for adjacent tooling today? Validate by checking 3 of their existing tools' pricing pages before you write a line of code.
- **Channel**: ${opp.distribution_play} — if this doesn't work, you have no business. Test the channel before you build the product.
- **Wedge**: which of the workflows in section 1 is the one that, if removed, makes the rest pointless? Build that first, ignore the rest.

---

_Greenfield brief synthesised from the opportunity card. The full members
catalogue includes additional cited demand signals (TechCrunch, Reddit,
Hacker News, Crunchbase) and per-claim agents that can run on your specific
build._
`;
}

function shortenForBullet(text: string): string {
  // Pull the first sentence so the bullet stays one line.
  const firstSentence = text.split(/\.\s/)[0];
  return firstSentence.trim().replace(/[\n\r]+/g, " ");
}
