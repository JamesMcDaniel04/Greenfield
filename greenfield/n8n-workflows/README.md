# Greenfield · n8n research pipeline

Five workflow templates that feed cited signals into Greenfield's `opportunity_signals` table. Each one POSTs to the `ingest-signal` Supabase Edge Function with a shared bearer token.

| File | Source | Cadence | What it does |
| --- | --- | --- | --- |
| `01-techcrunch-rss.json`        | TechCrunch RSS                 | Every 6 hours  | Pulls the public RSS feed, filters by keyword list, posts matching items. |
| `02-hackernews-algolia.json`    | Hacker News (Algolia API)      | Every 6 hours  | Searches stories from the last 7 days, filters by ≥50 points, posts matches. |
| `03-reddit-search.json`         | Reddit (`/top.json`)           | Twice daily    | Walks a list of subreddits, filters by ≥100 upvotes, posts threads. |
| `04-x-search.json`              | X / Twitter API v2             | Every 8 hours  | Searches X for high-engagement posts matching the keyword set. **Requires the X Basic API plan or higher.** |
| `05-weekly-claude-research.json`| Anthropic API                  | Mondays 1pm UTC| For the top 5 opportunities by rank, asks Claude Sonnet 4.6 for 3–5 recent credible citations, parses, and posts each as a linked signal. |

## Setup

1. **Install n8n** (cloud or self-hosted: `docker run -p 5678:5678 n8nio/n8n`).
2. **Deploy the edge function** from the parent directory:

   ```sh
   supabase secrets set INGEST_SIGNAL_TOKEN=$(openssl rand -hex 32)
   supabase functions deploy ingest-signal --no-verify-jwt
   ```

   `--no-verify-jwt` is intentional: n8n authenticates with the shared token, not a user JWT.

3. **Set n8n environment variables** (Settings → Variables, or the `.env` of your self-host):

   | Var | Value |
   | --- | --- |
   | `GREENFIELD_INGEST_URL`        | `https://YOUR-PROJECT.supabase.co/functions/v1/ingest-signal` |
   | `GREENFIELD_INGEST_TOKEN`      | the token you minted in step 2 |
   | `SUPABASE_URL`                 | only needed by workflow 05 |
   | `SUPABASE_SERVICE_ROLE_KEY`    | only needed by workflow 05 |
   | `ANTHROPIC_API_KEY`            | only needed by workflow 05 |

4. **Import each JSON** in n8n via *Workflows → Import from File*. They land disabled by default — toggle each one Active once you've reviewed its parameters (especially the keyword lists and subreddit lists, which you'll want to customise).

## Testing the edge function before wiring n8n

```sh
curl -X POST "$GREENFIELD_INGEST_URL" \
  -H "Authorization: Bearer $GREENFIELD_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source_type": "techcrunch",
    "url": "https://techcrunch.com/2026/05/01/example-story/",
    "title": "Example story",
    "published_at": "2026-05-01T12:00:00Z",
    "snippet": "Posted by curl",
    "opportunity_slug": "solo-cpa-workflow-os"
  }'
```

Expected response:

```json
{ "id": "…uuid…", "opportunity_id": "…uuid…", "linked": true }
```

If `opportunity_slug` is omitted or the slug doesn't exist, the row is inserted with `opportunity_id = null` and lands in the admin triage queue.

## Linking unattached signals to opportunities

The `04-x-search` and `01-techcrunch-rss` workflows ingest signals without a known opportunity — they hit the triage queue. You have two options:

- **Manual**: build an admin UI page that lists `opportunity_signals where opportunity_id is null` and lets you pick one.
- **Auto**: run an additional weekly workflow that embeds each unattached signal title, embeds each opportunity title, and links by cosine similarity above some threshold.

We've shipped the manual path. The auto path is on the roadmap.

## Data contract

The `ingest-signal` endpoint accepts this shape:

```ts
{
  source_type:      "techcrunch" | "reddit" | "x" | "hackernews"
                  | "crunchbase" | "arxiv" | "github" | "blog"
                  | "podcast" | "other";
  url:              string;          // http(s)
  title:            string;          // ≤ 500 chars
  published_at:     string;          // ISO 8601
  snippet?:         string;          // ≤ 2000 chars — factual context, NOT a quote
  opportunity_slug?: string;         // links the signal if found
  metadata?:        Record<string, unknown>;
}
```

Dedup is on `(opportunity_id, url)` so re-ingesting the same URL is idempotent.

## A note on what you should and shouldn't ingest

We store **URL + title + publish date + a short factual snippet** (e.g. "412 upvotes · 87 comments", "Posted by @username", "Series A round of $25M"). We do **not** store the full body of articles, posts, or tweets — that's the source's copyrighted content, and reproducing it without permission is infringement.

Snippets should describe *context about the source* (engagement metrics, author, subreddit, funding amount, etc.), not summarise or paraphrase the body content. The workflow templates above respect this.
