# Production preparation and deployment checklist

This repository contains an Express/MySQL API and a React 18 single-page app.
This guide prepares an operator to deploy it; **no hosting provider has been
selected and the application is not deployed by these instructions**. Do not
run production migrations until a host, database, backups, and release window
have been selected.

## Supported runtime and layout

Use an actively supported Node.js LTS release. As checked against the
[official Node.js release schedule](https://nodejs.org/en/about/previous-releases)
on 2026-10-10, Node.js 24 is LTS. Backend dependencies include Express 4,
mysql2 3, and Jest 29; the frontend build uses React Scripts 5. Run the
repository's backend tests and frontend production build on the exact runtime
chosen for hosting before release. The locked React Scripts 5.0.1 package
declares Node.js `>=14.0.0`; Node.js 24 LTS is a supported, maintained option.

- API working directory: `backend/`; entry point: `src/index.js`.
- Frontend working directory: `frontend/`; `npm run build` creates `build/`.
- The API uses `PORT` (defaults to 5000), and loads `backend/.env` when started
  through `src/index.js`.
- Configure `REACT_APP_API_URL` as the absolute API origin **including `/api`**.
  CRA embeds this value at build time; rebuild the frontend after changing it.
- Serve the React build as static files with SPA history fallback to
  `index.html` for routes such as `/equipment/123`, `/messages`, and `/wishlist`.

## MySQL setup and safe upgrades

Create a MySQL database and restricted application account. For a fresh
database, run `npm run db:setup` from `backend/`. Do not run this destructive
setup command against an existing production database. For an existing schema:

1. Make and verify a restorable database backup, including schema and data.
2. Schedule a maintenance window and stop API writes.
3. Inspect existing review duplicates:

   ```sql
   SELECT booking_id, reviewer_id, COUNT(*) AS review_count
   FROM reviews
   GROUP BY booking_id, reviewer_id
   HAVING COUNT(*) > 1;
   ```

   The migration deliberately aborts if duplicate reviews exist. Resolve each
   case with the business owner (for example, determine which review is valid);
   the migration never deletes historical reviews automatically.
4. From `backend/`, run `npm run db:migrate`. This repeatable additive migration
   preserves refund-column upgrades and adds token-version revocation, unique
   review enforcement, indexes, favorites/chat/notification tables, and the
   nullable equipment location columns (`city`, `latitude`, `longitude`) with
   an `idx_equipment_city` index. Existing listings keep `NULL` location values
   and remain browsable; owners can set a city from the listing's Edit page.
   The API selects these columns, so run the migration before deploying the
   new backend.
5. Verify the API readiness endpoint and perform the two-account smoke tests
   below before reopening traffic.

Migrations do not remove data. There is no automatic down migration: restoring
the verified pre-upgrade backup is the rollback procedure. Do not manually
drop new tables or constraints if the upgraded application has accepted
traffic, because those tables may already contain user data.

## Environment configuration

Set secrets only in the host's secret manager, never in source control. Example
variable names (values are placeholders):

```dotenv
NODE_ENV=production
PORT=5000
DB_HOST=managed-mysql.internal
DB_PORT=3306
DB_NAME=equipment_rental_db
DB_USER=equipment_rental_app
DB_PASSWORD=<generated-secret>
JWT_SECRET=<random-secret-at-least-32-characters>
JWT_EXPIRE=7d
CORS_ORIGINS=https://marketplace.example
TRUST_PROXY_HOPS=1
STRIPE_SECRET_KEY=<Stripe-live-secret>
STRIPE_WEBHOOK_SECRET=<Stripe-live-endpoint-secret>
STRIPE_PUBLISHABLE_KEY=<Stripe-live-publishable-key>
```

Frontend build-time variables:

```dotenv
REACT_APP_API_URL=https://api.example.com/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=<matching-Stripe-publishable-key>
# Optional: map tiles for the Browse page map view. Defaults to the public
# OpenStreetMap tile server, which is meant for light use only; for production
# traffic use a tile provider you have an agreement with.
# REACT_APP_MAP_TILE_URL=https://tiles.example.com/{z}/{x}/{y}.png
# REACT_APP_MAP_TILE_ATTRIBUTION=&copy; Example tiles, &copy; OpenStreetMap contributors
```

Do not configure production `CORS_ORIGINS` as `*`. Set a comma-separated,
exact allowlist of browser origins (scheme and host, with port if applicable).
Development defaults allow `http://localhost:3000` and
`http://127.0.0.1:3000`; production does not inherit those defaults.
`TRUST_PROXY_HOPS` is unset by default. Set it only to the known number of
trusted reverse-proxy hops for the chosen platform; never trust arbitrary
forwarded headers or set Express proxy trust to `true` without a reviewed
network topology. The in-process rate limiter is not shared between multiple
API instances; enforce additional shared limits at a trusted ingress if
running multiple instances.

## Security and operational release checks

- Terminate HTTPS at the trusted ingress, redirect HTTP to HTTPS, and use
  secure headers at the ingress/static host. Do not expose MySQL publicly.
- Use least-privilege MySQL credentials, TLS to managed MySQL where available,
  private networking, connection limits, encrypted backups, and regularly
  rehearse restore. Monitor pool exhaustion, disk usage, migration outcome,
  and API errors.
- Restrict `CORS_ORIGINS` to the deployed frontend. Deploy the API and static
  frontend over HTTPS; test direct SPA deep links.
- Keep Stripe test and live API keys/webhook secrets separate. Configure the
  corresponding Stripe environment to send `refund.updated` and
  `refund.failed` events to `/api/payments/webhook`. The Express app mounts the
  webhook with raw-body parsing before JSON parsing; do not put body-parsing
  middleware in front of it.
- The API checks `/api/health` for process liveness. Before advertising service
  readiness, also confirm MySQL connectivity, migrations, payment configuration,
  and a successful frontend-to-API request. Health returning HTTP 200 alone is
  not proof that dependencies are ready.
- Password-reset recovery-code transactions are retained. Password reset
  increments a database token version, invalidating JWTs issued before reset;
  run the migration before deploying code that checks this field.
- The current frontend has no recovery-code generation/regeneration screen.
  Any future caller of `/api/recovery/generate` or `/api/recovery/regenerate`
  must submit the authenticated user's current password as required by the API.
- Never run `npm run db:setup` at application startup. Run migrations as a
  deliberate, backed-up release operation.

## Two-account smoke test

Use two non-production test accounts and test Stripe credentials.

1. As renter A, browse a listing, save it to the wishlist, sign out/in, confirm
   it remains saved, then remove it. Confirm renter B cannot see A's wishlist.
2. As renter A, contact the listing owner. Confirm the conversation appears in
   both inboxes; send text in each direction, verify polling/unread counts, and
   confirm a third account cannot read it.
3. Confirm the owner gets an in-app message notification and only that
   recipient can list/mark it read. Confirm a new booking and owner
   confirmation/cancellation generate the expected recipient notifications.
4. Complete a booking, submit one review with a 1–5 integer rating, and verify
   its public author name, rating/count/average on the listing. Confirm a second
   review, an unfinished booking review, and an owner's self-review are
   rejected.
5. Verify password reset invalidates an already-issued token, and verify
   booking/payment/refund flows using Stripe test mode.

## Commands (run before choosing a hosting provider)

```bash
cd backend && npm ci && npm test
cd ../frontend && npm ci && npm run build
```

Production hosting, database provisioning, DNS, Stripe live-mode activation,
and any actual deployment remain operator decisions and are not performed by
this repository change.
