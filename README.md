# Renyqo

Renyqo is the frontend for a rental platform in the German-speaking market. Applicants search for a home and apply to listings. Providers — landlords, property owners, and agents — publish rental objects and review those applications.

This repository is the Next.js application. It talks to a separate backend and treats account, listing, application, and profile payloads as untrusted data. Session ownership and authorization stay on the backend. The frontend validates responses, maps known errors to fixed German copy, and renders the applicant and provider workflows.

## What is implemented

**Applicants** can search public listings, open a listing, save it, check eligibility, apply, and withdraw. They can maintain a profile, review their applications, and open one application workspace.

**Providers** can pass onboarding, create and edit listings, order their portfolio, and use the dashboard to review an applicant: documents, activity, and the conversation around that application. Listing creation can send text, a PDF, or audio to the backend extraction endpoints. The returned field payload is validated before it is used.

**Accounts** support registration by role, login, logout, and password reset. The session is a backend cookie. Mutating requests send a CSRF token.

The public home page links to registration and login. Signed-in visitors are sent to their area. `/listings` and `/listings/:id` stay reachable without an account.

These directories exist only as `.gitkeep` placeholders and are not features: `src/features/application`, `src/features/chat`, `src/features/housing`, and `src/features/queue`.

## Stack

- **Framework:** [Next.js 16](https://nextjs.org) with the App Router. `reactCompiler` and `output: "standalone"` are set in `next.config.ts`.
- **UI runtime:** React 19 and TypeScript 5. The compiler options include `strict`, `exactOptionalPropertyTypes`, and `noUncheckedIndexedAccess`.
- **Validation:** Zod 4 at response and form boundaries.
- **Styling:** Tailwind CSS v4. Design tokens are declared with `@theme inline` in `src/app/globals.css`.
- **Icons:** `lucide-react`.
- **Testing:** Vitest 4, Testing Library, and jsdom. A separate headed Playwright script exists for a local capture flow and is not part of CI.
- **Quality:** ESLint 9 (`eslint-config-next`) and Prettier 3.
- **Runtime image:** Node.js 20. CI and the Docker image both use Node 20.

`next.config.ts` sets `Referrer-Policy` to `strict-origin` and allows optimized images from `res.cloudinary.com`.

## Architecture

### Routes

Internal routes are English:

- `/` — public entry to register or sign in
- `/login`
- `/forgot-password`
- `/reset-password`
- `/register/account-type`
- `/register/create-account`
- `/listings` — public rental search for anonymous visitors and applicants
- `/listings/:id` — public listing detail
- `/applicant/profile`
- `/applicant/saved`
- `/applicant/applications`
- `/applicant/applications/:applicationId`
- `/provider/get-started`
- `/provider/dashboard`
- `/provider/listings`
- `/provider/listings/new`
- `/provider/listings/:id`

`/dashboard/applicant` is a legacy route that redirects to `/listings`.

German routes are reserved for public SEO pages and are only introduced when explicitly agreed.

`src/proxy.ts` runs on the account routes and on `/applicant` and `/provider` paths. It forwards the request cookie to the backend, reads the role and onboarding step, and redirects accordingly. A protected applicant route answers `503` when that check cannot be completed. Listing routes are outside that matcher.

### Feature boundaries

Domain behavior lives in `src/features/<context>`. The active contexts are `applicant`, `provider`, and `auth`. Route files stay thin and render feature views. Shared interface primitives live in `src/components`. Cross-cutting transport, environment, and validators live in `src/lib`.

### API access and session

`src/lib/api/client.ts` is the HTTP boundary. Requests send `credentials: "include"`. Failures are classified as HTTP, network, timeout, or cancellation. Mutating calls add `X-CSRF-Token`. If the backend returns `CSRF_TOKEN_INVALID`, the client refreshes the token once and retries.

The browser does not keep an access token for the session. `src/lib/api/use-current-user.ts` publishes the current user through `useSyncExternalStore`, with one in-flight read and an explicit anonymous, loading, and error state.

### Validation, loading, and errors

Feature API modules parse structured payloads with Zod. Invalid payloads stay validation failures. Feature hooks own loading, empty, success, and recoverable error states for their screens. The signed-in user is cached in a module-level store with a single in-flight read. Applying or withdrawing dispatches an in-page event so mounted listing, saved-listing, eligibility, and application views refetch, and a newly mounted view fetches again.

Account and application flows map known backend codes to fixed German messages.

### Listing application admission

Public listings, listing detail and saved listings share the backend `admission` contract. `currentApplicationId` and `currentApplicationStatus` identify the live attempt; `canSubmitApplication` controls fresh submissions. Historical `hasApplied`, `applicationStatus` and `publicReason` do not grant or deny submission.

`submissionBlockReason` and `reapplyAvailableAt` describe current admission blocks. The frontend keeps the backend date internal and shows a polite not-selected message without a countdown or cooldown date. Provider restoration cancels that attempt's rejection cooldown in the backend; the frontend uses the refreshed admission without reconstructing event history. `/eligibility` remains a separate compatibility check. Applying or withdrawing invalidates mounted listing, saved-listing, eligibility and application reads; newly mounted views fetch fresh data. Application conflicts are mapped by backend error code, with controlled fallback copy for uncoded conflicts.

## Project structure

```
src/
├── app/
│   ├── (app)/
│   │   ├── (standard)/          # listings, applicant, provider pages
│   │   ├── dashboard/applicant/ # legacy redirect
│   │   └── provider/dashboard/
│   ├── (auth)/                  # login, register, password reset
│   ├── (public)/                # public entry page
│   ├── globals.css
│   ├── layout.tsx
│   └── not-found.tsx
├── components/                  # ui, layout, auth, shared
├── config/
├── features/
│   ├── applicant/               # listings, profile, applications
│   ├── auth/
│   └── provider/                # dashboard, listings, listing editor
├── hooks/
├── lib/                         # api, env, validators, onboarding
├── tests/
├── types/
└── proxy.ts
```

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+

### Install and run

```bash
npm install
npm run dev
```

The dev server starts on [http://localhost:3000](http://localhost:3000).

Copy `.env.example` when you need a local API URL or a site URL other than that default. The API client reads `NEXT_PUBLIC_API_URL`. Metadata reads `NEXT_PUBLIC_SITE_URL`.

### Available scripts

| Script                  | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `npm run dev`           | Start the Next.js dev server                |
| `npm run build`         | Production build                            |
| `npm run start`         | Run the production server                   |
| `npm run typecheck`     | `tsc --noEmit` strict typecheck             |
| `npm run lint`          | ESLint over the workspace                   |
| `npm run lint:fix`      | ESLint with autofix                         |
| `npm run format`        | Prettier write                              |
| `npm run format:check`  | Prettier check (CI-equivalent)              |
| `npm run test`          | One-shot Vitest run                         |
| `npm run test:watch`    | Vitest in watch mode                        |
| `npm run test:e2e:live` | Headed local capture of provider extraction |

`test:e2e:live` is a manual browser script. It is not part of pull-request validation. It expects `E2E_PROVIDER_EMAIL` and `E2E_PROVIDER_PASSWORD`.

## Conventions

### Roles

The product models two roles. Use these identifiers in code, query params, types, and constants:

- `applicant` — looks for a home and applies to rental objects
- `provider` — offers rental objects (landlords, owners, agents)

The legacy names `tenant` / `landlord` are not used.

Example: `/register?role=applicant`, `/register?role=provider`.

### UI copy

All visible UI copy is **German** and uses the **informal Du-form** (`du`, `dich`, `dir`, `dein`). The formal `Sie` / `Ihnen` / `Ihr` is not used.

Code identifiers, file names, route segments, types, and enums stay in **English**.

### Styling — Tailwind v4 design tokens

Design tokens (color, typography, spacing, radius, shadow) are declared in [`src/app/globals.css`](src/app/globals.css) inside `@theme inline`. Always consume them through generated utilities, not arbitrary values:

```tsx
// Correct
<section className="bg-background text-foreground border-border rounded-md" />

// Wrong
<section className="bg-[#566582] text-[42px] leading-[1.05]" />
```

If a token is missing, extend `@theme` rather than hardcoding values in JSX. Do not introduce component-level CSS utility classes (`.heading-xl`, `.section`, `.card`, …) unless explicitly requested.

### Theming

Light/dark theme is driven by a `dark` class on `<html>`. The pre-hydration script in [`src/app/layout.tsx`](src/app/layout.tsx) reads `localStorage.theme` and the OS preference to apply the theme before paint, avoiding flash. The user can toggle via the `ThemeToggle` component.

## Testing

- Unit and component tests run with **Vitest** + Testing Library + jsdom.
- Vitest splits a `node` project for selected API and utility tests from a `jsdom` project for components.
- Tests live next to the code they cover, or under `src/tests/`.
- Vitest setup is shared via `src/tests/setup.ts`.
- Prefer `userEvent` over firing raw events; assert through accessible queries (`getByRole`, `getByLabelText`).

```bash
npm run test           # one-shot
npm run test:watch     # watch mode
```

## Continuous integration

Every pull request to `main` runs [`.github/workflows/pr-validation.yml`](.github/workflows/pr-validation.yml). The workflow gates the merge on:

- **`install-clean`** — `npm ci`
- **`format-prettier`** — `npm run format:check`
- **`lint-eslint`** — `npm run lint`
- **`typecheck-tsc`** — `npm run typecheck`
- **`test-unit`** — `npm test`
- **`audit-deps-prod`** — production dependency audit at high severity, from the lockfile
- **`audit-deps-dev`** — full lockfile audit; unexpected high or critical advisories fail the job, with the allowlist in `.github/scripts/audit-dev-high.mjs`
- **`build-next`** — production build, artifact uploaded
- **`smoke-runtime`** — boots the built app and curls `/`
- **`docker-build-check`** — builds the production image
- **`docker-smoke-run`** — runs the container and curls `/`
- **`container-scan`** — Trivy scan on `HIGH,CRITICAL` (fails on findings; unfixed issues are ignored)

Format, lint, typecheck, and test are enforced by CI, not by client-side hooks. Keep formatting and lint chores in **separate commits** from feature work.

## Docker

The project ships a multi-stage [`Dockerfile`](Dockerfile). The final stage is `node:20-alpine`, runs the Next.js standalone server as a non-root `nextjs` user, and defines a wget healthcheck. npm is removed from that stage. The Docker build context excludes tests and markdown.

```bash
docker build -t renyqo .
docker run -p 3000:3000 renyqo
```

## License

Copyright (c) 2026 Ramon Saavedra. All rights reserved.

This repository is publicly accessible for source-code review and portfolio purposes only. No permission is granted to copy, reuse, modify, redistribute, sublicense, or commercially use the source code.
