# Architecture

Travel Buddy Assistant AI starts as a clean React, Vite, TypeScript, and Tailwind frontend.

## Baseline architecture

- `src/main.tsx` mounts the React application.
- `src/App.tsx` renders the top-level app.
- `src/components` contains reusable UI building blocks.
- `src/data` contains early static product/module definitions.
- `docs` records the product and architecture decisions.

## Long-term architecture direction

The product should be built for future integrations rather than hardcoded fake access.

Planned integration categories include:

- AI assistant and itinerary generation
- Search and discovery providers
- Maps and location intelligence
- Flight providers and fare comparison APIs
- Hotels and accommodation providers
- Booking agents and affiliate providers
- Restaurants and local experience providers
- Tours, activities, cruises, transfers, taxis, and chauffeur services
- User account, saved trip, booking, and document storage

## Principle

The MVP should clearly separate available functionality from future planned integrations. Do not claim live provider access until integrations are actually implemented and verified.
