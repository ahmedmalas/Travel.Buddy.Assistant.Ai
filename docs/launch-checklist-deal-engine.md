# Launch Checklist — Super Deal Engine & Partner Platform

## Before enabling any live provider

- [ ] Verified Travel Buddy commercial agreement for the provider
- [ ] Sandbox credentials issued and stored server-side / env only (never frontend source)
- [ ] Adapter implemented behind registry with `isLive: true` only after approval
- [ ] Attribution parameters and disclosure copy reviewed legally
- [ ] Branding requirements satisfied
- [ ] Rate-limit / timeout / retry behaviour validated against provider docs
- [ ] Cache policy confirmed within provider rules
- [ ] Trust panel shows live vs cached freshness correctly
- [ ] Sponsored labelling verified
- [ ] Ranking regression tests confirm commission independence

## Product QA gates (already automated locally)

- [x] Provider failure / partial results handling (orchestrator)
- [x] Duplicate offer suppression
- [x] Stale/simulated price labelling
- [x] Currency conversion helper (estimated demo FX)
- [x] Mandatory fees in universal offer totals
- [x] Deterministic ranking + large-set load test
- [x] Affiliate disclosures in UI
- [x] Deep-link generation
- [x] Backup includes `dealEngine` (schema v6)
- [ ] Mobile comparison visual QA in browser
- [ ] Keyboard accessibility pass on Deals nav + panels
- [ ] Live provider end-to-end search (blocked until credentials)

## Explicit non-goals until approved

- Automatic booking / payment processing
- Scraping
- Public partnership announcements
- Fabricated savings/traffic metrics
- Deploy / auto-merge
