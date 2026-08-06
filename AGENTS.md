# AGENTS.md — Renyqo Frontend Engineering Instructions

These instructions govern every coding agent working in the Renyqo frontend repository.

They apply to all technical work unless Ramon gives a more specific instruction for the current task. Task-specific instructions may narrow the scope, but they must not silently weaken security, privacy, repository safety, validation discipline, or approval requirements.

## 1. Authority and scope

- This file is the primary repository-level instruction source for the Renyqo frontend.
- Read this root `AGENTS.md` completely before starting any task.
- Read every nested `AGENTS.md` that applies to the files being inspected or modified.
- Nested instructions may add more specific rules for their directory, but they may not weaken or contradict this file.
- These instructions apply only to this frontend repository.
- Do not assume authority over the separate Renyqo backend repository.
- Detailed tool permissions belong in OpenCode configuration and agent permission files. Do not duplicate the complete permission system here.
- When an instruction is unclear, incomplete, or contradictory, stop and ask Ramon instead of guessing.

## 2. Project context

Renyqo is a production-oriented rental platform connecting applicants with providers such as landlords, property owners, and real estate agents.

This repository contains the frontend application. It communicates with a separate NestJS backend and handles sensitive applicant, provider, property, application, and account information.

The frontend must remain compatible with:

- the current backend contracts;
- the Docker build;
- the GitHub Actions pipeline;
- the production AWS environment;
- the current authentication and authorization model.

Treat the project as a real production system serving real users, not as a prototype or isolated local application.

## 3. Verified technology stack

The current frontend stack includes:

- Next.js with the App Router;
- React;
- strict TypeScript;
- Tailwind CSS v4;
- Zod;
- Vitest;
- Testing Library;
- ESLint;
- Prettier;
- Docker.

Exact versions, scripts, compiler options, build steps, and CI jobs may change.

Before making technical decisions, inspect the current repository state, including where relevant:

- `package.json`;
- the lockfile;
- `tsconfig.json`;
- `eslint.config.*`;
- `next.config.*`;
- `vitest.config.*`;
- `Dockerfile`;
- `.github/workflows/*`;
- `.opencode/*`.

The repository configuration is the authoritative source for the current technical setup.

## 4. Mandatory task workflow

For every non-trivial task, follow this order.

### Before implementation

1. Read the approved task completely.
2. Read all applicable instruction files.
3. Inspect the relevant existing implementation.
4. Inspect the current Git state.
5. Verify the actual installed versions and configuration.
6. Consult the relevant official documentation.
7. Present a concise implementation plan.
8. Wait for Ramon’s explicit approval.
9. Implement only the approved scope.

The plan must state:

- the objective;
- the expected files to change;
- the behavior that will change;
- relevant risks;
- new dependencies, tokens, contracts, or architectural changes, if any;
- the validations proposed for the final stage.

Do not begin a non-trivial task by modifying code directly.

### After implementation

Before running subagents or technical validations:

1. Review the complete diff.
2. Verify that only approved files were changed.
3. Verify that the implementation still matches the approved scope.
4. Consult the relevant official documentation again.
5. Compare the implementation with all applicable instructions.
6. Check for obvious architecture, typing, security, privacy, UX, and maintainability problems.
7. Report the changed files, changed behavior, known risks, and unresolved questions.
8. Stop and wait for Ramon’s approval.

Do not silently continue into reviews, tests, formatting, builds, commits, pushes, or pull requests.

## 5. Git and repository safety

Before implementation, inspect:

- the current branch;
- tracked and untracked local changes;
- local commits not present on the remote;
- divergence from `origin/main`;
- related branches or pull requests when relevant;
- merge conflicts or ambiguous repository state.

Rules:

- Never work directly on `main`.
- Work only on a dedicated branch created from an up-to-date and clean `main`.
- Do not overwrite, discard, reset, or modify unrelated existing work.
- Preserve unfinished work safely before changing branches.
- Do not apply, rename, remove, or alter an existing stash without explicit approval.
- Stop when the repository state is ambiguous or unsafe.
- Never force-push.
- Never rewrite published history.
- Never delete a local or remote branch without explicit approval.
- Never create a commit without explicit approval.
- Never push without explicit approval.
- Never open or update a pull request without explicit approval.
- Never merge a pull request.
- Never change remote repository state silently.

Approval for one Git action does not automatically authorize the next action.

## 6. Scope discipline

- Make small, focused, reviewable changes.
- Modify only files required by the approved task.
- Do not refactor neighboring code merely because it could be improved.
- Do not rename unrelated symbols.
- Do not reorganize unrelated folders.
- Do not expand the task silently.
- Do not introduce unrequested behavior.
- Do not change architecture, routing, global state, shared contracts, or dependencies without approval.
- Do not create a parallel solution when the project already has an established component, hook, utility, API client, schema, token, or pattern.
- Flag changes to shared components, props, routes, contracts, schemas, or state before applying them.
- Do not leave temporary hacks, debug output, dead code, unused files, or unexplained fallback behavior.
- Do not leave stray `console.log`, `console.warn`, or `console.error` calls.

When the approved plan becomes incomplete or technically wrong, stop and present a revised plan.

## 7. Absolute no-comments rule

Do not add comments to source code.

This includes:

- `//` comments;
- `/* ... */` comments;
- JSX comments;
- JSDoc;
- `TODO`;
- `FIXME`;
- `HACK`;
- commented-out code;
- explanatory annotations inside implementation files.

Express intent through:

- precise naming;
- focused functions;
- clear types;
- small modules;
- explicit control flow;
- meaningful file structure.

When an important constraint must be documented, place it in the appropriate technical documentation, task report, or pull request description after approval.

Do not edit generated files or third-party code merely to remove existing comments.

## 8. TypeScript discipline

- Respect the current strict TypeScript configuration.
- Never use `any`.
- Never introduce implicit `any`.
- Never use unsafe casts to hide a typing problem.
- Do not use `as unknown as` to bypass the type system.
- Do not use `@ts-ignore`.
- Do not use `@ts-expect-error`.
- Do not disable TypeScript checks.
- Do not disable ESLint rules to conceal a problem.
- Fix the underlying issue instead of suppressing it.
- Use precise types at external boundaries.
- Use discriminated unions when they make state transitions safer and clearer.
- Represent missing, loading, success, empty, and error states explicitly.
- Distinguish optional values from invalid values.
- Prefer type inference where it remains clear.
- Add explicit types where boundaries, contracts, callbacks, or public APIs would otherwise become ambiguous.
- Do not weaken an existing type merely to make new code compile.

## 9. Maintainability and file-size discipline

- Prefer small, focused modules with one clear responsibility.
- Avoid source files larger than approximately 500 lines whenever reasonably possible.
- A file approaching 500 lines must be reviewed for meaningful separation.
- Consider separating:
  - components;
  - hooks;
  - schemas;
  - mapping functions;
  - API logic;
  - state logic;
  - constants;
  - domain utilities.

- Do not split a file merely to satisfy a line count.
- Do not create artificial fragmentation or many tiny files without meaningful boundaries.
- Generated files and exceptional configuration files are not subject to this guideline.
- Readability and responsibility boundaries matter more than the raw line count.

## 10. Separation of responsibilities

Keep these responsibilities separate whenever practical:

- presentation;
- local UI state;
- server data;
- API transport;
- validation;
- data mapping;
- business rules;
- side effects;
- error classification;
- user-facing error messages.

Rules:

- Do not place API transport logic directly inside presentation components when an established API layer exists.
- Do not combine a complete multi-step feature into one oversized component.
- Do not hide unrelated responsibilities inside one hook.
- Do not duplicate backend contract handling across multiple components.
- Keep business rules outside React components when they do not depend on React.
- Keep mapping and validation logic outside UI components when possible.
- Prefer pure functions for transformations and business decisions.

## 11. Custom hooks

Create custom hooks when they provide a meaningful React-specific boundary.

Appropriate reasons include:

- reusable stateful behavior;
- complex client-side state transitions;
- coordinated side effects;
- reusable interaction logic;
- a clear feature-level orchestration responsibility.

Do not create a custom hook:

- only to reduce the visual length of a component;
- for trivial state;
- for logic that does not depend on React;
- as a hidden container for unrelated behavior;
- as a replacement for a proper API, utility, or domain module.

A custom hook must have:

- one clear purpose;
- predictable inputs;
- predictable outputs;
- explicit loading and error behavior where applicable;
- no unrelated hidden side effects.

## 12. DRY with restraint

Avoid meaningful duplication, especially in:

- business rules;
- validation schemas;
- backend error mapping;
- API response mapping;
- shared UI behavior;
- domain calculations;
- authorization-related display logic.

Do not apply DRY mechanically.

- Similar-looking code may represent different domain concepts.
- Do not introduce premature generic abstractions.
- Do not create configurable systems for a single concrete use case.
- Prefer a small amount of clear duplication over an abstraction that is difficult to understand, type, test, or maintain.
- Extract shared logic only when the shared responsibility is stable and clearly demonstrated.
- Do not force unrelated features through one generic component or hook.

## 13. Frontend architecture

- Follow the existing App Router structure.
- Respect the current route groups and project conventions.
- Use the existing `@/*` alias and import conventions.
- Search for existing components, hooks, utilities, schemas, and API clients before creating new ones.
- Follow the existing feature-based domain structure.
- Do not introduce generic folders or new architectural layers without a clear approved reason.
- Keep feature-specific code inside the relevant feature boundary.
- Keep genuinely shared code in established shared locations.
- Do not move feature-specific behavior into global shared modules prematurely.
- Do not duplicate backend DTOs or contracts without a clear strategy.
- Do not invent endpoints, fields, error codes, or backend behavior.

## 14. Server and Client Components

- Default to Server Components.
- Add `"use client"` only when the module genuinely requires:
  - client-side state;
  - event handlers;
  - browser APIs;
  - client-only libraries;
  - interactive effects.

- Keep client boundaries as low in the component tree as practical.
- Do not mark complete route sections as client-side without a real need.
- Do not move server-capable logic to the client for convenience.
- Do not fetch sensitive data into client scope when it is not required by the browser.
- Do not assume that hiding information in the UI protects it from the user.
- Data sent to the browser must be considered visible to the user.
- Keep authorization enforcement in the backend.
- Frontend route guards, disabled controls, and hidden UI are UX behavior, not security boundaries.

## 15. Tailwind CSS v4 and design tokens

The project uses Tailwind CSS v4 and an established token-based design system.

Rules:

- Search the existing token system before writing styles.
- Use existing generated token utilities first.
- Do not use arbitrary Tailwind values when an existing token can represent the design.
- Do not hardcode colors.
- Do not hardcode shadows.
- Do not hardcode radii.
- Do not hardcode spacing.
- Do not hardcode typography sizes.
- Do not hardcode line heights.
- Do not hardcode tracking.
- Do not use inline CSS variables in `className` when a token utility exists.
- Do not use inline styles to bypass the design system.
- Do not create component-specific CSS variables to bypass global tokens.
- Do not create a second local utility system.
- Do not create component-level classes such as `.card`, `.section`, or `.heading` unless explicitly approved.
- Do not use arbitrary values merely to visually approximate a design.

When a required token does not exist, stop and explain:

- which token is missing;
- where it is required;
- why no existing token is suitable;
- whether it should be global or feature-specific;
- what existing tokens are closest.

Adding or changing a global token requires Ramon’s approval.

Use Lucide icons through the established icon package.

Do not hand-write SVG icons when an appropriate existing icon is available.

## 16. UI quality

Every relevant interface must consider:

- loading state;
- empty state;
- success state;
- recoverable error state;
- unrecoverable error state;
- disabled state;
- responsive behavior;
- keyboard interaction;
- semantic HTML;
- accessible labels;
- visible focus behavior;
- content overflow;
- long text;
- missing optional information.

Do not build UI that assumes every backend request succeeds.

Do not introduce generic or machine-like user-facing copy.

User-facing text must remain natural, clear, and appropriate for the product.

## 17. Backend contracts and external data

Treat all external structured data as untrusted.

- Validate structured external payloads at runtime through the project’s established validation layer.
- Do not trust a TypeScript type assertion applied to fetched JSON.
- Validate backend payloads before using them in application state or UI.
- Do not silently convert malformed values into:
  - an empty string;
  - `0`;
  - `false`;
  - an empty array;
  - an empty object;
  - an arbitrary default.

- Distinguish missing data from invalid data.
- Handle invalid structured data as an explicit validation failure.
- Do not hide malformed backend data by normalizing it into a valid-looking value.
- Responses without structured payloads, such as `204 No Content`, binary files, or streams, must be handled according to their real contract.
- Keep frontend behavior aligned with the actual backend contract.
- Do not invent fields, codes, endpoints, permissions, or response states.

Account for:

- validation errors;
- authentication errors;
- authorization errors;
- business-rule errors;
- conflicts;
- not-found states;
- empty results;
- transient server errors;
- unavailable services;
- malformed responses.

## 18. Error handling

- Never show raw backend messages directly to users.
- Never show stack traces or internal exception details.
- Never expose internal route, database, infrastructure, or implementation information through user-facing errors.
- Map known backend error codes to controlled frontend messages.
- Use fixed frontend copy for expected error states.
- Use a safe generic message for unknown failures.
- Preserve technical details only where appropriate for internal debugging and only without sensitive data.
- Do not treat all errors as equivalent.
- Do not swallow errors silently.
- Do not return success-looking UI after an invalid or failed operation.

## 19. Security and privacy

Treat all applicant, provider, property, application, financial, eligibility, identity, address, and document information as sensitive.

Rules:

- Never expose secrets.
- Never reproduce detected secret values.
- Never include secrets in prompts, reports, logs, screenshots, URLs, or commits.
- Stop and notify Ramon when a possible secret is detected.
- Keep server-only environment variables outside the client bundle.
- Do not expose sensitive data through query parameters.
- Do not place sensitive data in browser-visible logs.
- Do not place sensitive data in analytics.
- Do not expose raw authentication or authorization information.
- Do not weaken existing authentication or authorization behavior.
- Do not introduce insecure HTML rendering.
- Avoid unsafe use of `dangerouslySetInnerHTML`.
- Validate and sanitize user-controlled content according to its real use.
- Treat redirects and user-controlled URLs carefully.
- Treat file uploads and downloaded content as untrusted.
- Do not rely on client-side checks for access control.
- Do not expose more data to the browser than the current screen requires.
- Do not make security-sensitive decisions based only on frontend state.

## 20. Dependencies

- Do not add a dependency without explicit approval.
- Do not remove a dependency without explicit approval.
- Do not upgrade a dependency outside the approved scope.
- Before proposing a dependency, state:
  - the package name;
  - the exact purpose;
  - why the current stack is insufficient;
  - expected maintenance impact;
  - bundle or runtime impact where relevant;
  - available alternatives.

- Prefer the current stack when it can solve the problem cleanly.
- Flag unused dependencies when discovered, but do not remove them during an unrelated task.

## 21. Official documentation

Use official documentation for technical decisions.

Before implementation:

- identify the actual installed version;
- consult the official documentation relevant to that version;
- verify the recommended current API;
- check for deprecated behavior;
- avoid relying on memory, blogs, tutorials, or copied snippets.

After implementation:

- consult the relevant official documentation again;
- confirm the implementation matches the documented API;
- verify that no deprecated approach was introduced;
- include the official sources used in the implementation report.

Do not update framework or library versions merely because newer documentation exists.

## 22. Review and subagents

Subagents must not run before Ramon approves the implementation review stage.

When approved:

- use read-only review agents first;
- limit their review to the actual diff and directly relevant context;
- use the appropriate architecture, security, review, or test agent;
- require concrete findings;
- avoid generic recommendations;
- classify findings by severity;
- stop on blocking findings;
- do not let review agents modify code.

Explain blocking or important findings before applying fixes.

Do not make architecture, UX, contract, security, or scope-changing corrections without approval.

After a correction, rerun only the affected review where practical.

Avoid uncontrolled review and repair loops.

## 23. Validation gates

Before Ramon approves the implementation itself, do not run:

- Prettier;
- formatting checks;
- ESLint;
- typechecking;
- unit tests;
- integration tests;
- build;
- Docker build;
- Docker smoke tests;
- E2E;
- dependency audits;
- broad security scans;
- repository-wide automatic fixes.

Before approval, agents may:

- read files;
- search references;
- inspect Git;
- inspect configuration;
- review the diff manually;
- compare code with documentation;
- perform reasoning-based static review without executing validation commands.

After approval:

- run only the validations Ramon authorizes;
- begin with focused validations where possible;
- avoid repository-wide formatting;
- avoid modifying unrelated files;
- report the exact command executed;
- report the real result;
- distinguish new failures from pre-existing failures;
- do not hide failed checks;
- do not claim that a validation passed when it was not executed.

## 24. Documentation and reporting

Keep documentation aligned with the implementation when the approved change affects:

- local setup;
- environment variables;
- scripts;
- project structure;
- architecture;
- backend contracts;
- CI;
- Docker;
- deployment;
- branch or pull request workflow.

Do not update unrelated documentation.

Every implementation report must state:

- the approved task;
- the files changed;
- the behavior changed;
- important technical decisions;
- official documentation consulted;
- identified risks;
- unresolved questions;
- validations executed;
- validations not executed;
- documentation updates required.

Separate facts from recommendations.

Never claim that code is tested, validated, secure, or production-ready unless the corresponding checks were actually completed.

## 25. Language rules

- Communication with Ramon must be in Spanish unless he requests another language.
- User-facing interface text must be in German.
- Code identifiers must be in English.
- Technical documentation must be in English.
- Repository instruction files must be in English.
- Commit messages must be in English.
- Pull request titles and descriptions must be in English.

Never add:

- agent signatures;
- model names;
- tool names;
- generated-by messages;
- `Co-authored-by`;
- similar attribution text.

## Definition of done

A task is complete only when:

- it matches the approved scope;
- no unrelated files were changed;
- no scope was expanded silently;
- the implementation follows all applicable instruction files;
- the implementation respects the current architecture;
- TypeScript remains strict;
- no `any` or error suppression was introduced;
- no code comments were added;
- responsibilities remain clearly separated;
- files remain reasonably focused;
- custom hooks are used only where meaningful;
- DRY was applied with restraint;
- the existing design tokens were used;
- external structured data is validated;
- invalid data is not hidden through defaults;
- user-facing errors are controlled;
- security and privacy were preserved;
- no dependency changed without approval;
- the complete diff was manually reviewed;
- official documentation was checked before and after implementation;
- only approved validations were executed;
- validation results were reported honestly;
- required documentation was updated;
- Ramon approved the relevant delivery stage.
