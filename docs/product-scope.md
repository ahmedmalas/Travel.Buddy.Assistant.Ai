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

### Completed and verified on `main` (Slices 9–28)

Local-first Trip Workspace platform:

- Itinerary editing with undo/redo
- Trip backup import/export and preview
- Snapshot history, comparison, labels/notes, pin/retention
- Storage health, diagnostics, and recovery controls
- Integrity audit, selective repair, forecasting/simulation accuracy, and diagnostics
- Automated validation gate (`npm run validate`)

Details: [`docs/completed-slices.md`](completed-slices.md).

### Still placeholder / future

The app shell still exposes product language for broader concierge modules (destination discovery, budgets, live bookings, AI assistant with supplier access). Those surfaces must not pretend to have live unlimited provider access before integrations exist.

Slice 29+ has not been started.

## Non-goals for the baseline

- No fake booking engine
- No fake airline or hotel inventory
- No unsupported claims of complete provider access
- No scraping or provider access unless legally and technically approved
- No backend sync, accounts, or multi-device storage in Slices 9–28
