# Experiment 10 — Progress

## Implemented

- Added `.github/workflows/ci.yml` for frontend build and backend tests on
  pushes and pull requests. It does not deploy the application.
- Added `render.yaml` for the backend's Render root directory, build/start
  commands, health check, and required environment-variable prompts.
- Added a centralized frontend API URL helper and routed REST and Socket.IO
  traffic through `VITE_API_BASE_URL`. Empty configuration preserves the
  existing local Vite and Docker same-origin proxies.
- Added `frontend/.env.example` with a safe placeholder and updated the root
  README, backend README, and Experiment 10 documentation.
- Preserved existing Docker configuration, authentication, CORS allowlisting,
  MongoDB startup behavior, `/api/health`, and shop-scoped Socket.IO.

## Local verification

- `npm --prefix frontend run build` — passed.
- `npm --prefix backend test` — passed, 27 tests.
- YAML syntax parsing of `.github/workflows/ci.yml` and `render.yaml` — passed.
- `git diff --check` — passed.

## Not yet verified

- No GitHub Actions run, Vercel deployment, Render deployment, public URL, or
  cloud frontend-to-backend request has been verified.
- A live MongoDB connection and browser-level CORS/Socket.IO test were not run.
- Node.js 22 was used locally and is configured in CI; the Render Node runtime
  still needs confirmation in the created service.

## Remaining

1. Push these reviewed changes to GitHub yourself; do not commit secrets.
2. Connect `frontend` to Vercel and make an initial deployment to obtain its
   origin.
3. Create the Render service from `render.yaml` (or configure the same values
   manually), enter `MONGO_URI` and `CORS_ORIGIN` securely, and obtain its URL.
4. Set `VITE_API_BASE_URL` in Vercel to the Render URL and redeploy.
5. Verify each platform's deployment independently and test `/api/health`,
   sign-in, and real-time messaging from the deployed site.
