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

### Still placeholder / future

Broader concierge modules (live destination discovery, supplier inventory, AI assistant with provider access) remain future work. Those surfaces must not pretend to have live unlimited provider access before integrations exist.

Verified production Supabase project linkage is still pending.

## Non-goals for the baseline

- No fake booking engine
- No fake airline or hotel inventory
- No unsupported claims of complete provider access
- No scraping or provider access unless legally and technically approved
- No applying cloud migrations to unrelated Supabase projects
