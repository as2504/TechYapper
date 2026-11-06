import type { TopicId } from './types'

export type Persona = 'student' | 'developer' | 'interview'

export const PERSONAS: Record<Persona, { label: string; blurb: string }> = {
  student: { label: 'Student', blurb: 'Portfolio-sized, free-tier stack, finishable in a weekend.' },
  developer: { label: 'Working dev', blurb: 'Production concerns: auth, observability, cost, rollout.' },
  interview: { label: 'Interview', blurb: 'System-design framing: scale, trade-offs, failure modes.' },
}

export interface ProjectVariant {
  scope: string
  stack: string[]
  milestones: { title: string; detail: string }[]
  pitch: string
  talkingPoints: string[]
  followUps: { q: string; a: string }[]
}

export interface YapProject {
  slug: string
  title: string
  dek: string
  topic: TopicId
  concepts: string[]
  architecture: { part: string; role: string }[]
  variants: Record<Persona, ProjectVariant>
}

export const PROJECTS: YapProject[] = [
  {
    slug: 'ask-the-docs',
    title: 'Ask-the-Docs: a RAG assistant over your wiki',
    dek: 'Turn a pile of Markdown and PDFs into an assistant that answers with citations — and knows when to say "I don\'t know".',
    topic: 'genai',
    concepts: ['rag', 'embeddings-vector-db', 'llm-tokens', 'caching-strategies'],
    architecture: [
      { part: 'Ingestion job', role: 'Loads docs, chunks by heading with overlap, attaches title + source metadata.' },
      { part: 'Embedding + pgvector', role: 'Stores chunk vectors in Postgres with an HNSW index; full-text index alongside for keywords.' },
      { part: 'Retriever', role: 'Hybrid search (BM25 + vectors) merged with reciprocal rank fusion, optional re-ranker.' },
      { part: 'Answer API', role: 'Builds a grounded prompt, streams the answer, returns cited chunk IDs.' },
      { part: 'Eval set', role: '30–50 real questions with expected sources; run on every prompt or chunking change.' },
    ],
    variants: {
      student: {
        scope: 'Index your college notes or a public docs site (e.g. the React docs) and answer questions with citations.',
        stack: ['Supabase + pgvector', 'Any embedding API free tier', 'Next.js or Vite', 'Vercel'],
        milestones: [
          { title: 'Ingest', detail: 'Script that chunks Markdown by heading (~400 tokens, 15% overlap) and stores chunks + embeddings.' },
          { title: 'Search page', detail: 'Query box that shows the top 5 chunks with similarity scores — before any LLM is involved.' },
          { title: 'Grounded answers', detail: 'Prompt with "answer only from context, cite [n], say if unsure". Render citations as links.' },
          { title: 'Mini eval', detail: '20 questions with the expected source file. Track recall@5 in a table in your README.' },
        ],
        pitch: 'I built a RAG assistant over the React docs. The interesting part wasn\'t the LLM — it was chunking and retrieval. Hybrid search took my recall@5 from 0.6 to 0.85.',
        talkingPoints: [
          'Why chunk boundaries along headings beat fixed-size chunks.',
          'How you measured retrieval separately from answer quality.',
          'What the model does when the answer isn\'t in the context.',
        ],
        followUps: [
          { q: 'Why not just fine-tune the model on the docs?', a: 'Fine-tuning is poor at injecting facts that change and can\'t cite sources. RAG updates by re-indexing and gives citations.' },
          { q: 'How did you pick chunk size?', a: 'Tried 200/400/800 tokens against the eval set; 400 with overlap gave the best recall without diluting chunks.' },
        ],
      },
      developer: {
        scope: 'An internal assistant over Confluence/SharePoint with per-team permissions, feedback buttons and cost controls.',
        stack: ['Postgres + pgvector (or managed vector DB)', 'Queue for ingestion', 'Re-ranker model', 'Tracing (OpenTelemetry)'],
        milestones: [
          { title: 'Permission-aware index', detail: 'Store ACL metadata on every chunk; filter by the caller\'s groups before ranking.' },
          { title: 'Incremental sync', detail: 'Webhook/delta sync so edited pages re-embed within minutes, deleted pages disappear.' },
          { title: 'Quality loop', detail: 'Thumbs up/down with the retrieved chunk IDs logged; weekly review of failures.' },
          { title: 'Cost + latency', detail: 'Prompt caching for the system prompt, answer cache for repeated questions, token budgets per request.' },
        ],
        pitch: 'We shipped a permission-aware docs assistant. Retrieval respects SharePoint ACLs, edits re-index in minutes, and every bad answer is traceable to the chunks it used.',
        talkingPoints: [
          'Access control is a retrieval filter, not a prompt instruction.',
          'Faithfulness evals caught the model answering from training data.',
          'Cost per answer and how caching cut it.',
        ],
        followUps: [
          { q: 'How do you stop users retrieving documents they can\'t access?', a: 'ACLs are stored with each chunk and applied as a filter in the vector query, so unauthorised chunks never reach the prompt.' },
          { q: 'How do you know a change improved things?', a: 'A fixed eval set run in CI: retrieval recall, faithfulness and correctness compared against the previous version.' },
        ],
      },
      interview: {
        scope: 'Design a question-answering system over 10M internal documents for 50k employees.',
        stack: ['Sharded vector index (HNSW)', 'BM25 engine', 'Re-ranker service', 'Streaming LLM gateway'],
        milestones: [
          { title: 'Clarify', detail: 'QPS, freshness SLA, permission model, languages, acceptable latency (p95 < 3s?).' },
          { title: 'Offline path', detail: 'Change-data-capture → chunk → embed (batch GPU workers) → index, with backfill and re-embed strategy.' },
          { title: 'Online path', detail: 'Query rewrite → hybrid retrieve with ACL filter → re-rank top 50 → prompt → stream.' },
          { title: 'Operate', detail: 'Eval harness, model/version pinning, index rebuilds without downtime, cost per query.' },
        ],
        pitch: 'Two pipelines: an offline one that keeps a permission-aware hybrid index fresh, and an online one that retrieves, re-ranks and generates with citations under a latency budget.',
        talkingPoints: [
          'Why hybrid retrieval: error codes and names vs paraphrased questions.',
          'Filtered ANN search and why post-filtering can return too few results.',
          'Switching embedding models means re-embedding everything — plan dual indexes.',
        ],
        followUps: [
          { q: 'Where is the latency going?', a: 'Embedding the query (~20ms), retrieval (~50ms), re-ranking 50 candidates (~150ms), then LLM time-to-first-token dominates. Stream to hide it.' },
          { q: 'How do you handle a model upgrade?', a: 'Build a second index with the new embeddings in the background, run the eval set on both, then switch reads atomically.' },
        ],
      },
    },
  },
  {
    slug: 'idempotent-payments',
    title: 'A payments API that never double-charges',
    dek: 'Checkout, webhooks and subscriptions with idempotency keys, row-level security and honest failure handling.',
    topic: 'backend',
    concepts: ['rest-idempotency', 'jwt-auth', 'postgres-mvcc', 'supabase-rls'],
    architecture: [
      { part: 'Orders API', role: 'Creates orders with an Idempotency-Key; stores key → response atomically.' },
      { part: 'Payment provider', role: 'Razorpay/Stripe in test mode handles the actual card/UPI flow.' },
      { part: 'Webhook handler', role: 'Verifies signatures, de-duplicates by event ID, applies state transitions.' },
      { part: 'Subscriptions table', role: 'Single source of truth for plan + period end; users can read, only the server writes.' },
      { part: 'Reconciliation job', role: 'Nightly comparison of provider records vs your DB to catch missed webhooks.' },
    ],
    variants: {
      student: {
        scope: 'A tiny "buy me a coffee" page using Razorpay test mode, with a webhook that marks the order paid.',
        stack: ['Supabase (Postgres + Edge Functions)', 'Razorpay test keys', 'React'],
        milestones: [
          { title: 'Orders table', detail: 'status enum (created → paid → refunded), unique idempotency_key, RLS so users see only their orders.' },
          { title: 'Create order', detail: 'Edge Function that accepts an Idempotency-Key header and returns the same order on retries.' },
          { title: 'Webhook', detail: 'Verify the signature, insert the event ID into processed_events (unique), then update the order.' },
          { title: 'Break it', detail: 'Double-click pay, kill the network mid-request, replay a webhook — document what happens.' },
        ],
        pitch: 'I built a checkout that survives double-clicks and replayed webhooks. Every write is keyed, so retries return the original result instead of charging twice.',
        talkingPoints: ['At-least-once delivery + idempotent processing = effectively once.', 'Why the webhook, not the redirect, decides that a payment succeeded.', 'What RLS protects and what it doesn\'t.'],
        followUps: [
          { q: 'Why not trust the success redirect from the payment page?', a: 'Users can close the tab or forge the redirect. The signed webhook (or a server-side fetch) is the source of truth.' },
          { q: 'What if the webhook arrives twice?', a: 'The event ID insert fails on the unique constraint the second time, so the update is skipped.' },
        ],
      },
      developer: {
        scope: 'Subscriptions for a SaaS: plans, upgrades, failed renewals, grace periods and refunds.',
        stack: ['Postgres', 'Provider SDK', 'Job queue', 'Alerting'],
        milestones: [
          { title: 'State machine', detail: 'trialing → active → past_due → canceled/expired, with allowed transitions enforced in one function.' },
          { title: 'Idempotency layer', detail: 'Middleware storing key, request hash and response; 409 for in-flight duplicates.' },
          { title: 'Webhooks', detail: 'Out-of-order safe: compare event timestamps, never move a subscription backwards.' },
          { title: 'Reconciliation', detail: 'Nightly job + dashboard of mismatches; alert when count > 0.' },
        ],
        pitch: 'Billing is a state machine fed by at-least-once events. We key every write, tolerate out-of-order webhooks, and reconcile nightly so drift is caught in hours, not at month-end.',
        talkingPoints: ['Request hash stops key reuse with a different payload.', 'Out-of-order webhooks and why timestamps beat arrival order.', 'Lost updates and when to use SELECT … FOR UPDATE.'],
        followUps: [
          { q: 'Two webhooks for the same subscription arrive at once. What stops a race?', a: 'Lock the subscription row (or use a version column) inside the transition function, so transitions serialise.' },
          { q: 'How long do you keep idempotency keys?', a: '24–72 hours, matching how long clients may retry; expired keys are pruned by a job.' },
        ],
      },
      interview: {
        scope: 'Design the payment service for a ride-hailing app at 5k payments per second.',
        stack: ['Partitioned Postgres or distributed SQL', 'Kafka', 'Outbox pattern', 'Ledger service'],
        milestones: [
          { title: 'Clarify', detail: 'Payment methods, settlement, refunds, regions, consistency requirements, SLA.' },
          { title: 'Write path', detail: 'Idempotent API → payment intent row + outbox event in one transaction → PSP call.' },
          { title: 'Async path', detail: 'Outbox relay → Kafka → ledger + notifications; consumers idempotent by event ID.' },
          { title: 'Correctness', detail: 'Double-entry ledger, reconciliation with PSP reports, retries with backoff and jitter.' },
        ],
        pitch: 'Money moves through an idempotent API and a transactional outbox, lands in a double-entry ledger, and is reconciled against the provider daily. Nothing relies on exactly-once delivery.',
        talkingPoints: ['Dual-write problem and the transactional outbox.', 'Double-entry ledger as the audit trail.', 'Retry storms and why backoff with jitter matters.'],
        followUps: [
          { q: 'The PSP times out. Did the charge happen?', a: 'Unknown — so retry with the same PSP idempotency key or query the intent status; never create a new charge blindly.' },
          { q: 'How do you scale writes?', a: 'Partition by merchant or user ID; keep each payment\'s state transitions on one partition so they stay serialised.' },
        ],
      },
    },
  },
  {
    slug: 'dataverse-service-desk',
    title: 'A service desk on Power Apps + Dataverse',
    dek: 'Tickets, SLAs and role-based views that keep working at 100,000 rows — the low-code project that proves you understand architecture.',
    topic: 'lowcode',
    concepts: ['dataverse', 'power-apps-delegation', 'supabase-rls'],
    architecture: [
      { part: 'Dataverse tables', role: 'Ticket, Category, SLA Policy, Comment — with lookups and choice columns.' },
      { part: 'Security roles', role: 'Requesters see their tickets; agents see their business unit; managers see all.' },
      { part: 'Canvas app', role: 'Delegation-safe galleries with StartsWith search and server-side filters.' },
      { part: 'Power Automate', role: 'SLA timers, escalation emails, Teams notifications on priority tickets.' },
      { part: 'Solutions + pipelines', role: 'Dev → Test → Prod with managed solutions.' },
    ],
    variants: {
      student: {
        scope: 'A campus IT helpdesk with a developer environment (free Power Apps Developer Plan).',
        stack: ['Power Apps Developer Plan', 'Dataverse', 'Power Automate'],
        milestones: [
          { title: 'Model the data', detail: 'Ticket ↔ Category lookup; Status and Priority as choices; Owner set automatically.' },
          { title: 'Delegation-safe search', detail: 'Use StartsWith on Title and filter by Status server-side; set the row limit to 1 to prove it.' },
          { title: 'Roles', detail: 'Two security roles (Student, IT Staff) with User vs Organization read depth.' },
          { title: 'Automation', detail: 'Flow that emails the requester when a ticket is resolved.' },
        ],
        pitch: 'I built a helpdesk on Dataverse that still finds the right ticket at 50,000 rows — because every search is delegable and access is enforced by security roles, not by hiding buttons.',
        talkingPoints: ['What delegation is and how you tested for it.', 'Why security roles beat in-app visibility rules.', 'Choice vs lookup columns.'],
        followUps: [
          { q: 'Why Dataverse and not a SharePoint list?', a: 'Relationships, row-level security roles and much better delegation once the table grows.' },
          { q: 'How did you check for delegation problems?', a: 'Set the data row limit to 1: any screen that still "works" with real data is delegating correctly.' },
        ],
      },
      developer: {
        scope: 'A department-wide service desk replacing an Excel tracker, with SLAs and reporting.',
        stack: ['Dataverse', 'Model-driven app for agents', 'Canvas app for requesters', 'Power BI', 'Pipelines'],
        milestones: [
          { title: 'Migration', detail: 'Clean and import the Excel history; map free-text categories to a reference table.' },
          { title: 'Two apps', detail: 'Model-driven for agents (views, forms, BPF); canvas for requesters on mobile.' },
          { title: 'SLA engine', detail: 'Due dates from SLA policy, escalation flow, breach dashboard.' },
          { title: 'ALM', detail: 'Managed solutions, environment variables for URLs, deployment pipeline.' },
        ],
        pitch: 'We replaced a 30,000-row Excel tracker with Dataverse: role-based access, SLA escalations and a pipeline from dev to prod, so changes ship without breaking production.',
        talkingPoints: ['Licensing implications of premium connectors.', 'Model-driven vs canvas: who each app is for.', 'Why ALM decisions must happen in week one.'],
        followUps: [
          { q: 'What does this cost?', a: 'Premium Power Apps licences for users of Dataverse apps; compare with the cost of the manual process it replaces.' },
          { q: 'How do you move changes to production?', a: 'Managed solutions through a pipeline, with environment variables for anything environment-specific.' },
        ],
      },
      interview: {
        scope: 'Explain how you\'d architect a Power Platform solution for 5,000 users across 12 business units.',
        stack: ['Dataverse', 'Business units + teams', 'Azure integration', 'CoE Starter Kit'],
        milestones: [
          { title: 'Environment strategy', detail: 'Dev/Test/Prod per solution, DLP policies, who can create environments.' },
          { title: 'Security model', detail: 'Business-unit hierarchy, owner teams, column security for sensitive fields.' },
          { title: 'Integration', detail: 'Web API / Azure Functions for heavy logic; virtual tables for external data.' },
          { title: 'Governance', detail: 'CoE toolkit for inventory, maker onboarding, capacity monitoring.' },
        ],
        pitch: 'Treat Power Platform like any other platform: environment strategy, a deliberate security model, pro-code where low-code ends, and governance so 200 makers don\'t create 200 problems.',
        talkingPoints: ['Business units vs teams vs sharing.', 'When to push logic to plug-ins or Azure.', 'Capacity: database vs file vs log storage.'],
        followUps: [
          { q: 'When would you not use Dataverse?', a: 'Tiny team apps (SharePoint is fine) or high-throughput transactional systems better served by Azure SQL.' },
          { q: 'How do you stop data leaking through connectors?', a: 'DLP policies that separate business and non-business connectors per environment.' },
        ],
      },
    },
  },
  {
    slug: 'habit-tracker',
    title: 'A daily-habit app with streaks (like this one)',
    dek: 'Auth, RLS, streak maths and an installable PWA. Small enough to finish, deep enough to discuss for an hour.',
    topic: 'frontend',
    concepts: ['react-useeffect', 'supabase-rls', 'sql-indexes', 'js-event-loop', 'cors'],
    architecture: [
      { part: 'React SPA (PWA)', role: 'Installable, offline app shell, optimistic updates.' },
      { part: 'Supabase Auth', role: 'Email/password, persisted sessions, JWT passed to Postgres.' },
      { part: 'Activity table', role: 'One row per action, unique per item — streaks and XP are derived, not stored.' },
      { part: 'RLS policies', role: 'auth.uid() = user_id on every user table.' },
      { part: 'Static hosting', role: 'Vercel with SPA rewrites and immutable asset caching.' },
    ],
    variants: {
      student: {
        scope: 'Track one habit (coding, reading) per day with a streak and a GitHub-style heatmap.',
        stack: ['React + Vite', 'Supabase', 'Tailwind', 'Vercel'],
        milestones: [
          { title: 'Schema + RLS', detail: 'checkins(user_id, day) with a unique constraint and own-row policies.' },
          { title: 'Streak logic', detail: 'Count consecutive days back from today (or yesterday if today isn\'t done). Use the user\'s local date.' },
          { title: 'Heatmap', detail: '26 weeks × 7 days grid, colour by count.' },
          { title: 'PWA', detail: 'Manifest, icons, service worker; install it on your phone.' },
        ],
        pitch: 'A habit tracker where the database enforces privacy with RLS and streaks are computed from raw check-ins, so they can never drift out of sync.',
        talkingPoints: ['Derived vs stored state (streaks).', 'Timezones: whose "today" is it?', 'Why the anon key can be public.'],
        followUps: [
          { q: 'A user in India checks in at 00:30. Which day counts?', a: 'Their local day — store the client\'s local date (validated within ±1 day of server time).' },
          { q: 'Why not store the streak as a number?', a: 'It becomes another thing to keep consistent. Deriving it from check-ins is cheap at this scale and always correct.' },
        ],
      },
      developer: {
        scope: 'Add reminders, offline check-ins that sync later, and analytics without leaking personal data.',
        stack: ['React', 'Supabase', 'Web Push', 'IndexedDB', 'Privacy-friendly analytics'],
        milestones: [
          { title: 'Offline queue', detail: 'Store check-ins in IndexedDB when offline; replay on reconnect with idempotent upserts.' },
          { title: 'Reminders', detail: 'Web Push subscription stored per device; scheduled function sends at the user\'s local time.' },
          { title: 'Performance', detail: 'Index (user_id, day); measure p95 of the dashboard query.' },
          { title: 'Analytics', detail: 'Aggregate events only; no PII in event payloads.' },
        ],
        pitch: 'Offline-first check-ins that sync idempotently, reminders at the user\'s local time, and a schema where every query hits an index.',
        talkingPoints: ['Idempotent sync of an offline queue.', 'Effects that subscribe/unsubscribe cleanly.', 'Index design for per-user time ranges.'],
        followUps: [
          { q: 'What if the same offline check-in syncs twice?', a: 'The unique (user_id, day) constraint plus upsert makes the replay a no-op.' },
          { q: 'Where do push reminders run?', a: 'A scheduled function queries users due in this time slot and sends Web Push; failures are retried with backoff.' },
        ],
      },
      interview: {
        scope: 'Design streaks and a global leaderboard for 10M daily users.',
        stack: ['Partitioned activity table', 'Redis sorted sets', 'Stream processor', 'CDN'],
        milestones: [
          { title: 'Clarify', detail: 'Timezone rules, leaderboard scope (global/friends/weekly), freshness needed.' },
          { title: 'Write path', detail: 'Append-only events, partitioned by user; idempotent by (user, item).' },
          { title: 'Read path', detail: 'Streak cached per user and updated incrementally; leaderboard in Redis ZSETs per period.' },
          { title: 'Edge cases', detail: 'Streak freezes, DST changes, late events, cheating detection.' },
        ],
        pitch: 'Events are the source of truth; streaks and leaderboards are projections — updated incrementally, cached in Redis, and rebuildable from the log at any time.',
        talkingPoints: ['Projections vs source of truth.', 'Redis sorted sets for top-N and rank queries.', 'Rebuildability as a design goal.'],
        followUps: [
          { q: 'How do you show a user their rank among 10M?', a: 'ZREVRANK on the sorted set is O(log N); cache the result briefly for the profile page.' },
          { q: 'A bug corrupts streaks. Now what?', a: 'Fix the projection code and replay the event log to rebuild streaks — that\'s why events are kept.' },
        ],
      },
    },
  },
]
