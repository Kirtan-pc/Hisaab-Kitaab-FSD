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
