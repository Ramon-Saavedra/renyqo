# AGENTS.md — Renyqo Engineering Instructions

These are the general operating instructions for any coding agent working on
Renyqo, including Claude Code, GitHub Copilot, OpenCode and others. They define
how to work in this repository with discipline, consistency and production
quality. Follow them for every technical request unless the user explicitly
overrides them.

## 1. Purpose and project context

Renyqo is a production-oriented rental platform that connects applicants (people
looking for a home) with providers (landlords, property owners and real estate
agents). It is built to run in production and serve real users, so every change
must meet a production standard rather than a prototype standard.

The system spans the full stack:

- **Frontend:** Next.js (App Router, React, TypeScript).
- **Backend:** NestJS.
- **Packaging:** Docker.
- **Deployment target:** AWS.

Do not design solutions as if this were a local-only app without a real backend,
containers or production deployment. Frontend work must stay compatible with the
NestJS backend, the Docker build and the AWS environment.

## 2. Communication and approval workflow

- Ask for confirmation before starting a new non-trivial task, changing
  architecture, expanding scope, or making an important technical decision.
  Briefly state what you intend to change, why, and its impact — a short "I want
  to change X to Y for this reason — proceed?" is enough.
- Once a task and its implementation plan have been approved, continue with the
  necessary small implementation steps without asking for permission again for
  each step.
- Speak clearly, directly and professionally. Avoid filler and unnecessary
  technical noise.
- If a request could harm architecture, maintainability, UX, security or
  consistency, say so clearly and propose a better option instead of complying
  silently.
- If a decision depends on missing context, ask. Do not fill critical gaps with
  arbitrary assumptions.

## 3. Scope and change discipline

- Make small, controlled, reviewable changes. Avoid large refactors or multiple
  unrequested changes in a single step.
- Work in focused units — one component or block at a time unless a wider change
  was explicitly requested.
- Do not modify unrelated files or refactor neighboring code "while you're
  there." Touch only what the task requires.
- Do not change folder structure, state patterns, routing or architecture
  without explaining it and getting approval first.
- Announce behavior changes: if a change affects logic, UX, props, state, routes
  or shared contracts, flag it before applying it, and do not break shared
  components, props or styles silently.
- Leave no temporary debris: no vague TODOs, dead commented-out code, stray
  `console.log` calls or undisclosed temporary hacks.

## 4. TypeScript and code quality

- Write code that compiles under strict TypeScript.
- Do not use `any`. If a genuinely exceptional case requires it, state it
  explicitly, justify it, and get approval before using it.
- Prefer clarity, maintainability and predictability over clever or "magic"
  solutions. Do not over-apply DRY when it makes the code harder to read;
  readability wins over abstraction for its own sake.
- Comments: do not write comments that merely restate the code. Concise comments
  are welcome when they explain complex reasoning, an important limitation or
  non-obvious behavior.
- Use clear `interface` / `type` definitions and meaningful naming.

## 5. Architecture and component responsibilities

- Reuse existing components and utilities before creating new ones. Do not
  introduce a parallel system for styling, naming, state or components.
- Keep responsibilities separated. Do not mix UI, state, data fetching,
  validation and mapping logic in one oversized component.
- Separate logic deliberately: keep API transport and timeout handling in the
  API client, validation and error classification in focused utilities, and
  feature UI flows in independent components. Do not create oversized files or
  concentrate an entire multi-step flow in one component.
- Each component should have a single clear responsibility. If a component starts
  doing too much, flag it.
- Let structure follow the real product domain. Do not create generic folders or
  layers without a clear reason.

## 6. Frontend and design-system rules

This project uses **Tailwind CSS v4** with design tokens defined in the global
CSS file via `@theme inline`. Use the existing token-based design system first;
extend the theme only when necessary and only after asking.

- Do not use arbitrary Tailwind values as the default approach. Avoid patterns
  such as `px-[var(--page-padding)]`, `pt-[var(--space-8)]`, `text-[42px]`,
  `leading-[1.05]` or `tracking-[-0.032em]`.
- Use the utilities generated from theme tokens instead, for example:
  `bg-primary`, `bg-background`, `text-foreground`, `text-foreground-secondary`,
  `border-border`, `shadow-card`, `rounded-md`, `font-display`, `px-page`,
  `pt-space-8`, `pb-space-12`, `mb-space-6`, `gap-space-4`, `text-heading-xl`,
  `leading-heading-xl`, `tracking-heading-xl`.
- All spacing must come from the token scale (space, page, section, card, gap,
  margin, padding). All typography must come from the text/font/leading/tracking
  tokens.
- All colors must come from color tokens. Never hardcode hex colors, shadows,
  spacing or sizes when a token already exists.
- Do not use inline `var(--…)` inside a JSX `className` when a token utility
  exists. Do not author component-level CSS utility classes (`.heading-xl`,
  `.section`, `.card`, …) unless explicitly requested.
- If a spacing, typography, color, radius, shadow or layout token is missing,
  stop and state exactly which token is needed before continuing. Arbitrary
  values are allowed only in rare, justified cases, and must be explained first.
- Use **Lucide** icons. Do not hand-write SVG icons.
- Build for accessibility (semantics, labels, keyboard) and responsive behavior
  by default.
- Always handle loading, empty, success and error states — do not build UI that
  assumes every request succeeds.

## 7. Dependencies and official documentation

- Minimize dependencies. Prefer solving problems with the current stack.
- Do not add a new dependency without explicit approval. Before proposing one,
  state which package it is, why it is needed, and why the problem cannot be
  solved cleanly without it.
- Consult the official documentation before using any library, framework,
  package or external API, and base your proposal on it rather than on vague
  memory or unofficial tutorials.
- Remove dependencies that are no longer used so they don't accumulate as dead
  weight.

## 8. Backend integration and error handling

- Design frontend forms, state, contracts, validation and flows to fit the
  NestJS backend: clear DTOs, predictable API contracts, serious validation, and
  explicit handling of both successful and failed responses.
- Never assume the backend always returns success. Account for the relevant
  failure states, including: validation errors, authentication/authorization
  errors, business-rule errors, transient server errors, and empty/not-found
  states.

## 9. Security and privacy

- Treat applicant and provider data as sensitive. Protect personal and rental
  information and avoid exposing it in logs, URLs or client-visible state beyond
  what is necessary.
- Keep public and private configuration separate (e.g. do not leak server-only
  environment variables to the client bundle).
- Do not unnecessarily expose sensitive data, including internal database IDs,
  applicant or provider documents, income and eligibility information, private
  contact details, complete private addresses, or authentication/authorization
  data. Such information must not appear in URLs, logs, client-visible errors,
  analytics or public API responses unless it is strictly required and explicitly
  authorized.
- Do not introduce code that weakens the security posture of the app, its build
  or its deployment.

## 10. Testing, linting and formatting

- Run lint, formatting or tests only when explicitly requested or approved, and
  keep them targeted to the change at hand.
- Do not run repository-wide formatting that produces large unrelated diffs.
- Before considering work done, review it with engineering judgment — clarity,
  consistency, naming, typing, structure, maintainability and obvious risks —
  not only tooling output.

## 11. Git, CI, Docker, AWS and documentation

- Do not create commits, pushes, pull requests or remote branch changes unless
  explicitly requested. Assume `main` is protected and that nothing merges
  without required checks.
- Keep changes compatible with a professional pipeline (dependency review, clean
  install, lint, typecheck, tests, Next.js build, Docker build and deploy). If a
  change could affect the build, environment variables, imports, routes, types,
  runtime startup or container compatibility, flag it beforehand.
- Avoid introducing dependencies, configuration or behavior that unnecessarily
  complicate the production build, container execution or environment
  reproducibility.
- Keep documentation aligned with the code. If a change affects local setup,
  scripts, environment variables, project structure, CI/pipeline, Docker, branch
  or PR flow, or relevant architecture, state clearly that the README must be
  updated too.

## 12. Language rules

- **User-facing interface text must be written in German.**
- **Communication with Ramon should be in Spanish**, unless he requests another
  language.
- **Code identifiers, technical documentation and this `AGENTS.md` file are
  written in English.**

## Definition of done

A change is done only when it:

- does what was requested and respects these rules;
- is written to compile and type-check under strict TypeScript, and does so when
  technical validation has been requested or approved;
- passes the requested or approved validation checks (lint, typecheck, tests);
- reuses existing components, utilities and design tokens;
- keeps UI, state, fetching, validation and mapping responsibilities separated;
- handles loading, empty, success and error states and backend failures;
- introduces no unapproved dependencies and no unrelated file changes;
- adds no dead code, debug output or noise comments;
- notes any required README or documentation updates;
- has passed your own manual engineering review, which is always required even
  when tooling has not yet been authorized.
