# Experiment 10 — Practical notes

- **CI** means automatically checking changes. The workflow in
  `.github/workflows/ci.yml` installs locked dependencies, builds the frontend,
  verifies the backend start script, and runs its tests. It does not deploy.
- **Vercel** hosts the Vite frontend. **Render** hosts the Express API and
  Socket.IO server. When connected to the same GitHub repository, each service
  can deploy its own directory after a push.
- Environment variables keep deployment-specific values out of source code.
  Configure `VITE_API_BASE_URL` in Vercel; configure `MONGO_URI`,
  `JWT_SECRET`, and `CORS_ORIGIN` in Render. Render provides `PORT`.
- Vite embeds `VITE_API_BASE_URL` when it builds. Set it to the real Render
  origin and redeploy the frontend after changing it. The local Vite proxy and
  Docker Nginx proxy remain in use when this variable is empty.
- CORS is a browser security policy. `CORS_ORIGIN` must contain the exact
  frontend origin, including scheme and hostname but no path or trailing
  slash. The backend applies the same allowlist to REST and Socket.IO.
- GitHub Actions runs on a push or pull request. Connected Vercel and Render
  services independently deploy updates from their configured branch; a green
  CI run by itself is not proof of deployment.

## Common deployment errors

| Symptom | Check |
| --- | --- |
| Vercel page loads but API calls fail | Set `VITE_API_BASE_URL` to the deployed Render origin and redeploy Vercel. |
| Browser reports a CORS error | Set Render `CORS_ORIGIN` to the exact Vercel origin, then redeploy/restart the backend. |
| Backend exits during startup | Confirm `MONGO_URI` is valid/reachable and `JWT_SECRET` has at least 32 characters. |
| REST works but real-time chat does not | Confirm the frontend uses the Render API origin, Socket.IO is enabled, and that origin is allowed in `CORS_ORIGIN`. |
| First request after inactivity is slow | A free hosting instance may need to wake up; retry after it starts. |
| Workflow does not run | Check the repository's Actions tab and confirm Actions are enabled and the push/PR reached GitHub. |
