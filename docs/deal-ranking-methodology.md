# Deal Ranking Methodology

Travel Buddy ranks offers using **final estimated payable total** and traveller-weighted factors. Headline base price alone is never sufficient.

## Score inputs

- Total cost (fee-inclusive)
- Travel duration
- Stops
- Departure / arrival time fit (placeholder weights until live schedules)
- Self-transfer risk
- Cancellation flexibility
- Provider quality / reputation
- Baggage inclusion
- Accommodation location
- Traveller preference alignment
- Accessibility
- Booking fragmentation
- Price confidence

## Explainability

Every ranked result includes:

- `whyThisDeal` short summary
- `rankReasons` detailed bullets
- `scoringBreakdown` per-factor contribution

Users can adjust scoring weights in the Super Deal Engine preferences UI.

## Hard rules

1. **Commission independence** — sponsored / commission-paying offers never receive hidden score boosts.
2. **Determinism** — identical offer sets + weights + preferences produce identical order (score desc, then payable total asc, then id).
3. **Honesty** — UI copy must not claim a result is the cheapest available everywhere; trust panels show providers searched, time searched, freshness, inclusions/exclusions, confidence, booking provider, and affiliate disclosure.
