# License Sathi — "Ask the Expert" — v5 FINAL Production Specification (FROZEN)

**Status: frozen.** No new features to be added to this spec. Anything 
beyond what's here belongs in Section 14 (Phase 2) or a future revision — 
not scope-crept into this build.

```
CONTEXT:
I have an existing native Android mobile app called "License Sathi" — a Nepal driving 
license exam prep app. It already has an "Ask the Expert" button on Rules/
Signs/Fines/Law/Vehicle content cards (currently non-functional placeholder). 
The app uses a purple/lavender theme, Room DB for local caching, and supports 
Nepali/English bilingual content. There is (or will be) an admin panel for 
managing app content.

BACKEND STACK (locked — build against this, do not substitute or ask):
- Next.js for admin-panel and learner-web
- Backend: Firebase 
- ORM: Drizzle ORM
- Auth: Firebase Auth
- Hosting: Firebase 
- Storage: Firebase
The admin panel is a Next.js app on this same stack (or a separate Next.js 
app pointed at the same Supabase project — ask me only if that distinction 
actually changes how you'd structure the API routes).

TASK:
Implement "Ask the Expert" as a provider-agnostic, AI-powered Q&A feature, 
gated by rewarded ads for free users and unlimited for Pro subscribers, with 
a content-version-aware response cache, source citations, a feedback loop, 
and admin panel visibility into usage/cost plus secure API key management. 
Match existing visual style. This feature requires a server component — do 
not call any AI API directly from the client; API keys must never ship in 
the Flutter app, and must be read server-side only within the Next.js API 
routes (via the admin_api_keys table + .env fallback described in Section 10).

═══════════════════════════════════════
1. UNLOCK MODEL
═══════════════════════════════════════
- Free users: 1 rewarded ad view = 1 question. No credit banking.
- Pro subscribers: unlimited questions, no ads. Soft daily cap server-side 
  (e.g. 50/day) — friendly "daily limit reached" message, not a silent fail.
- Google AdMob Rewarded Ads (or existing ad SDK — ask me which).
- CRITICAL: Verify the ad reward server-side via AdMob SSV, not just the 
  client's onUserEarnedReward callback — client-only verification can be 
  spoofed for free AI calls. Grant the question credit only after 
  server-confirmed SSV.
- An ad-watch consumes the user's credit even if the answer comes from 
  cache — the unlock model is about access, the cache is a cost 
  optimization underneath it. Don't expose to the user whether their 
  answer was cached or freshly generated.

═══════════════════════════════════════
2. ABUSE DETECTION (beyond the daily cap)
═══════════════════════════════════════
The daily cap alone doesn't stop a bot from burning through ad-unlocks 
rapidly. Add:
  - Rate limit: max ~30 questions per 5 minutes per user, regardless of 
    unlock method
  - IP-based limit: flag/throttle unusually high request volume from a 
    single IP across multiple accounts
  - Device-based limit: tie to device ID (already likely available via the 
    ad SDK integration) to catch multi-account abuse from one device
  - Log rate-limit trips for admin review — see Section 11

═══════════════════════════════════════
3. RESPONSE CACHE — CONTENT-VERSION AWARE
═══════════════════════════════════════
Content is scoped to a fixed domain, so questions repeat heavily. But a 
cache keyed on question alone goes stale silently when you update fine/law 
content in the app. Fix: fold a content version into the cache key itself.

  cache_key = SHA256(normalized_question_text + content_version)

- Maintain a single `content_version` integer (or one per content_category 
  — see below) that increments whenever an admin edits Traffic Rules, 
  Signs, Fines, or Law content.
- Because content_version is part of the key, editing content automatically 
  makes all prior cache entries for that content unreachable (a new key 
  space) — no manual "clear cache" step needed for routine content edits. 
  Old rows can be garbage-collected by a scheduled cleanup job on TTL 
  expiry, or left to expire naturally.
- Recommend versioning per content_category (traffic_rules_version, 
  road_signs_version, fines_version, law_version) rather than one global 
  version, so editing a Sign doesn't invalidate all the Fine answers too.

Flow:
  1. Normalize question (lowercase, trim, strip punctuation)
  2. Determine relevant content_category for the question (from topic 
     context passed by the client, or inferred from retrieval)
  3. cache_key = SHA256(normalized_question + current_version_for_that_category)
  4. Look up cache_key in `ai_cache`
  5. Hit + not expired → return cached answer, increment hit_count
  6. Miss → run grounding retrieval (Section 4) + AI call → save → return

New table `ai_cache`:
  - id (PK)
  - cache_key (indexed, unique — see formula above)
  - question_text (original, for debugging/audit)
  - answer_text
  - content_category (ENUM: 'traffic_rules' | 'road_signs' | 'fines' | 
    'quiz_explanation' | 'other')
  - content_version_at_creation (INTEGER — the version this answer was 
    generated against, for audit trail)
  - matched_content_ids (JSON — grounding source, also used for citations)
  - model_name (e.g. 'claude-sonnet-4-6', 'gpt-5-mini', 'gemini-2.5-flash' 
    — which model produced this answer)
  - prompt_version (e.g. 'v1', 'v2' — which system prompt template was 
    used; lets you invalidate/regenerate answers when you improve the 
    prompt without waiting for content_version to change)
  - hit_count (INTEGER, default 0)
  - created_at
  - expires_at

TTL by content_category (still applies as a secondary safety net even with 
content-version invalidation — catches anything outside the versioning 
system, e.g. if the AI model itself gets deprecated):
  - traffic_rules → 30 days | road_signs → 6 months | quiz_explanation → 
    no expiry | fines/law → shortest, since these matter most legally

Near-duplicate questions ("helmet fine kati ho" vs "helmet nalagauda fine") 
still won't match on exact hash — flagged as a known limitation, see 
Section 14 for the planned Phase 2 fix. Don't build semantic matching now.

Storage: single table in Supabase Postgres (via Drizzle) is enough at 
current scale. Redis/Upstash only if lookups become a measured bottleneck.

═══════════════════════════════════════
4. GROUNDING + CITATIONS (STRICT — NO GENERAL KNOWLEDGE FALLBACK)
═══════════════════════════════════════
Only runs on a cache miss. Answer ONLY from the app's own Rules/Signs/
Fines/Law/Vehicle content.

- Retrieval: keyword/topic match for Phase 1 (semantic retrieval is a 
  Phase 2 upgrade, see Section 14).
- System prompt (versioned as prompt_version above):
  "You are a study assistant for Nepal driving license exam prep. Answer 
  ONLY using the CONTEXT provided below, which comes from official app 
  content. If the answer is not fully contained in the CONTEXT, say clearly 
  that you don't have that information in the study material and suggest 
  the user check the official Nepal Traffic Police / Department of 
  Transport Management source. Never estimate or guess a fine amount, 
  penalty, or legal rule that isn't explicitly in the CONTEXT. Include 
  which section/topic of the study material the answer came from."
- Include matched content (topic name, rule text, section/reference if 
  your content model has one) as CONTEXT in the API call.
- Display a citation under the answer in the UI, e.g. "Source: Traffic 
  Rules — Section 4" — pulled from matched_content_ids, not re-asked of 
  the AI. This is a trust signal for users, not just an internal log.
- Save matched_content_ids, model_name, prompt_version into the ai_cache 
  row.

═══════════════════════════════════════
5. AI PROVIDER — ABSTRACTED, NOT HARDCODED
═══════════════════════════════════════
Do not call a specific AI API directly from business logic. Build a small 
provider interface so switching models later doesn't touch the rest of 
the codebase:

  interface AIService {
    generateAnswer(question, context, promptVersion): AIResponse
  }
  class AnthropicProvider implements AIService { ... }
  class OpenAIProvider implements AIService { ... }
  class GeminiProvider implements AIService { ... }

- Select active provider via config (ideally the same admin-managed config 
  store from Section 10, e.g. an `active_ai_provider` setting), not a 
  hardcoded import.
- AIResponse should include: answer_text, model_name, prompt_tokens, 
  completion_tokens, total_tokens — needed for Section 6.
- This also makes provider outages easy to handle (fall back to a 
  secondary provider) without a redeploy, if that's ever worth building.

PROMPT MANAGEMENT — admin-editable, not hardcoded:
Rather than `prompt_version` living only as a string tag in code, store the 
actual prompt text in the database so it can be edited without a deploy.

New table `system_prompts`:
  - id (PK)
  - name (e.g. 'ask_expert_system_prompt')
  - version (e.g. 'v1', 'v2')
  - prompt_text
  - is_active (BOOLEAN — only one active version per name at a time)
  - created_at

- AIService pulls the active prompt_text for the given name at call time 
  (cache this in memory with a short TTL so it's not a DB read on every 
  request).
- Admin screen to view prompt history and activate a different version — 
  switching prompt versions becomes an admin action, no deploy needed.
- `ai_cache.prompt_version` (from Section 3) now refers to this table's 
  version field, so cache entries stay traceable to the exact prompt that 
  generated them.

MODEL PRICING — versioned, not hardcoded:
Token rates change over time (a provider might reprice a model), so don't 
hardcode a single price per model in application code.

New table `ai_model_pricing`:
  - id (PK)
  - model_name
  - prompt_cost_per_1k (DECIMAL)
  - completion_cost_per_1k (DECIMAL)
  - effective_from (DATE)
  - effective_to (DATE, nullable — null means currently active)

- `ai_cost_estimate` (Section 6) is computed by looking up the pricing row 
  where the call's model_name matches and created_at falls within 
  [effective_from, effective_to) — so historical cost data stays accurate 
  even after a provider changes their pricing, instead of every past 
  record silently recalculating at today's rate.

═══════════════════════════════════════
5b. AI TIMEOUT + FALLBACK (capped total wait)
═══════════════════════════════════════
Because Section 5 already abstracts providers behind AIService, use that 
same abstraction to handle a provider being slow or down.

Total user-facing wait must stay bounded — a double-retry chain (25s + 25s 
+ 25s) can push a single request past a minute, which is bad UX regardless 
of how reliable the retry logic is. Use this instead:

  Primary provider call, 20s timeout
    ↓ (on timeout/error)
  One retry against the SAME provider, 10s timeout
    ↓ (on timeout/error, and only if a fallback provider is configured)
  One call to the FALLBACK provider, 20s timeout
    ↓ (on timeout/error)
  STOP — friendly error to user, no further retries

  Worst case: 20 + 10 + 20 = 50s. If that's still too long in practice, 
  drop the same-provider retry entirely and go straight primary(20s) → 
  fallback(20s) → stop (worst case 40s) — pick whichever you observe 
  actually happens more: transient blips (same-provider retry helps) vs 
  real outages (retry just wastes time, skip straight to fallback).

- Fallback provider is optional — if only one provider is configured, skip 
  straight to the friendly error after the single same-provider retry.
- Set `status` on `ask_expert_questions` accordingly: 'success', 'timeout', 
  'failed' (non-timeout error), or 'rate_limited' (hit your own daily cap 
  or the provider's rate limit, not the same as a request failure).
- Don't build automatic multi-hop retries beyond the sequence above — past 
  that, fail fast and show the user a clear manual retry button instead of 
  making them wait longer.

═══════════════════════════════════════
6. TOKEN USAGE + COST TRACKING
═══════════════════════════════════════
`ask_expert_questions` — extend with real usage data, not just an estimate:
  - prompt_tokens (INTEGER, nullable — null if served from cache)
  - completion_tokens (INTEGER, nullable)
  - total_tokens (INTEGER, nullable)
  - ai_cost_estimate (DECIMAL, nullable — computed from token counts × 
    provider's per-token rate for model_name; keep a small rate table 
    per model rather than hardcoding one price)
  - status (ENUM: 'success' | 'failed' | 'timeout' | 'rate_limited' — see 
    Section 5b for how this gets set; makes "how many requests are 
    failing/timing out" a direct admin query instead of log-digging)

This makes the admin cost dashboard (Section 11) accurate instead of a rough 
guess, and lets you compare providers/models on real cost data if you ever 
switch.

═══════════════════════════════════════
7. FEEDBACK LOOP
═══════════════════════════════════════
- Below each answer in the chat UI: 👍 Helpful / 👎 Not Helpful
- New table `ask_expert_feedback`:
  - id (PK)
  - question_id (FK → ask_expert_questions.id)
  - rating (ENUM: 'helpful' | 'not_helpful')
  - submitted_at
- Feedback applies to the specific answer instance, not directly to the 
  cache row — but if a cached answer collects negative feedback beyond a 
  threshold (e.g. 3+ thumbs down), flag it in admin for manual review 
  rather than auto-deleting (a wrong answer might just need a prompt fix, 
  not just a cache clear).
- Admin dashboard section: "Top Bad Answers" — cache entries/questions 
  sorted by negative feedback count, so you know what to fix first.

═══════════════════════════════════════
8. CACHE WARMING
═══════════════════════════════════════
- Admin action: "Pre-generate answers for common questions" — admin pastes 
  or selects a list (e.g. top 100 expected questions per category, could 
  start as a manually curated list before real usage data exists), backend 
  runs them through the normal AI-call-and-cache path ahead of launch.
- Once real usage data exists, this can be semi-automated: periodically 
  suggest warming candidates from ai_cache entries with high hit_count 
  that are approaching expiry, so popular answers never go cold.
- Goal: first real users don't wait on a live AI call for the most common 
  questions.

═══════════════════════════════════════
9. ADMIN PANEL — FEATURE FLAGS
═══════════════════════════════════════
Toggle switches an admin can flip without a deploy, for fast incident 
response and controlled rollout:

New table `feature_flags`:
  - id (PK)
  - flag_key (e.g. 'ask_expert_enabled', 'provider_gemini_enabled', 
    'provider_openai_enabled', 'feedback_enabled', 'cache_enabled')
  - is_enabled (BOOLEAN)
  - updated_by (FK → admin_users.id)
  - updated_at (DATETIME)

Minimum flags to support at launch:
  - `ask_expert_enabled` — kill switch for the whole feature (e.g. if AI 
    costs spike unexpectedly and you need to pause it entirely)
  - `provider_<name>_enabled` — per-provider on/off, so if Gemini is down, 
    admin disables it and traffic routes to whatever provider is left 
    enabled, no deploy needed
  - `cache_enabled` — force-bypass the cache for debugging (e.g. verifying 
    the AI call path itself works, without cache hits masking a problem)
  - `feedback_enabled` — hide the 👍/👎 UI if it's ever noisy/low-signal

- Backend checks relevant flags before each ask-expert request; UI checks 
  `ask_expert_enabled` to hide the entry point entirely when off, with a 
  simple "temporarily unavailable" state rather than a broken button.
- Flag reads should be cached in memory with a short TTL, same pattern as 
  system_prompts above — don't hit the DB on every request just to check 
  a boolean.

═══════════════════════════════════════
10. ADMIN PANEL — API KEY MANAGEMENT
═══════════════════════════════════════
Move secrets currently in `.env` (AI provider keys, AdMob app ID/SSV key) 
into a database-backed, admin-editable store — `.env` as fallback only.

- Admin screen "Integration Keys": masked display (e.g. `sk-ant-...a91f`), 
  "Rotate" (write-only from the UI — never re-displays the decrypted 
  value), "Deactivate", last updated by/when.
- Runtime resolution: check `admin_api_keys` table first (decrypt) → fall 
  back to `.env` only if no active DB entry — lets you rotate a 
  compromised key instantly, no redeploy.
- Also store `active_ai_provider` here (from Section 5) so switching 
  providers is an admin action, not a code change.
- SECURITY — non-negotiable:
  - Encrypt key_value at rest (AES-256, encryption key from a separate 
    secrets manager, never the same DB)
  - Never return decrypted values to the frontend after saving
  - Restrict to superadmin role only — highest blast-radius screen in the 
    panel
  - Every view/rotate/deactivate action logged to 
    `admin_api_key_audit_log` (action, performed_by, performed_at — never 
    the key value itself)

═══════════════════════════════════════
11. ADMIN PANEL — ASK THE EXPERT ANALYTICS
═══════════════════════════════════════
- **Usage overview**: questions asked (today/7d/30d), cache hit vs AI call 
  split, cache hit rate %
- **Cost tracking**: real token-based AI spend vs estimated ad revenue 
  (from ad_reward_log) over the same period — cost-vs-revenue at a glance
- **Top questions**: highest hit_count entries — signals what content is 
  worth expanding, and what to sanity-check for correctness
- **Top Bad Answers**: from Section 7 feedback data
- **By category**: questions/cost broken down by content_category
- **Cache health**: entries nearing expiry, zero-hit entries (low value), 
  per-category content_version with a manual "bump version" action tied to 
  content edits (mostly automatic per Section 3, but a manual override is 
  useful for corrections)
- **Abuse/rate-limit log**: from Section 2, so repeated trips are visible, 
  not just silently blocked
- **Pro vs free breakdown**: usage by unlock type
- **Reliability**: breakdown by `status` (success/failed/timeout/
  rate_limited) over time — surfaces provider reliability issues before 
  they become a wave of user complaints

═══════════════════════════════════════
12. OBSERVABILITY / LOGGING
═══════════════════════════════════════
For production debugging, structure logs (not just ad-hoc console output) 
around every ask-expert request:

- request_id (unique per request, returned to client in error responses so 
  a user can reference it if they report an issue)
- trace_id (if you adopt OpenTelemetry — reasonable given the 
  multi-provider, cache-then-AI-call flow this feature already has)
- provider (which AIService implementation handled it, if it wasn't a 
  cache hit)
- cache_hit (boolean)
- duration_ms
- token counts (from Section 6)
- status (from Section 5b/6)

- Structured logs are enough for Phase 1 (e.g. pino/winston with these 
  fields as a consistent JSON shape) — full OpenTelemetry tracing across 
  services is worth adopting once there's more than one backend service in 
  the picture; note it as the natural next step rather than building 
  collector infrastructure now for a single Next.js API route.
- The `status` field on `ask_expert_questions` plus these logs together 
  should be enough to answer "why did request X fail" without needing to 
  reproduce it.

═══════════════════════════════════════
13. USER FLOW + UI
═══════════════════════════════════════
1. Tap "Ask the Expert" on a content card → topic_id/category passed as 
   context
2. Pro (under cap) → straight to question input. Free → rewarded ad → 
   server-confirmed unlock → question input
3. Chat-style input, pre-filled with topic context, editable
4. Question sent → cache lookup (content-version-aware) → cache hit or AI 
   call → answer + citation shown in chat bubble
   - OPTIONAL POLISH: on a cache miss (live AI call, typically 5–10s), show 
     a "typing..." indicator, or stream the response token-by-token if the 
     provider SDK supports it, instead of a blank wait. Cache hits should 
     still return instantly with no typing effect — don't fake a delay 
     for cached answers just for consistency. This is a UX nicety, not a 
     functional requirement — fine to skip in the first build and add 
     later if the perceived wait feels slow in testing.
5. 👍/👎 under each answer
6. Saved to "Ask History" — with **search, filter by category, and date 
   filter**, so past answers are actually findable as history grows, not 
   just a flat list
7. Clear, friendly states for: no credit yet, daily cap hit, no grounding 
   content found, request failed

═══════════════════════════════════════
14. PHASE 2 (NOTE ONLY — DO NOT BUILD YET)
═══════════════════════════════════════
- Semantic cache matching via embeddings/pgvector, so near-duplicate 
  questions ("helmet fine kati ho" vs "helmet nalagauda fine") hit the 
  same cache entry instead of requiring exact-text matches. Worth 
  revisiting once real usage data shows how much cache-miss volume is 
  actually near-duplicates vs genuinely new questions.
- Request queue (e.g. a job queue in front of the AI call path) if concurrent 
  request volume ever becomes high enough that synchronous API-route calls 
  start timing out or overwhelming the provider's rate limits — e.g. 1000 
  simultaneous ask-expert requests. Not needed at current or near-term 
  scale; noted here so the architecture doesn't need to be redesigned later 
  if it does become necessary — the AIService abstraction and cache layer 
  already sit in the right place to be wrapped by a queue worker without 
  changing the rest of the flow.

DELIVERABLE:
Give me the file(s) changed/added (client + server + admin panel), where 
the ad SDK, cache layer, AIService abstraction, prompt management, model 
pricing table, citation logic, feedback system, feature flags, and admin 
key/analytics/logging screens plug in, the exact SSV verification flow, 
the key encryption approach, and flag any new dependencies against the 
locked stack above (ad SDK, AI SDKs per provider, encryption library, any 
Next.js/Drizzle/Supabase packages needed) before adding them. This spec is 
frozen at 14 sections — do not propose additional features beyond what's 
written here or in Section 14.
```
