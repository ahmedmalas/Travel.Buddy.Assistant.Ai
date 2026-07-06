# Travel Buddy Assistant AI

React + Vite + TypeScript + Tailwind CSS frontend (single-page app). Package manager is npm. There is no backend, database, or test framework in the current baseline.

## Cursor Cloud specific instructions

- Single service: the Vite dev server. Standard commands live in `README.md` and `package.json` (`npm run dev`, `npm run typecheck`, `npm run build`, `npm run preview`).
- Dev server runs on `http://localhost:5173/` by default; it does not print a network URL unless started with `--host`.
- There is no `lint` script. `.oxlintrc.json` exists but `oxlint` is not installed as a dependency, so there is no lint step to run.
- There are no automated tests. Verify changes via `npm run typecheck`, `npm run build`, and by exercising the app in the browser.
- Core end-to-end flow to sanity-check the app: fill in the Trip Brief form (destination, dates, travelers, at least one interest) near the bottom of the page and click "Generate draft plan" to render a draft plan.
