# Completion plan

1. Verify upstream provenance before portfolio claims. The polished TypeScript component set, conference/job UI, CODEOWNERS/Code of Conduct, Apache-style project structure and long README suggest a public virtual-event starter/reference implementation rather than a blank-slate personal app.
2. Diff against the verified upstream repository/version and document custom design/code/configuration separately. Do not claim inherited conference, jobs, auth/integration or infrastructure features as authored work.
3. Audit `.env.local.example` and server/API code for every third-party integration and secret. Ensure tokens, CAPTCHA credentials, CMS/database URLs and signing secrets are server-only and absent from history.
4. Map the real product flows present in code—conference entries, forms, jobs grid, contact/share/download interactions and any authentication/data layer—and mark which require external services versus static demo data.
5. Security-review all public forms/API routes: schema validation, CAPTCHA verification, rate limiting, abuse controls, email/header injection, URL validation and safe error responses.
6. Verify responsive/accessibility behavior of the substantial component library: headings/landmarks, form labels/errors, keyboard focus, dialogs/menus if present, SVG semantics and reduced motion.
7. Test degraded states for unavailable APIs, empty event/job datasets, slow requests and invalid form submissions. The UI should remain understandable without every external service configured.
8. Pin/document the supported runtime and update stale dependencies in controlled steps. Preserve original architecture unless a migration fixes a concrete security/runtime problem.
9. Add focused integration tests for the actually customized flows and a build/smoke CI job using mocked external services; avoid coverage theater over untouched upstream code.
10. Rewrite README with upstream attribution, architecture diagram, required integrations, safe local setup, verified feature list and exact custom contribution. Portfolio framing should emphasize adaptation/integration unless the diff demonstrates substantial original product engineering.
