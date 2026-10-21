# Experiment 7 — Dockerize and Run Hisaab किताब

## Objective and requirements

Package the existing React/Vite frontend and Express API into separate Docker
images, then start them together with Docker Compose. The project remains on
its existing `Exp6` branch and continues to use its existing MongoDB
connection, JWT authentication, protected routes, validation, and role checks.

Requirements: Docker Desktop for Windows with Docker Compose, Git, and a
MongoDB connection already permitted by the existing `backend/.env`. The
frontend build uses Node.js 22 in its image; a separate host Node installation
is not needed to run the Compose stack.

## Architecture

```text
Browser (http://localhost:8080)
             |
             v
       frontend (Nginx :80)
       /                 \
static React/Vite files   /api/* reverse proxy
                              |
                              v
                       backend (Express :5000)
                              |
                              v
                    existing MongoDB connection
```

The browser uses the same-origin relative `/api/...` URLs already present in
the frontend. Nginx forwards these requests to the Compose service named
`backend`; that internal name is used only container-to-container and is never
put into browser JavaScript. The proxy preserves API paths, HTTP methods,
request bodies, and the `Authorization` header. This avoids browser DNS and
CORS problems while retaining the API's existing CORS checks for other origins.
The backend port is also published on host port 5000 for direct API tools.
MongoDB is not placed in a new container and its URI is not changed.

## Docker files and concepts

- `backend/Dockerfile` builds the existing Express API using the official
  Node.js 22 Alpine image, installs locked production dependencies, runs as the
  image's non-root `node` user, and checks API/database readiness.
- `frontend/Dockerfile` uses Node.js 22 to run the actual TypeScript/Vite
  production build, then serves the generated `dist` files using Nginx.
- `frontend/nginx.conf` serves the single-page React app and reverse-proxies
  `/api` traffic to the backend.
- `.dockerignore` files keep dependencies, build output, local environment
  files, credentials, and Git data out of their respective build contexts.
- `docker-compose.yml` declares the two services, their ports, health checks,
  startup dependency, restart behavior, and private bridge network.
- The Compose image names are `kirtan15/hisaab-kitaab-backend:latest` and
  `kirtan15/hisaab-kitaab-frontend:latest`. Compose can build these images
  locally and publish them to Docker Hub after authentication.

An **image** is the packaged template built from a Dockerfile. A **container**
is a running instance of an image. A **Dockerfile** contains repeatable image
build instructions. **Docker Compose** starts and connects the project's
services as one application. Port mapping (`8080:80`) makes a container port
available on the Windows host. Compose's network lets Nginx resolve the
backend by its service name; `localhost` inside one container would refer to
that same container, not another one.

Environment variables supply runtime configuration without baking it into an
image. The backend keeps using `MONGO_URI` (or `MONGODB_URI`) and `JWT_SECRET`.
The Compose file reads them from the existing private `backend/.env`; it
overrides only `PORT` and `CORS_ORIGIN` for the Docker network and local web
origins. The tracked `backend/.env.example` contains placeholders only. Never
put a real URI, password, JWT secret, or token in source, screenshots, or Git.

Health checks periodically ask whether a service is ready. The backend check
requires both a working health endpoint and a connected MongoDB; the frontend
check requests its served page. Compose waits for backend health before
starting the frontend. MongoDB must therefore be reachable during startup.

## Configure locally

1. Open Docker Desktop and wait until its engine is running.
2. From the project root, make a private backend environment file if one is
   not already present:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```

3. Edit `backend\.env` locally. Set the existing MongoDB URI to a valid
   connection and set a unique `JWT_SECRET` of at least 32 characters. Leave
   the example file as placeholders; do not commit `backend\.env`. MongoDB
   Atlas users may need to allow the current outbound IP and verify DNS/TLS
   settings. Do not disable database security to work around connection errors.

**Important:** the published backend image intentionally does not contain
`.env` or a JWT secret. Start it with the Compose commands below from this
project root; Compose injects `backend\.env` at runtime. Starting the image
directly with Docker Desktop's **Run** button does not automatically load this
file and will cause the `JWT_SECRET must contain at least 32 characters`
startup error. Do not add the secret to the Dockerfile or rebuild it into the
image.

The API requires a database connection before it listens. No database,
administrator account, or credentials are created by this Docker setup.

## Build, run, verify, and stop (Windows PowerShell)

Run commands from the project root (`hisaab-kitaab`). The examples use an
isolated Compose project name so they do not share containers or networks with
other Compose projects.

```powershell
docker --version
docker compose version
docker compose -p hisaab-kitaab-exp7 config -q
docker compose -p hisaab-kitaab-exp7 pull
docker compose -p hisaab-kitaab-exp7 up -d --no-build --force-recreate
docker compose -p hisaab-kitaab-exp7 ps
docker compose -p hisaab-kitaab-exp7 logs --tail 50 backend
Invoke-RestMethod http://localhost:8080/api/health
Invoke-WebRequest http://localhost:8080
Invoke-RestMethod http://localhost:5000/api/health
```

Open <http://localhost:8080> in a browser. In Developer Tools → Network, reload
the page and select the `api/health` request. Confirm it is served from the
frontend origin and has a successful response. For an authentication check,
use the existing **Sign in / registration demo** from the app cover: sign in
with an existing test account, then select **Test authenticated route**. The
browser sends the bearer token through Nginx to Express. The API's
`GET /api/protected` must still return `401` without a token; do not include
tokens in screenshots. Registration/login require a real MongoDB and valid
account data, and should not be attempted with a real user's credentials.

To view status and logs or rebuild after editing:

```powershell
docker compose -p hisaab-kitaab-exp7 ps
docker compose -p hisaab-kitaab-exp7 logs --tail 50 backend frontend
docker compose -p hisaab-kitaab-exp7 build
docker compose -p hisaab-kitaab-exp7 up -d
```

Stop only this project's containers and network (the MongoDB volume/database
is not managed by Compose here):

```powershell
docker compose -p hisaab-kitaab-exp7 down
docker compose -p hisaab-kitaab-exp7 ps
```

No `-v` or global prune command is needed. Do not use commands that remove
unrelated images, volumes, containers, or databases.

## Publish and use the public Docker Hub images

The images have been published with the `latest` tag to the public Docker Hub
repositories:

- <https://hub.docker.com/r/kirtan15/hisaab-kitaab-backend>
- <https://hub.docker.com/r/kirtan15/hisaab-kitaab-frontend>

Both remote manifests were verified after pushing. To rebuild and publish
updates later, sign in locally with Docker's interactive login (or a Docker
Hub access token when prompted); never put a password or token in this guide,
a command line, or source control.

From the project root in PowerShell:

```powershell
docker login --username kirtan15
docker compose -p hisaab-kitaab-exp7 build
docker compose -p hisaab-kitaab-exp7 push
```

The first command authenticates through the local Docker CLI. When prompted,
enter a Docker Hub password or preferably a Docker Hub access token with
permission to publish these repositories. The last command uploads both
Compose images.

To pull and run the published versions on a machine with this project
configuration, a private `backend/.env`, and access to the configured MongoDB:

```powershell
docker compose -p hisaab-kitaab-exp7 pull
docker compose -p hisaab-kitaab-exp7 up -d --no-build
```

The public images contain application code, not the MongoDB URI or JWT secret.
The backend still requires the user's local `backend/.env`, and its startup
requires a reachable MongoDB connection. Public images can be downloaded by
anyone; do not push confidential code or data.

## Troubleshooting

- **Compose says `backend/.env` is missing:** copy the example as shown above
  and enter valid local values.
- **Backend reports `JWT_SECRET` is missing or too short:** verify
  `backend\.env` contains a `JWT_SECRET` value of at least 32 characters, then
  recreate the container so it receives the current file:

  ```powershell
  docker compose -p hisaab-kitaab-exp7 up -d --force-recreate backend
  docker compose -p hisaab-kitaab-exp7 logs --tail 30 backend
  ```

  Run from the project root so Compose uses this project's
  `backend\.env`. Do not print the secret in the terminal or paste it into
  logs/screenshots. Updating `.env` does not change the environment of an
  already-created container.
- **Backend exits or stays unhealthy:** inspect `docker compose ... logs
  --tail 50 backend`; check that `JWT_SECRET` is at least 32 characters and
  MongoDB URI, DNS, TLS, and network/IP allowlisting are valid.
- **Frontend is unavailable:** confirm Docker Desktop is running, port 8080 is
  free, then inspect frontend logs and `docker compose ... ps`.
- **API shows 502:** wait for backend health and inspect backend logs and its
  MongoDB connectivity.
- **Port is already allocated:** stop the process using that specific port or
  change the host-side port mapping and use the matching origin/URL. The
  container ports remain 80 and 5000.
- **Changes do not appear:** rebuild with `docker compose -p
  hisaab-kitaab-exp7 build`, then recreate with `up -d`.

## Verification record and limitations

Record only checks actually completed on this machine. The frontend is a
production static build in a container; browser verification is distinct from
unit tests and does not prove every database-backed ledger operation.

| Check | Result |
| --- | --- |
| Backend automated tests (`npm test`) | Passed: all 22 tests |
| Frontend type-check and production build (`npm run build`) | Passed |
| Compose configuration (`docker compose ... config -q`) | Passed |
| Docker image build | Passed: backend and frontend images built |
| Docker Hub publish | Passed: both public `latest` images were pushed and their remote manifests verified |
| Containers started and healthy | Partial: frontend was healthy; backend stayed unhealthy because MongoDB Atlas could not be reached |
| Host/browser frontend page | Passed: `http://localhost:8080` returned HTTP 200 and showed the existing Hisaab किताब app |
| Browser-originated API request | Not passed: browser `fetch('/api/health')` reached Nginx but got HTTP 502 because the backend could not start |
| MongoDB-backed authentication/protected request | Not run: backend did not become ready; no database security was bypassed |
| Clean Compose shutdown | Passed: this project's containers and network were removed; no volumes were deleted |

The backend log reports that it could not connect to any servers in the
configured MongoDB Atlas cluster and recommends checking the IP allowlist.
This environment could not determine whether the exact cause is Atlas
allowlisting, DNS, outbound network access, or another Atlas connectivity
setting. Before repeating the integration checks, verify the Docker host's
current outbound IP in the Atlas Network Access list, DNS resolution, TLS, and
the existing URI—without changing the database or weakening its access rules.
Then rerun the Compose verification commands above. Only mark the API,
authentication, and protected-route screenshots complete after those requests
actually succeed.

Files `prompt.md`, `progress.md`/`PROGRESS.md`,
`complete_detailed_overview.md`, and `notes.md` were not present in this
checkout; this guide and the actual source/configuration are the Experiment 7
record. Do not claim a browser or database check passed unless you perform it
and see its result.

## Practical journal screenshot checklist

Capture genuine screenshots after your own Docker Desktop run. Every item
below is **MANUAL — capture it yourself**; no screenshots are generated or
claimed by this guide. Hide account details, tokens, connection strings, and
secret values before capturing.

| # | What to open/show and what must be visible | What it proves | Suggested filename and caption |
| --- | --- | --- | --- |
| 1 | Docker Desktop; engine status shows running. | Docker engine is available. | `01-docker-desktop.png` — “Docker Desktop engine is running.” |
| 2 | VS Code Explorer at project root; show `docker-compose.yml`, backend and frontend Docker files, and this guide. | Docker configuration belongs to the existing application. | `02-docker-files.png` — “Experiment 7 files in the Hisaab किताब project.” |
| 3 | VS Code `backend/Dockerfile`; show Node image, production install, non-root user, health check, and startup command. | Backend container is based on the real API. | `03-backend-dockerfile.png` — “Backend image build and runtime configuration.” |
| 4 | VS Code `frontend/Dockerfile`; show multi-stage build and Nginx stage. | Actual React/Vite assets are built and served. | `04-frontend-dockerfile.png` — “Frontend production build and Nginx image.” |
| 5 | VS Code `docker-compose.yml`; show both services, ports, health dependencies, env-file reference, and network. Do not show `.env` values. | Services are composed and connected. | `05-compose-configuration.png` — “Docker Compose frontend and backend services.” |
| 6 | PowerShell after `docker compose -p hisaab-kitaab-exp7 build`; show successful completion of both image builds. | Docker built the configured images. | `06-image-build.png` — “Both application images built successfully.” |
| 7 | Docker Desktop Containers view or `docker compose ... ps`; show both services running/healthy. | Containers are running. | `07-running-containers.png` — “Frontend and backend containers are healthy.” |
| 8 | PowerShell backend logs; show API listening with no secrets. | Backend started. | `08-backend-logs.png` — “Express API startup logs.” |
| 9 | Browser at `http://localhost:8080`; show the existing app, not a placeholder. | The container serves the Hisaab किताब frontend. | `09-frontend-browser.png` — “Hisaab किताब opened from the Docker frontend.” |
| 10 | Browser Developer Tools Network; select `api/health`, show request URL under `localhost:8080` and a successful status/response. | Browser-originated API call passed through Nginx to the backend. | `10-browser-api-request.png` — “Browser `/api/health` request succeeded through the proxy.” |
| 11 | Existing auth demo after using a non-sensitive test account; show successful `/api/protected` response without the Authorization header/token visible. | Authentication still works through the proxy. | `11-protected-route.png` — “Authenticated protected-route response via Docker.” |
| 12 | Terminal with health response and clean `docker compose ... down`/empty project status. | Final verification and orderly shutdown. | `12-final-verification.png` — “Health check passed and Experiment 7 stack stopped.” |

## Experiment 7 concepts recap

The Dockerfile turns the real app into an image; Docker runs that image as a
container. Compose describes how the frontend, backend, and network fit
together and starts them with one command. Host port mappings make the app
reachable from Windows, while the private Compose network lets the reverse
proxy reach the API by service name. Environment files configure secrets at
runtime instead of embedding them in the image. Health checks test readiness
and let Compose wait for the database-connected API before starting Nginx.
