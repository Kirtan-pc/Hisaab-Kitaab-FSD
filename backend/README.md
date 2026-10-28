# Experiment 5 — Secure REST APIs

This backend continues the Hisaab किताब REST API from Experiment 4. It adds input validation, shop-owner authentication, shop-level authorization, password hashing, rate limits, security headers, and consistent error responses.

## Setup

From this directory:

```bash
npm install
```

Create a private `backend/.env` using `.env.example` as a guide. Set a real MongoDB connection string and a unique random `JWT_SECRET` of at least 32 characters. You can generate a secret locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Keep `.env` private; do not paste its values into screenshots, commits, or chat.

```env
MONGO_URI=mongodb+srv://<your-connection-string>
PORT=5000
JWT_SECRET=<random-secret-at-least-32-characters>
CORS_ORIGIN=http://localhost:5173
```

Start the API:

```bash
npm run dev
```

The server refuses to start if the JWT secret or MongoDB connection string is missing. `GET http://localhost:5000/api/health` reports the API and database connection state.

## Postman walkthrough

Use `http://localhost:5000` as the base URL and set request bodies to JSON.

1. Register with `POST /api/auth/register`:

   ```json
   {
     "name": "Shankar Tea Stall",
     "ownerPhone": "9876543210",
     "password": "use-a-unique-password-12"
   }
   ```

   The response contains a short-lived JWT and the public shop profile. Passwords are never returned.

2. Sign in with `POST /api/auth/login` and the same phone/password. Copy the returned token.

3. For protected routes, choose **Authorization → Bearer Token** in Postman and paste the token. For example, `GET /api/shops` returns only the signed-in shop.

4. Add a product with `POST /api/products`, using:

   ```json
   { "name": "Chai" }
   ```

5. Create a customer with `POST /api/customers`:

   ```json
   { "name": "Manoj" }
   ```

6. Create an order with `POST /api/orders`, using the customer and product IDs returned by the previous requests:

   ```json
   {
     "customer": "<customer-id>",
     "product": "<product-id>",
     "quantity": 1,
     "source": "manual"
   }
   ```

7. Remove the bearer token and retry a protected endpoint. It must return `401`. Try a malformed phone/password or an unsupported JSON field; registration must return `400` without storing anything.

The API deliberately takes the shop ID from the signed token, not from write-request JSON. Product, customer, order, and payment lookups are constrained to that shop. A customer or product ID belonging to a different shop is not accepted.

## Security behavior

- `helmet` sets common HTTP security headers.
- CORS accepts only the comma-separated origins in `CORS_ORIGIN` (requests without a browser `Origin`, such as Postman, are allowed).
- The API accepts JSON bodies up to 10 KB.
- `express-rate-limit` allows 100 API requests and 10 login/registration attempts per IP in 15 minutes.
- `express-validator` checks fields and `allowOnly` rejects fields that the endpoint does not support.
- `bcryptjs` hashes passwords with a work factor of 12. Registration requires
  at least 12 characters and limits the UTF-8 password length to bcrypt's
  72-byte input maximum.
- JWTs use HS256, a fixed issuer/audience, and a one-hour expiry.
- A centralized error handler maps invalid input, duplicate records, oversized bodies, and unknown routes to safe JSON responses. Unexpected server errors are logged by route and error type without returning internal details.
- The built-in rate-limit store is per Node.js process. A multi-instance deployment must configure a shared rate-limit store and its trusted proxy settings.

## Automated checks

```bash
npm test
```

These HTTP smoke tests use Node's built-in test runner and do not need MongoDB. They check headers, unauthenticated access, validation, malformed JSON, CORS, and password-hash serialization. Database-backed registration and ledger CRUD still require a configured MongoDB connection.

## Experiment 6 — JWT Authentication and Roles

Experiment 6 extends the same `Shop` account model used by Experiment 5. A
shop owner is the project's account/user, and the shop document is also the
tenant boundary for that owner's products, customers, orders, and payments.
There is no second `User` collection.

New registrations use `name`, `email`, `ownerPhone`, and `password`. Email is
trimmed and lowercased. The phone remains required for compatibility with
existing shop accounts and phone-number login. Registration always creates a
`user` role. The request allowlist rejects a submitted `role`, so a public
client cannot promote itself.

JWTs contain the account ID in `sub` and the signed `role` claim. They expire
after one hour. Existing signed Experiment 5 tokens with no role claim are
treated as ordinary `user` tokens until they expire. Each new login gets the
current stored role.

### Administrator provisioning

There is no public role-change endpoint. First register an ordinary account,
then run this controlled command from the backend directory using that
account's email:

```bash
npm run admin:promote -- owner@example.com
```

The script updates only an existing account, requires the private MongoDB
connection in `backend/.env`, and never prints credentials. Sign in again after
promotion so the returned JWT contains the administrator role.

### Demonstration endpoints

| Method | URL | Access |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Public; creates an ordinary account |
| `POST` | `/api/auth/login` | Public; accepts email or legacy phone plus password |
| `GET` | `/api/auth/me` | Any authenticated account |
| `GET` | `/api/protected` | Any authenticated account |
| `GET` | `/api/admin` | Administrator role only |

### Exact Postman workflow

Use `http://localhost:5000` as the base URL. For JSON requests, select
**Body → raw → JSON** and add `Content-Type: application/json`.

1. **Register an ordinary user** — `POST /api/auth/register`, no token:

   ```json
   {
     "name": "Shankar Tea Stall",
     "email": "owner@example.com",
     "ownerPhone": "9876543210",
     "password": "sample-password-12"
   }
   ```

   Expected `201 Created`. The response has `token` and `shop` with `id`,
   `name`, `email`, `ownerPhone`, and `role: "user"`. It never contains a
   password or hash. Use a new email and phone if those values already exist.

2. **Try duplicate registration** — repeat the request with the same email
   (use a different phone). Expected `409 Conflict` and
   `{"message":"A record with that unique value already exists."}`.

3. **Try self-promotion** — submit the registration body with
   `"role": "admin"` added. Expected `400 Bad Request`; the response identifies
   `role` as an unsupported field and no account is created.

4. **Sign in** — `POST /api/auth/login`:

   ```json
   {
     "email": "owner@example.com",
     "password": "sample-password-12"
   }
   ```

   Expected `200 OK` with a new `token` and safe `shop` details. An incorrect
   email/password pair returns `401` with a generic message.

5. **Copy the JWT** from the login response's `token` value. In Postman, open
   the request's **Authorization** tab, choose **Bearer Token**, and paste
   the token (without adding quotation marks). Postman sends
   `Authorization: Bearer <token>`.

6. **No token** — `GET /api/protected`, Authorization set to **No Auth**.
   Expected `401 Unauthorized` with
   `{"message":"A valid bearer token is required."}`.

7. **User protected route** — `GET /api/protected` with the ordinary user's
   bearer token. Expected `200 OK`:

   ```json
   {
     "message": "You are authenticated.",
     "account": { "id": "<shop-id>", "role": "user" }
   }
   ```

8. **User denied admin route** — `GET /api/admin` with the same token.
   Expected `403 Forbidden` and
   `{"message":"You do not have permission to access this resource."}`.
   Changing a URL, query string, or request body role does not change the
   signed role in the token.

9. **Provision an administrator** using the command above from the
   `backend/` directory. This is a local operator action, not an HTTP endpoint.

10. **Sign in as the administrator** with `POST /api/auth/login` and the
    administrator account's email/password. In Postman, replace the previous
    bearer token with this login response's token.

11. **Admin route** — `GET /api/admin` with the administrator token. Expected
    `200 OK`:

    ```json
    {
      "message": "Administrator access granted.",
      "account": { "id": "<shop-id>", "role": "admin" }
    }
    ```

12. **Current account** — `GET /api/auth/me` with either account's valid
    token. Expected `200 OK` with `id`, `name`, `email`, `ownerPhone`, and the
    stored `role`; password fields are not returned.

13. **Invalid token** — replace the token with `not-a-real-token` and repeat
    step 7. Expected `401 Unauthorized`. Expired-token rejection is also
    covered by the automated tests.

### Frontend demonstration

Start the API and Vite client in separate terminals. On the cover page select
**Sign in / registration demo**. Register or sign in, inspect the returned
account role, and test `/api/auth/me` and `/api/protected`. The administrator
button is shown only for an administrator account; the backend still checks
every request. The original local diary preview remains available separately.
The demo keeps its JWT in component memory and clears it on sign-out or a `401`;
it does not put the token in local storage.

### Screenshot checklist

Capture genuine results from your own run; do not fabricate screenshots.

1. `01-project-structure.png` — `backend/`, `frontend/`, and auth files in VS Code.
2. `02-user-registration.png` — successful `201` ordinary-user registration.
3. `03-duplicate-registration.png` — duplicate email returning `409`.
4. `04-user-login-jwt.png` — successful login and token field (keep the token private).
5. `05-protected-without-token.png` — `401` from `/api/protected`.
6. `06-protected-with-user-token.png` — `200` from `/api/protected`.
7. `07-admin-denies-user.png` — `403` from `/api/admin` for a user token.
8. `08-admin-login.png` — admin login response (keep the token private).
9. `09-admin-route-success.png` — `200` from `/api/admin`.
10. `10-auth-me.png` — `/api/auth/me` showing the account role.
11. `11-auth-middleware-code.png` — `requireAuth` and `authorizeRoles` in VS Code.
12. `12-automated-tests.png` — all backend tests passing.
13. `13-server-and-database.png` — backend listening and `/api/health` reporting a connected database.

### Test scope

`npm test` runs 22 HTTP and model tests without requiring MongoDB. Model
operations in account tests are controlled test doubles; these are not genuine
database integration tests. A real registration, login, and role-promotion
demonstration requires the configured private MongoDB connection and fresh
test account values.

## Experiment 7 — Docker deployment

The backend Dockerfile runs this same API as a non-root Node.js process and
checks that the API and MongoDB are ready. Compose reads the existing private
`backend/.env` at runtime; it does not bake credentials into the image. See
the project-root [Docker experiment guide](../DOCKER-EXPERIMENT-7.md) for
environment setup, commands, proxy architecture, verification, and the
practical screenshot checklist.

## Experiment 8 — Socket.IO messages

Socket.IO is attached to the existing Express HTTP server. Clients must
present the same short-lived JWT used by the REST API in the Socket.IO
handshake. The shared token verifier supplies the shop ID; messages are
broadcast only to that shop's room. The `chatMessage` event accepts a text
payload of 1–500 characters, permits at most five messages per connection in
10 seconds, and uses a server-generated sender ID, timestamp, and message ID.
Malformed messages receive an acknowledgement error and are not broadcast.
Socket.IO messages are not persisted.

Allowed origins come from `CORS_ORIGIN`. The Vite proxy handles `/socket.io`
during development, and Nginx forwards WebSocket upgrades and polling requests
for the Docker frontend. Run `npm test` here for API and live Socket.IO
integration tests; these tests use an in-process HTTP server and do not need
MongoDB.

## Experiment 10 — Render deployment

The root [`render.yaml`](../render.yaml) configures this directory as a Render
Node.js Web Service with `npm ci`, `npm start`, and `/api/health`. Add
`MONGO_URI` and the deployed frontend's exact origin as `CORS_ORIGIN` in the
Render environment. The Blueprint generates `JWT_SECRET`; Render provides
`PORT` automatically. The health endpoint reports the database state as
`connected` or `unavailable`; it does not claim that a database is connected
when it is not.

The frontend origin is public configuration, but MongoDB credentials and
`JWT_SECRET` are server-only secrets. Enter them in Render's environment
settings, never in the frontend or Git. Full Experiment 10 setup and local
verification are documented in the project-root
[`complete_detailed_overview.md`](../complete_detailed_overview.md).
