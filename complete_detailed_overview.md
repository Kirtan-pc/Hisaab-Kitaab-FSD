# Experiment 10 — CI/CD deployment preparation

This experiment adapts the GitHub Actions, Vercel, and Render practical to the
existing Hisaab किताब React/Vite and Express/MongoDB application. It retains
the current JWT authentication, shop-level authorization, health endpoint,
Socket.IO service, and Docker setup.

## Repository layout and runtime

- Frontend: `frontend` (React, TypeScript, Vite; `npm run build`; output
  directory `dist`).
- Backend: `backend` (Express, MongoDB, Socket.IO; `npm start`; automated
  tests use Node's built-in test runner).
- Both directories have `package-lock.json`; CI installs with `npm ci`.
- Node.js 22 is used by the existing Dockerfiles and configured in CI.
- The repository's current branch is `Exp8`, while its remote default branch
  points to `Exp1`. CI therefore runs on pushes and pull requests across
  branches rather than assuming a `main` branch.

## CI workflow

`.github/workflows/ci.yml` runs two independent Ubuntu jobs:

1. **Frontend build** checks out the repository, sets up Node.js 22, runs
   `npm ci` in `frontend`, and runs `npm run build`.
2. **Backend tests** installs `backend` dependencies, verifies that the
   package defines a start script, and runs `npm test`.

The backend tests do not require production MongoDB credentials. A failed
install, build, start-script check, or test fails its job. This is continuous
integration only; it is not a deployment workflow. Vercel and Render deploy
separately when connected to GitHub.

## Frontend deployment on Vercel

1. Import the existing GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Use Vite (or specify build command `npm run build` and output directory
   `dist`).
4. Make an initial Vercel deployment and note its public origin. The site can
   load before the API environment variable is set, but API-backed features
   will not work yet.
5. Configure Render's `CORS_ORIGIN` with that exact Vercel origin, deploy the
   backend, and copy its actual public origin, for example
   `https://your-service.onrender.com`.
6. In Vercel project settings, add
   `VITE_API_BASE_URL=https://<actual-render-service>.onrender.com`, with no
   trailing slash. This is public frontend configuration, not a secret.
7. Redeploy after adding or changing the variable because Vite embeds it at
   build time.
8. Test registration/sign-in, protected API calls, and Socket.IO from the
   deployed site. `VITE_SOCKET_URL` can optionally override the same origin if
   Socket.IO is hosted separately.

The local Vite proxy (`/api` and `/socket.io`) and Docker's Nginx proxy still
work when `VITE_API_BASE_URL` is unset. No localhost URL is hardcoded into
production API requests.

## Backend deployment on Render

The repository-root `render.yaml` defines a Node Web Service:

| Setting | Value |
| --- | --- |
| Root directory | `backend` |
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check path | `/api/health` |

Use the Render Blueprint flow to create the service, or enter the same values
in a Web Service connected to this repository. Configure:

- `MONGO_URI`: the private MongoDB Atlas connection string. Atlas must allow
  connections from Render (or use an appropriately scoped network policy).
- `JWT_SECRET`: a private random value with at least 32 characters. The
  Blueprint generates this value.
- `CORS_ORIGIN`: the exact deployed frontend origin (scheme and hostname, no
  path/trailing slash). It can be a comma-separated allowlist if more than one
  frontend origin is required.
- `PORT`: Render supplies this. The backend already listens on `process.env.PORT`
  and falls back to port `5000` for local development.

Do not add `MONGO_URI` or `JWT_SECRET` to Vercel, source control, or screenshots.
The existing `/api/health` response reports `database: "connected"` or
`database: "unavailable"` accurately. The backend connects to MongoDB before
it begins listening.

## Frontend/backend and Socket.IO communication

`frontend/src/api.ts` centralizes the optional Vite API origin. The auth demo
and health check use this helper; the Socket.IO client uses the same configured
origin unless `VITE_SOCKET_URL` overrides it. On production Vercel, the API
origin must be set to Render. The backend's existing `CORS_ORIGIN` allowlist
protects REST requests and Socket.IO handshakes; it must include the deployed
frontend origin. Authentication continues to use the existing bearer token
for REST and the authenticated Socket.IO handshake.

## Local checks and commands

From the project root (`hisaab-kitaab`) in Windows PowerShell:

```powershell
npm --prefix frontend ci
npm --prefix frontend run build
npm --prefix backend ci
npm --prefix backend test
```

In the current verification run, the frontend production build passed and all
27 backend tests passed. YAML syntax checks and `git diff --check` also passed.
These checks do not prove that cloud services are connected or deployed.

## Automatic deployment verification

1. Review the changes and diff.
2. Commit and push to the GitHub branch you choose; the developer has not
   committed or pushed these changes.
3. In GitHub **Actions**, confirm the workflow run has green frontend and
   backend jobs.
4. In Vercel, separately confirm a deployment from the same commit.
5. In Render, separately confirm the backend deployment and inspect
   `https://<actual-render-service>.onrender.com/api/health`.
6. Open the Vercel URL and exercise a real API-backed sign-in/protected route
   and Socket.IO chat. Inspect browser Network/Console and service logs if
   requests fail.

The deployment URLs and live test results must be recorded only after the
actual platforms have completed these steps. No cloud account was accessed
for this implementation.
