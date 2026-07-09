# Publishing Pipeline — Plan

This document captures the intended workflow for the **Tech Blog Pipeline**: how
articles get written, reviewed, and published. It reflects the plan as of
2026-07-10 and will evolve as the pipeline is built out.

## Goal

Use agentic LLMs (e.g. Claude Code) to write educational, insightful articles on
**software engineering** and **software architecture**. Articles are drafted
privately into Notion, reviewed by a human, and — once approved — automatically
published to Hashnode via GitHub Actions.

Notion is the **source of truth and review board**. The GitHub Actions pipeline is
the **automated publisher**.

## The Workflow

```
[ Claude Code + Notion MCP ]
        │  Writes article as a Notion page, Status = "Draft"
        ▼
   ┌─────────────────────┐
   │  Notion:            │   Human vets the draft, edits as needed,
   │  Tech Blog Pipeline │   then manually flips Status → "Ready to Publish"
   └──────────┬──────────┘
              │  GitHub Actions cron (scheduled)
              ▼
   ┌─────────────────────┐   Queries the DB for Status = "Ready to Publish"
   │  Publish pipeline   │   (oldest first, one per run) → notion-to-md →
   │  (this repo)        │   publishHashnode()
   └──────────┬──────────┘
              ▼
   ┌─────────────────────┐   On success: write the Hashnode URL back to the page
   │  Hashnode (live)    │   and flip Status → "Published"
   └─────────────────────┘
```

### Step by step

1. **Write (agent).** Claude Code writes an article directly into the Notion
   database `Tech Blog Pipeline` as a new page with `Status = "Draft"`. The
   article body lives in the Notion page blocks; metadata lives in page
   properties (see [Notion schema](#notion-schema)).
2. **Vet & edit (human).** The author reviews the draft in Notion, edits content,
   and confirms the metadata (title, subtitle, tags).
3. **Approve (human).** The author manually changes `Status` to
   `"Ready to Publish"`. This is the single, deliberate gate that authorizes
   publication.
4. **Publish (automation).** On a schedule, GitHub Actions runs the pipeline in
   this repo. It queries Notion for the **oldest** page with
   `Status = "Ready to Publish"`, converts the page body to Markdown, and
   publishes it to Hashnode via the GraphQL `publishPost` mutation.
5. **Close the loop (automation).** On a successful publish, the pipeline writes
   the returned Hashnode URL (and post ID) back to the page and sets
   `Status = "Published"`.

### Trigger logic

- **Status-only, oldest-first, one per run.** Each scheduled run publishes a
  single article — the oldest page currently marked `Ready to Publish` — then
  flips it to `Published`.
- **Dedup is automatic.** Because the query only matches `Ready to Publish`, a
  page that has been flipped to `Published` is never picked up again. No ID
  comparison is required.
- Cadence is controlled by how often articles are approved and by the cron
  schedule (e.g. hourly to drain the queue, or once daily for a slower pace).

## Notion Schema

The `Tech Blog Pipeline` database uses these properties:

| Property           | Type          | Purpose                                                                 |
| ------------------ | ------------- | ----------------------------------------------------------------------- |
| **Name**           | Title         | Article title (sent to Hashnode).                                       |
| **Status**         | Select        | `Draft` → `Ready to Publish` → `Published`.                            |
| **Subtitle**       | Text          | Hashnode subtitle / SEO description.                                     |
| **Hashnode Tag IDs** | Multi-select | Hashnode tag **IDs** (not free text) from Hashnode's `tags.json`.       |
| **Cover Image**    | URL           | Optional cover image. Auto-generated if left empty (see below).          |
| **Hashnode URL**   | URL           | Empty on draft; filled by the pipeline after publishing.                |
| **Hashnode Post ID** | Text        | Empty on draft; filled by the pipeline (enables future updates/dedup).  |

Notes:

- **Metadata belongs in properties, not the body.** Do not embed YAML frontmatter
  (`---title: ...---`) in the page body — `notion-to-md` would render it as
  literal text inside the published post.
- **Hashnode requires tag IDs**, not arbitrary tag names. Reference:
  <https://github.com/Hashnode/support/blob/main/misc/tags.json>.
- **Cover images are auto-generated when `Cover Image` is empty.**
  `utils/cover/mesh.js` builds a soft, swirling mesh-gradient SVG seeded
  deterministically from the article title (same post → same image);
  `utils/cover/hostCover.js` rasterizes it to PNG via `@resvg/resvg-js`, commits
  it to `covers/` on `main`, and uses the `raw.githubusercontent.com` URL as the
  Hashnode cover. Generation is best-effort — a failure never blocks publishing,
  and it only commits when running in CI. Set `Cover Image` manually to override.

## Connecting Claude Code to Notion

Two separate connections are involved:

| Connection                         | Used by                        | Purpose                                    |
| ---------------------------------- | ------------------------------ | ------------------------------------------ |
| **MCP server** (hosted, OAuth)     | Claude Code (interactive)      | The agent writes drafts into Notion.       |
| **Integration token** (`NOTION_TOKEN`) | GitHub Actions (`@notionhq/client`) | The pipeline reads approved articles.  |

- **MCP (recommended, hosted):**
  `claude mcp add --transport http notion https://mcp.notion.com/mcp`, then run
  `/mcp` in Claude Code to authenticate via browser OAuth.
- **Integration token (for CI):** create an internal integration at
  <https://www.notion.so/my-integrations>, share the `Tech Blog Pipeline`
  database with it, and store the token as the `NOTION_TOKEN` GitHub secret.
  The database ID (from the DB URL) becomes `NOTION_DB_ID`.

## Required GitHub Secrets

For the scheduled publish workflow:

- `NOTION_TOKEN`, `NOTION_DB_ID`
- `HASHNODE_TOKEN`, `HASHNODE_PUBLICATION_ID`
- `ENVIRONMENT=production`
- Email (failure/success alerts): `USER_TO_EMAIL`, `USER_FROM_EMAIL`,
  `USER_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`

## Implementation Notes (this repo)

This repo (a fork of Content-Amplify-Hub) already contains a working
Notion → Hashnode publisher. Adapting it to the plan above requires:

1. **Trigger** (`utils/fetch/notion.js`): filter the production query by
   `Status = "Ready to Publish"` (oldest first), instead of the current
   `Publishing Date` window.
2. **Fetch** (`services/fetchContent.js`): map the simplified schema and publish
   the whole page body (drop the `## Introduction` slicing).
3. **Publish** (`services/publishContent.js`): Hashnode only for now.
4. **Close the loop** (`utils/success/notion.js`): write `Hashnode URL` /
   `Hashnode Post ID` and set `Status = "Published"`.
5. **Cron** (`.github/workflows/amplify.yml`): a status-draining schedule (e.g.
   hourly), replacing the current Twitter-only crons.

## Future Work

The pipeline is intentionally scoped to **Hashnode only** for now. Planned
extensions:

- **Additional publishing targets:** Medium, Dev.to, Twitter/X, LinkedIn.
  Publisher modules for these already exist in `utils/publish/` from the upstream
  project and can be re-enabled per article.
- **Per-article channel selection:** let a page declare which platforms it should
  publish to (e.g. a multi-select property), so one draft can fan out to several
  destinations.
- **Cross-post linking:** record the URL from each platform back on the Notion
  page, and optionally add canonical URLs to avoid SEO duplicate-content issues.
- **Scheduled go-live times:** optionally reintroduce a date property to schedule
  exact publish times, layered on top of the status gate.
