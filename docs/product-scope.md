# Product Scope

Travel Buddy Assistant AI is intended to become a travel super-assistant: part travel planner, part search assistant, part concierge, and part trip organiser.

## Core vision

The application should help users plan and manage travel without needing to manually jump across Google, airline websites, hotel websites, booking platforms, tour providers, restaurant sites, taxi services, chauffeur services, cruise providers, and local guides.

## Long-term capability areas

- Flights: cheapest, best, fastest, business, economy, flexible, and preference-based options
- Hotels: cheapest, best rated, best area, family-friendly, luxury, business, and user-preference matching
- Destinations: compare cities, suburbs, neighbourhoods, and travel styles
- Itineraries: build daily plans and full trip schedules
- Budgets: estimate trip costs and compare options
- Bookings: organise travel documents, reservations, and confirmations
- Restaurants: find local food options based on preferences
- Activities: sightseeing, attractions, tours, and experiences
- Transport: taxis, private transfers, chauffeurs, airport pickups, and local transport guidance
- Cruises: compare and plan cruise options
- Guidance: assistant-style help before, during, and after the trip

## MVP scope

### Completed and verified (Slices 9–28 on `main`)

Local-first backup/integrity platform:

- Trip backup import/export and preview
- Snapshot history, comparison, labels/notes, pin/retention
- Storage health, diagnostics, and recovery controls
- Integrity audit, selective repair, forecasting/simulation accuracy, and diagnostics
- Automated validation gate (`npm run validate`)

### Completed in Slices 29–36 (Trip Platform)

- Trip creation/setup with validation and drafts
- Trip overview dashboard
- Day-by-day itinerary planner
- Bookings manager (local metadata only)
- Budget tracker
- Packing lists and templates
- Traveller profiles (passport metadata fields only)

### Completed in Slices 37–44 (Vault Platform)

- Multi-trip vault (favourites, archive, duplicate, search/filter/sort)
- Trip templates
- Calendar planner with drag-and-drop scheduling
- Document metadata + expiry reminders (attachment placeholders only)
- Global search across vault entities
- Collaboration foundation (local roles/permissions/audit; no backend sync)
- Vault/template import & migration (backup v4)

Details: [`docs/completed-slices.md`](completed-slices.md).

### Completed in Slices 45–52 (Platform Foundation)

- Store decomposition into domain modules
- Cloud-ready repository contracts (local provider active)
- Auth shell and sync engine foundations (no live providers)
- Collaboration lifecycle upgrade
- Notification centre + command centre dashboard
- Lazy-loaded panels and release hardening

### Completed in Slices 53–60 (Supabase Cloud Foundation)

- Supabase client/env validation + in-repo schema/RLS/storage migrations
- Live auth adapters with local/demo fallback
- Cloud persistence adapters + local→cloud migration + offline fallback
- Push/pull sync with deterministic conflict resolution
- Collaboration cloud hooks + permission enforcement
- Secure document storage helpers (private bucket, signed URLs)
- Account/workspace settings, export, deletion safeguards

**Note:** Remote Supabase migrations are not applied until a verified Travel Buddy project is confirmed. Local/demo mode remains default.

### Completed in Slices 61–72 (Frontend Complete)

- Destination profiles, flights, stays, ground transport
- Maps/routes shell (manual time/distance; no paid maps)
- Checklist centre, emergency centre, travel journal
- Rule-based smart assistance (deterministic, no external AI)
- Grouped navigation + design polish + onboarding
- Error boundaries, backup v5 migration compatibility, docs/QA

### Completed in Slices 73–88 (Super Deal Engine & Partner Platform)

- Provider-neutral adapters (mock/demo) across major inventory categories
- Universal fee-inclusive offer model + explainable, commission-independent ranking
- Flight/stay super-search, whole-trip packages, flexible discovery
- Comparison/handoff checklist (no payments), price alerts (simulated)
- Preference profiles, trust centre, affiliate attribution
- Partner centre / onboarding framework / growth foundations
- Backup v6 + deal-engine persistence; docs for adapters, ranking, partnerships, disclosures

### Completed in Slices 89–100 (Finalisation)

- Universal import + Trip Health Score + offline/performance/a11y/security foundations
- Local analytics, release centre, operations dashboard
- Developer platform docs + launch readiness / commercial / AI / OTA roadmap reports
- Backup v7; regression anchors across Slices 9–99

### Still placeholder / future

Live supplier inventory (after credentials + approval), paid maps, and generative AI assistant access remain future work. Verified production Supabase project linkage is still pending.

## Non-goals for the baseline

- No fake booking engine claiming live inventory
- No unsupported claims of complete provider access or global cheapest
- No scraping or provider access unless legally and technically approved
- No fabricating conversions, savings testimonials, or partnership endorsements
- No applying cloud migrations to unrelated Supabase projects
- No automatic booking or payment processing yet
