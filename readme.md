# MITBLR_FALAK_APP

Technical README for the FALAK web application in this repository. This document is based on the current codebase state under `falak_site_main/`, not on a product pitch, so it focuses on architecture, modules, routes, environment requirements, and operational behavior.

## What This Repository Contains

This repository is primarily a single Next.js application:

```text
mitblr_falak_app/
|- README.md
|- LICENSE
|- falak_site_main/
|  |- package.json
|  |- next.config.ts
|  |- public/
|  |- scripts/
|  |- src/
|  |  |- app/
|  |  |- components/
|  |  |- lib/
|  |  |- middleware.ts
|  |- supabase/
|     |- migrations/
```

The actual product code lives inside `falak_site_main/`.

## Product Summary

The app is the web platform for MIT Bengaluru's FALAK fest. It combines:

- public marketing pages and event discovery
- Google-based sign-in and onboarding
- MAHE, Non-MAHE, and faculty user flows
- pass discovery and purchase handoff to an external payment portal
- payment reconciliation and pass issuance
- profile pages with deterministic QR codes
- team registration and team/member lookup
- support ticket submission
- admin dashboards for event management, ticket support, and ops workflows
- QR scanner integration for on-ground ticket verification

## Tech Stack

- Next.js `15.4.x` with App Router
- React `19`
- TypeScript `5.9`
- Tailwind CSS `4`
- NextAuth `4` with Google OAuth
- Supabase SSR + `@supabase/supabase-js`
- Zod for validation
- `jose`-based JWT signing/verification
- GSAP + Framer Motion for animation-heavy UI
- Radix/shadcn-style UI primitives
- `xlsx` for admin Excel export
- Vercel Analytics

Notable packages present in the repo:

- `firebase`: public config exists, but the primary auth/session path is NextAuth + Supabase-backed user data
- `twilio`: dependency exists and there is a Twilio helper, but the main active OTP flow is implemented around MSG91/dev tokens

## Architecture

### 1. Frontend

- App Router pages live in `falak_site_main/src/app/`
- shared UI and page-specific visual systems live in `falak_site_main/src/components/`
- the app mixes Server Components, client components, and server actions
- the root layout injects nav, transition UI, toast notifications, payment return sync, and analytics

### 2. Authentication

- user sign-in is handled by NextAuth Google OAuth
- session strategy is JWT-based
- the JWT is enriched with:
  - `needsOnboarding`
  - Supabase user id
  - MAHE flag
- middleware redirects logged-in but non-onboarded users into `/onboarding`
- `/admin_manage` is protected and additionally role-gated in server code

### 3. Data Layer

- Supabase is the primary backend
- most privileged reads/writes use a service-role Supabase client from `src/lib/supabase/server.ts`
- table access is wrapped in `src/lib/actions/` and `src/lib/actions/tables/`
- the project contains some legacy table naming inconsistencies like `Users` vs `users` and `Pass` vs `passes`

### 4. Payments

- checkout hands users off to the external portal at `https://payment.manipal.edu/falak-Login`
- on return, the layout-mounted `PaymentReturnSync` client component calls `/api/payments/sync`
- server-side payment ingestion:
  - fetches external payment logs using `ACCESSKEY` / `ACCESSTOKEN`
  - stores auditable payment log rows
  - maps external payment metadata to internal passes using `external_pass_map`
  - grants `User_passes` records idempotently
  - backfills old unmapped logs when mappings are later added

### 5. QR / Scanner Flow

- user QR values are deterministic, derived from `userId`
- scanner admins first obtain a short-lived session token through `/api/qr/ticket/verify_admin`
- scanner APIs then use that signed session token for:
  - looking up a user's passes
  - marking tickets as cut
  - special standup-ticket handling

## Codebase Index

### `falak_site_main/src/app/`

Main route tree and API handlers.

- `page.tsx`: landing page
- `sports/*`: sports cluster listing and detail pages
- `cultural/*`: cultural cluster listing and detail pages
- `passes/page.tsx`: pass catalog
- `cart/page.tsx`: client-side cart
- `checkout/page.tsx`: payment handoff UI
- `profile/page.tsx`: owned passes, QR display, registered events, team membership
- `onboarding/*`: registration/onboarding flow
- `tickets/*`: support ticket page and server action
- `admin_manage/page.tsx`: role-gated admin entry page
- `api/*`: route handlers for auth, OTP, teams, users, payments, QR, ops, cart compatibility, and admin utilities
- `events/*`: legacy route tree retained for redirect/backward compatibility
- `depriciated_pages/*`: older page variants kept in-repo

### `falak_site_main/src/components/`

UI building blocks and dashboard clients.

- landing/marketing components like `Hero`, `About`, `Artist`, `Timeline`, `Sponsor`
- nav and transition components
- onboarding and OTP components
- cart, checkout, and payment sync components
- profile/QR visual components
- admin panels:
  - `EventAdminPanel`
  - `TicketAdminPanel`
  - `OpsAdminPanel`
  - `SuperAdminDashboard`

### `falak_site_main/src/lib/`

Core business logic and integrations.

- `auth.ts`: NextAuth config and JWT/session enrichment
- `security.ts`: deterministic QR signing helpers
- `otp.ts`: phone verification token signing
- `supabase/*`: Supabase client factories
- `actions/*`: server-side data access and admin/payment workflows
- `validation/*`: zod validation
- `firebase/*`, `twilio/*`: auxiliary integration helpers

### `falak_site_main/scripts/`

Operational and one-off maintenance scripts.

- `fix-non-mahe-proshow.mjs`
- `fix-non-mahe-proshow.js`
- `migrate-proshow-to-nonmahe.ts`

## Route Inventory

### Public Pages

- `/`
- `/sports`
- `/sports/[category]`
- `/sports/[category]/[slug]`
- `/cultural`
- `/cultural/[category]`
- `/cultural/[category]/[slug]`
- `/passes`
- `/cart`
- `/checkout`
- `/tickets`

### Authenticated / Protected Pages

- `/onboarding`
- `/profile`
- `/admin_manage`

### Legacy Pages

- `/events`
- `/events/[category]`
- `/events/[category]/[slug]`

`next.config.ts` currently redirects `/events` and `/events/*` permanently to `/sports` equivalents.

## API Surface

### Auth and OTP

- `GET|POST /api/auth/[...nextauth]`
- `POST /api/otp/send-direct`
- `POST /api/otp/verify-direct`
- `POST /api/otp/verify-widget`
- `GET|POST /api/verify_otp`

### Payments

- `POST /api/payments/sync`
- `POST /api/dev/payments/cache`
- `GET /api/dev/payments/diagnose`
- `GET /api/dev/payments/run`
- `GET /api/dev/payments/logs`
- `POST|GET|DELETE /api/dev/payments/mock`
- `POST /api/dev/payments/seed-mapping`

### QR and Ticket Verification

- `GET /api/qr/verify`
- `GET /api/qr/verify-full`
- `POST /api/qr/ticket/verify_admin`
- `GET /api/qr/ticket`
- `POST /api/qr/ticket`
- `POST /api/qr/ticket/standup_ticket`

### Users, Teams, and Self-Service

- `GET /api/users/byEmail`
- `GET /api/users/byId`
- `GET /api/me/owned`
- `GET /api/me/accessible-events`
- `GET /api/events/byIds`
- `POST /api/teams/create`
- `POST /api/teams/createWithEmails`
- `POST /api/teams/createWithEmailsAsCaptain`
- `POST /api/teams/updateWithEmails`

### Operations / Admin

- `GET /api/ops/events`
- `GET /api/ops/event/[eventId]`
- `GET /api/ops/event/[eventId]/holders`
- `POST /api/ops/event/[eventId]/activate`
- `POST /api/ops/event/[eventId]/deactivate`
- `POST /api/ops/user/[userId]/regno`
- `GET /api/admin/payment-logs/nonmahe`

### Cart APIs

Active:

- `GET /api/cart/guest_passes`

Deprecated compatibility stubs returning `410 Gone`:

- `POST /api/cart/add`
- `GET /api/cart/count`
- `POST /api/cart/merge`
- `GET /api/cart/validate_ownership`

## Main User Flows

### Sign-in and Onboarding

1. User signs in with Google through NextAuth.
2. `auth.ts` checks if a corresponding user exists in Supabase.
3. If not, session gets `needsOnboarding = true`.
4. Middleware redirects the user to `/onboarding`.
5. Server actions create or update `Users` / `faculty_user` rows.

### Pass Purchase and Reconciliation

1. User browses passes on `/passes`.
2. Non-MAHE users use a localStorage-backed cart.
3. Checkout opens the external payment portal.
4. A localStorage flag marks payment as in progress.
5. On return, `/api/payments/sync` ingests external payment logs and grants internal passes.
6. Profile shows newly owned passes and the user-level QR code.

### Ticket Scanning

1. Scanner admin authenticates against `ticket_admin_list`.
2. `/api/qr/ticket/verify_admin` returns a short-lived session JWT.
3. Scanner app submits that JWT to `/api/qr/ticket`.
4. API returns user data and owned passes.
5. Ticket cut writes are idempotent and store who cut the ticket and when.

## Admin Roles

The app currently distinguishes these admin roles:

- `event_admin`
  - create, update, delete events and passes
  - toggle disabled event visibility
  - optionally work with Cloudinary-hosted event images
- `ticket_admin`
  - search users
  - inspect pass ownership and team info
  - manually sync payments for a user
  - resolve pending payment mappings
  - handle unresolved support tickets
  - update phone, reg no, and MAHE status
  - assign duplicate payment logs
- `ops_admin`
  - view event rosters and pass holders
  - export participants/teams to Excel
  - activate/deactivate events
- `super_admin`
  - view totals and charts
  - review approval requests
  - run maintenance actions like the Non-MAHE proshow fix

## Inferred Primary Data Model

These tables are referenced directly in code. The exact SQL schema is only partially checked into the repo, so treat this as an implementation-oriented index rather than an authoritative ERD.

- `Users` / `users`
  - core person records
  - email, phone, MAHE flag, reg no, institute, last ingestion timestamp
- `faculty_user`
  - faculty-specific onboarding records
- `Pass` / `passes`
  - pass metadata, pricing, enabled/status flags, event linkage
- `User_passes`
  - pass ownership, QR token, payment provenance, ticket-cut metadata
- `Events`
  - event metadata, enable flags, dates, venue, cluster/sub-cluster, team sizes
- `Teams`
  - team identity and captain mapping
- `Team_members`
  - team membership records, including legacy non-UUID identifiers
- `payment_logs`
  - raw external payment rows and normalized status data
- `external_pass_map`
  - whitelist mapping from upstream payment metadata to internal pass ids
- `ticket_admin_list`
  - scanner/ticket admin login identities
- `admin_roles`
  - web admin role mapping
- `support_tickets`
  - user-raised support tickets
- `standup_cut`
  - standup-show specific ticket cut status
- `edit_logs`
  - admin edit logging support

## Environment Variables

Create `falak_site_main/.env.local` for local development.

### Core App / Auth

```env
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Supabase

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### OTP / Onboarding

```env
MSG91_AUTH_KEY=
MSG91_OTP_TEMPLATE_ID=
NEXT_PUBLIC_MSG91_WIDGET_ID=
NEXT_PUBLIC_MSG91_TOKEN_AUTH=
OTP_JWT_SECRET=
FORCE_DEV_OTP=false
PRESENTATION_MODE=false
PRESENTATION_TEST_PHONE=
PRESENTATION_TEST_OTP=
```

### Payments

```env
ACCESSKEY=
ACCESSTOKEN=
VERIFICATION_URL=https://api.manipal.edu/api/v1/falak-single-payment-log
NON_MAHE_PROSHOW_PASS_ID=
ESPORTS_BUNDLE_PASS_ID=
```

### QR / Scanner

```env
QR_SIGNING_SECRET=
ADMIN_QR_GOOGLE_CLIENT_ID=
```

### Optional Frontend / Media Integrations

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

Notes:

- in non-production, `src/env-fallback.ts` defaults `NEXTAUTH_URL` to `http://localhost:3000`
- most admin and payment actions require `SUPABASE_SERVICE_ROLE_KEY`
- payment sync will not work without the payment API credentials

## Local Development

```powershell
cd falak_site_main
npm install
npm run dev
```

Available scripts:

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run fix:non-mahe-proshow`

The app expects a working Supabase project for most real flows. Without it, some views can render, but onboarding, admin actions, profile data, payment sync, and ticket flows will be incomplete.

## Operational Scripts

### Non-MAHE Proshow Fix

```powershell
cd falak_site_main
npm run fix:non-mahe-proshow
```

Supported environment overrides used by the script:

- `DRY_RUN=1`
- `TARGET_PASS_NAME=Non-MAHE BLR`
- `ONLY_USER_IDS=...`
- `PAGE_SIZE=1000`
- `BATCH_SIZE=200`

Related files:

- `scripts/fix-non-mahe-proshow.mjs`
- `scripts/migrate-proshow-to-nonmahe.ts`
- `supabase/migrations/2025-09-25_add_unique_index_external_key_v2.sql`

## Important Implementation Notes

- `/events` is no longer the primary route namespace; it redirects to `/sports`
- the cart is now client-side localStorage based, not DB-cart based
- `PaymentReturnSync` is mounted globally in the layout, so payment reconciliation logic can run immediately after a user returns to the site
- profile QR rendering uses the same deterministic user QR under every owned pass
- the scanner flow depends on `ticket_admin_list` and short-lived session JWTs
- table naming in the codebase is mixed-case and legacy-aware

## Current Caveats

- the README that was previously in this repo contained inferred diagrams and placeholder screenshot links; those have been removed in favor of code-verified documentation
- `send-direct` OTP handling currently supports presentation/dev-token behavior, and the non-dev branch is intentionally simplified, so production OTP behavior should be verified before relying on it as-is
- legacy folders and deprecated endpoints are still present for compatibility
- there is no automated test script configured in `package.json`; the main built-in quality check is `npm run lint`

## Contributing

1. Work inside `falak_site_main/`.
2. Keep route docs aligned with actual App Router paths.
3. If you add or remove APIs, update this README's route inventory.
4. If you introduce new env requirements, document them here immediately.
5. Prefer extending `src/lib/actions/` wrappers instead of scattering direct table access.

## License

This repository is licensed under the MIT license. See `LICENSE`.
