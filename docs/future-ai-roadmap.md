# Future AI Roadmap

Travel Buddy’s current assistance is **deterministic and rule-based** (no external model calls). Future AI work should be additive and optional.

## Candidate phases

1. **Privacy-first itinerary assistant** — on-device or private-cloud suggestions that explain changes; never silent rewrites of bookings.
2. **Document OCR assist** — optional extraction from uploaded confirmations to feed the universal import review screen.
3. **Natural-language trip search** — map free-text intents onto the existing discovery/deal-engine query model.
4. **Risk narration** — explain Trip Health findings in plain language with actionable checklists.
5. **Post-trip journal summarisation** — user-triggered only; exportable; no automatic social posting.

## Guardrails

- No AI feature may invent live prices, partnerships, or confirmations
- User data minimisation; clear consent for any cloud model usage
- Keep local/demo mode fully usable without AI credentials
- Prefer structured tool-calling into existing domain modules over free-form HTML generation
