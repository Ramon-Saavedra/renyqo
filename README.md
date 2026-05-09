# renyqo

A rental marketplace web app for the German-speaking market that connects **applicants** (people looking for a home) with **providers** (landlords, property owners and real-estate agents) offering rental objects.

Built with the Next.js App Router, React 19 and a Tailwind v4 design-token system.

## Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router, React Compiler, `standalone` output)
- **UI runtime:** React 19, TypeScript 5
- **Styling:** Tailwind CSS v4 with design tokens declared via `@theme inline`
- **Icons:** `lucide-react`
- **Testing:** Vitest 4, Testing Library (`@testing-library/react`, `user-event`), jsdom
- **Quality:** ESLint 9 (`eslint-config-next`), Prettier 3
- **Container:** Multi-stage `Dockerfile`, non-root runtime, healthcheck

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

### Available scripts

| Script                 | Purpose                         |
| ---------------------- | ------------------------------- |
| `npm run dev`          | Start the Next.js dev server    |
| `npm run build`        | Production build                |
| `npm run start`        | Run the production server       |
| `npm run typecheck`    | `tsc --noEmit` strict typecheck |
| `npm run lint`         | ESLint over the workspace       |
| `npm run lint:fix`     | ESLint with autofix             |
| `npm run format`       | Prettier write                  |
| `npm run format:check` | Prettier check (CI-equivalent)  |
| `npm run test`         | One-shot Vitest run             |
| `npm run test:watch`   | Vitest in watch mode            |

## Project structure

```
src/
├── app/                       # Next.js App Router
│   ├── (app)/                 # Authenticated app shell
│   │   └── dashboard/
│   │       ├── applicant/
│   │       └── provider/
│   ├── (auth)/                # Auth flows
│   │   ├── login/
│   │   └── register/
│   │       ├── account-type/
│   │       └── create-account/
│   ├── (public)/              # Public/marketing pages
│   ├── globals.css            # Tailwind v4 entry + design tokens
│   ├── layout.tsx             # Root layout + theme bootstrap
│   └── not-found.tsx
├── components/                # Cross-cutting UI primitives
│   ├── brand/
│   ├── button/
│   ├── icon/
│   ├── logo/
│   ├── stepper/
│   └── theme-toggle/
├── features/                  # Domain features (bounded contexts)
│   ├── applicant/
│   ├── application/
│   ├── auth/
│   ├── chat/
│   ├── housing/
│   ├── provider/
│   └── queue/
├── lib/                       # Cross-cutting utilities
│   ├── api/
│   ├── constants/
│   ├── env/
│   ├── utils/
│   └── validators/
├── hooks/
├── tests/                     # Vitest setup + integration tests
└── types/
```

Domain logic lives under `src/features/<bounded-context>`. Reusable primitives live under `src/components`. Anything cross-cutting (helpers, env, validators) lives under `src/lib`.

## Conventions

### Routes

Internal/app routes are in **English**:

- `/login`
- `/register/account-type`
- `/register/create-account`
- `/dashboard`

German routes are reserved for public SEO pages and are only introduced when explicitly agreed.

### Roles

The product models two roles. Use these identifiers everywhere in code, query params, types and constants:

- `applicant` — looks for a home and applies to rental objects
- `provider` — offers rental objects (landlords, owners, agents)

The legacy names `tenant` / `landlord` are not used.

Example: `/register?role=applicant`, `/register?role=provider`.

### UI copy

All visible UI copy is **German** and uses the **informal Du-form** (`du`, `dich`, `dir`, `dein`). The formal `Sie` / `Ihnen` / `Ihr` is not used.

Code identifiers, file names, route segments, types and enums stay in **English**.

### Styling — Tailwind v4 design tokens

Design tokens (color, typography, spacing, radius, shadow) are declared in [`src/app/globals.css`](src/app/globals.css) inside `@theme inline`. Always consume them through generated utilities, not arbitrary values:

```tsx
// Correct
<section className="bg-background text-foreground border-border shadow-card rounded-md" />

// Wrong
<section className="bg-[#566582] text-[42px] leading-[1.05]" />
```

If a token is missing, extend `@theme` rather than hardcoding values in JSX. Do not introduce component-level CSS utility classes (`.heading-xl`, `.section`, `.card`, …) unless explicitly requested.

### Theming

Light/dark theme is driven by a `dark` class on `<html>`. The pre-hydration script in [`src/app/layout.tsx`](src/app/layout.tsx) reads `localStorage.theme` and the OS preference to apply the theme before paint, avoiding flash. The user can toggle via the `ThemeToggle` component.

### Testing

- Unit and component tests run with **Vitest** + Testing Library + jsdom
- Tests live next to the code they cover, or under `src/tests/`
- Vitest setup is shared via `src/tests/setup.ts`
- Prefer `userEvent` over firing raw events; assert through accessible queries (`getByRole`, `getByLabelText`)

```bash
npm run test           # one-shot
npm run test:watch     # watch mode
```

## Continuous integration

Every pull request to `main` runs the [`PR Validation`](.github/workflows/pr-validation.yml) workflow, which gates the merge on:

- **`format-prettier`** — `npm run format:check`
- **`lint-eslint`** — `npm run lint`
- **`typecheck-tsc`** — `npm run typecheck`
- **`test-unit`** — `npm test`
- **`audit-deps-npm`** — `npm audit --audit-level=high`
- **`build-next`** — production build, artifact uploaded
- **`smoke-runtime`** — boots the built app and curls `/`
- **`docker-build-check`** — builds the production image
- **`docker-smoke-run`** — runs the container and curls `/`
- **`container-scan`** — Trivy scan on `HIGH,CRITICAL` (fails on findings)

Format, lint, typecheck and test are enforced by CI, not by client-side hooks. Keep formatting and lint chores in **separate commits** from feature work.

## Docker

The project ships a multi-stage [`Dockerfile`](Dockerfile) producing a minimal `node:20-alpine` standalone image that runs as a non-root `nextjs` user with a wget-based healthcheck.

```bash
docker build -t renyqo .
docker run -p 3000:3000 renyqo
```

## License

Proprietary — all rights reserved.
