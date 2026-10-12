# Product Completion Status — Virtual Event

## Classification

- Product family: Vercel Virtual Event Starter Kit reference/customization
- Canonical repository: `shikakker/virtual-event`
- Completion branch: `ai/product-completion/virtual-event`
- Vercel project: `virtual-event` (`prj_q36EZAQ3lWa7JSpjrIPeaTT5Q1NH`)
- Maturity: functional event starter with CMS, registration/GitHub ticket flows and screenshot generation; not yet a production-owned event service
- Production `main`: historical READY deployment on the inherited runtime

## Product flow

Attendee → browse event/speakers/schedule → register/connect GitHub → receive/share ticket image → attend stages.

The branch keeps that flow while hardening provider/runtime boundaries instead of inventing unrelated features.

## Verified engineering work

- Migrated Next.js 12.0.1 → 15.5.24.
- Migrated prerelease React/ReactDOM → stable 18.2.0.
- Pinned Node 22.x.
- Replaced unmaintained `chrome-aws-lambda` with `@sparticuz/chromium` + current Puppeteer Core.
- Removed unused legacy Agility CMS dependencies.
- Hardened CMS collection reads so malformed provider responses fail closed to arrays rather than breaking static generation.
- Hardened screenshot lifecycle and guaranteed browser close on success/failure.
- Hardened ticket-image route: GET-only, bounded username before Redis/Chromium work, controlled recoverable screenshot failures.
- Kept `validator` on the patched 13.15.35 runtime because registration legitimately imports `isEmail`.
- Pinned the Next-owned PostCSS transitive dependency above the audited source-map disclosure fixes (`next/postcss` 8.5.23).
- Added regression contracts for runtime, CMS, screenshot and ticket-image boundaries.
- Added severity-aware production dependency audit: high/critical block; moderate/low are reported without Yarn v1 false-failure semantics.
- Replaced the one-shot self-mutating migration workflow with a permanent read-only Quality workflow.

## Verification evidence

Permanent exact-head Quality run `35095474742` on SHA `71b53563d34956a60ddf4af1debe41f8b2b9b397`:

- frozen `yarn.lock` install: PASS
- regression tests: **12/12 PASS**
- TypeScript: PASS
- lint: PASS
- Next 15.5.24 production build: PASS
- production high/critical audit gate: PASS

Exact-head Vercel preview `dpl_4d3WRt5AzppdYiAcipBkevzgSPFr` on the same SHA:

- build: READY
- `/`: HTTP 200
- `/speakers`: HTTP 200
- recent runtime errors after smoke: none detected
- malformed/missing CMS collections degrade to empty content instead of failing the deployment

The hosted preview still shows inherited starter-kit branding/content (`ACME`, Vercel demo metadata, historical event copy). That is truthful for the current starter/reference product and is not being relabeled as an owned production event.

## T01–T10 CORE TASKS

- T01 — DONE — Reproduce modern-Node production build failure from Vercel logs.
- T02 — DONE — Add runtime regression contracts before migration.
- T03 — DONE — Move to supported Next/React/Node versions without OpenSSL legacy flags.
- T04 — DONE — Replace deprecated serverless Chromium stack and close browser resources reliably.
- T05 — DONE — Harden ticket-image method/input/failure boundaries.
- T06 — DONE — Harden CMS collection responses used by static-generation flows.
- T07 — DONE — Add test/typecheck/lint/build/security-audit verification.
- T08 — DONE — Commit only a migration that passed the full guarded verification loop.
- T09 — DONE — Exact-head Vercel preview READY, root/speakers HTTP smoke PASS and no recent runtime errors.
- T10 — IN PROGRESS — Registration/GitHub/Redis/CMS end-to-end smoke with real provider configuration.

## I01–I10 IMPROVEMENTS

- I01 — DONE — Supported runtime/toolchain.
- I02 — DONE — Stable React instead of prerelease runtime.
- I03 — DONE — Maintained Chromium/Puppeteer serverless dependency.
- I04 — DONE — CMS malformed-data resilience.
- I05 — DONE — Browser resource cleanup.
- I06 — DONE — Ticket-image input/method validation.
- I07 — DONE — Controlled screenshot failure response.
- I08 — DONE — Severity-aware production dependency audit and patched Next PostCSS resolution.
- I09 — DONE — Permanent immutable Quality CI after one-shot migration.
- I10 — IN PROGRESS — Interactive responsive/a11y browser QA at 375 / 768 / 1024 / 1440 and current product/provenance decision.

## F01–F10 PRODUCT FEATURES

- F01 — DONE — Shareable attendee ticket-image flow retained and hardened.
- F02 — DONE — Speaker/schedule/stage/expo/jobs routes retained through the runtime migration build.
- F03 — DEFERRED WITH REASON — attendee account expansion; starter currently uses registration/GitHub token flow and requires product ownership decision.
- F04 — DEFERRED WITH REASON — persistent attendee profile; needs an explicit data-retention/privacy model.
- F05 — DEFERRED WITH REASON — event organizer dashboard; no owned organizer workflow/backend is defined.
- F06 — DEFERRED WITH REASON — moderation/admin roles; requires an authorization model first.
- F07 — DEFERRED WITH REASON — notifications; requires provider/consent decisions.
- F08 — DEFERRED WITH REASON — analytics funnel; add only after event/product ownership is established.
- F09 — DEFERRED WITH REASON — multi-event tenancy; not justified for the current single-event starter.
- F10 — DEFERRED WITH REASON — payments/ticket sales; legal/payment product scope is not defined.

## Remaining real gates

1. Interactive responsive/a11y browser QA at 375 / 768 / 1024 / 1440; the available Vercel fetch path verifies HTTP/rendered HTML but not visual viewport behavior.
2. Provider-backed smoke for registration/GitHub OAuth, Redis ticket state and CMS content with valid environment configuration.
3. Product ownership decision before replacing inherited ACME/Vercel starter branding, event date/content and metadata.

No merge, production promotion, credential mutation, billing action or user-data mutation has been performed.

## 2026-10-12 continuation — attendee GitHub binding requires registration ownership

- **P0 IDOR:** `pages/api/save-github-token.ts` previously trusted an arbitrary `body.id` to link an authenticated GitHub identity to a stored ticket. A different known attendee registration ID could be mutated without proving ticket ownership.
- **Fix:** requests now require `body.id` to exactly match the HttpOnly `COOKIE` set by `/api/register` before any Redis lookup or change. The endpoint accepts only bounded string ID/token payloads, denies non-same-origin Fetch Metadata when present, and replies 503 rather than throwing when Redis is unconfigured.
- **Regression:** `tests/github-ticket-ownership.test.mjs` guards authorization ordering and malformed input. Exact GitHub branch source readback: **8/8 focused contracts PASS**. This is a source verification, **not** a full runtime request, npm/Next build, account/OAuth or Vercel browser E2E check.
- **Status:** T/I attendee registration ownership **DONE IN CODE / INTEGRATION PENDING**, overall **PARTIAL**. Existing Draft PR #2, no merge/production promotion, Redis mutation, OAuth transaction or credential changes.
- **Next:** exact-head test/typecheck/lint/build; run real fake Redis integration: own cookie success, foreign/missing cookie 403, absent Redis 503; verify attendee ticket and GitHub OAuth in preview using fixture accounts.

## 2026-10-13 — registration JSON ingress: P1 crash prevention

- **Root cause:** `POST /api/register` accessed `req.body.email` and called `.trim().toLowerCase()` before asserting that the body and its `email` field were strings. Requests with `null` body or nonstring email crashed with `TypeError`, producing an uncontrolled server error.
- Test-first `tests/registration-ingress.test.mjs` commit `c778c5b` adds cases for null, arrays, numbers, objects, unexpected captcha-token types and bounded lengths, plus a source-level test that the real handler validates before storage.
- Added `lib/registrationInput.ts` in `1686c81` (exact source SHA `2ca92d5dc97d4dfb2692f5fdff49c7571e9ec52f`) and wired it into `pages/api/register.ts` in `d33ac8e`. Bad input returns the existing 400 response; valid normalized email and optional captcha token continue through existing validator.
- **RED** pre-fix direct Node reproduction: null/nonstring fields threw `TypeError`. **GREEN** Node 22 execution on SHA-matched helper: **2/2 PASS** (malformed shapes and normalization cases). Entire Next.js regression suite, lint, typecheck, build and authenticated provider/CMS/Redis/browser E2E **NOT EXECUTED** at this exact head. Keep [Draft PR #2](https://github.com/shikakker/virtual-event/pull/2) PARTIAL.
- **Critical release caveat:** `register` issues an unsigned `user-id` HttpOnly cookie in response to merely knowing an email, and `save-github-token` checks its equality to `body.id`. This alone is **not proof of email ownership**; someone able to register using another known email could receive that registration ID/cookie. A verified identity/email challenge or equivalent authenticated ownership is required before declaring attendee-to-GitHub binding secure. No live registration/user mutation or OAuth action performed.

## 2026-10-13 — high-severity dependency audit and OAuth secret URL repair

- **Root cause (dependency gate):** Yarn's previous lock pinned `source-map-js@1.2.1` and `sharp@0.35.4`, both covered by newly published high-severity advisories. CI run `38301513466` completed tests/typecheck/lint/Next build successfully but correctly failed the production audit on these two advisories.
- **Security fix:** `package.json` now resolves `**/source-map-js: 1.2.2` and `**/sharp: 0.35.5` (commit `3c27dd3`). A read-only GitHub runner generated and verified the actual Yarn lock diff (run `38303957913`, SUCCESS); the strict unified diff was applied to the exact `yarn.lock` blob (commit `c083330`). The temporary read-only workflow was deleted after use (`a218fa1`). No dependency audit gates were skipped.
- **OAuth secret exposure:** `pages/api/github-oauth.ts` previously included `client_secret` in the HTTPS URL query string of the OAuth code exchange. This could expose the secret in URL telemetry/logging even though the transport was encrypted.
- **RED test:** commit `7b84545` added `tests/github-oauth-secret-boundary.test.mjs`; GitHub CI run `38304331630` failed at `yarn test` with `ERR_MODULE_NOT_FOUND` for the intended new safe token-exchange helper.
- **GREEN fix:** `lib/githubOAuthTokenRequest.ts` builds URL-encoded POST form bodies, never a secret-bearing URL; `redirect: error` prevents following provider redirects with credentials. `pages/api/github-oauth.ts` uses that helper, rejects unconfigured/malformed exchanges and avoids logging provider response bodies. Commits `e0ea412`, `cd4ba0d`.
- **Exact code-head CI:** workflow run `38304440036` at SHA `cd4ba0da3312a6efc47d8430c3a9906cc5ca407c` completed SUCCESS: frozen Yarn install, **22/22 Node tests**, TypeScript, ESLint, Next.js production build, and severity-aware production audit. Audit output: **0 high/critical**, 1 low and 9 moderate advisories. This is verified repository/CI readiness on the code SHA; no active hosted OAuth end-to-end account test was performed.
- **Remaining security gate:** `register` accepts an arbitrary email without verifying control of that mailbox. Its deterministic email-to-ID registration cookie alone does not prove account ownership; linking a verified GitHub account to an attendee record must not be declared identity-safe until email ownership or an equivalent authenticated identity match is established. Do not promote full registration/payment/identity functionality without that safeguard.
- **Delivery gates:** exact SHA `cd4ba0d` Vercel preview and 375/768/1024/1440 real-browser QA still NOT VERIFIED; latest known READY preview SHA `3c27dd3` predates the new lock and OAuth changes. Product status **PARTIAL / Draft**. No merge, production domain, provider credential or billing change.
