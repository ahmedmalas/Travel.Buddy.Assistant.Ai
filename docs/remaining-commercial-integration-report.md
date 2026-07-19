# Remaining Commercial Integration Report

## Exact blockers before real deal searching

1. Commercial agreements with each inventory provider
2. Sandbox then production credentials stored outside the frontend bundle
3. Live adapter implementation behind `registerLiveAdapter` with `isLive: true`
4. Attribution parameter certification and disclosure copy sign-off
5. Branding/compliance review per provider programme
6. Rate-limit/cache policy validation against provider docs
7. End-to-end QA against sandbox inventory (availability + deep links)

## Cloud blockers (optional but recommended)

1. Dedicated Travel Buddy Supabase project (current MCP org projects are unrelated)
2. Apply `supabase/migrations/` RLS/storage SQL
3. Verify live auth email delivery and sync against that project

## Explicitly deferred

- In-app payments
- Automatic booking execution
- Scraping or unofficial inventory access
- Fabricated traffic/conversion metrics for partner sales materials
