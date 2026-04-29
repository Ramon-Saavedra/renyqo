Project styling rules:

This project uses Tailwind CSS v4 with design tokens defined in the global CSS file through @theme inline.

Do not use arbitrary Tailwind values as the default approach.

Avoid patterns like:
px-[var(--page-padding)]
pt-[var(--space-8)]
pb-[var(--space-12)]
text-[42px]
leading-[1.05]
tracking-[-0.032em]

Use existing Tailwind utilities generated from theme tokens instead.

Correct examples:
bg-primary
bg-background
text-foreground
text-foreground-secondary
border-border
shadow-card
rounded-md
font-display
px-page
pt-space-8
pb-space-12
mb-space-6
gap-space-4
text-heading-xl
leading-heading-xl
tracking-heading-xl

Do not write CSS utility classes like .heading-xl, .section, .card, etc. unless I explicitly ask for component-level CSS.

Do not use inline var() inside JSX className when a Tailwind token utility exists.

Do not invent random pixel values or arbitrary values to make the design look right.

If a spacing, typography, color, radius, shadow, or layout token is missing, stop and tell me exactly which token is needed before continuing.

Use the existing design system first. Extend the theme only when necessary and only after asking.

All spacing should come from the Tailwind token scale:
space, page, section, card, gap, margin, padding tokens.

All typography should come from Tailwind text/font/leading/tracking tokens.

All colors must come from Tailwind color tokens, never hardcoded hex values inside components.

The JSX should stay clean, consistent, and easy to maintain.

Preferred style:
className="flex min-h-screen bg-background text-foreground"
className="mx-auto flex w-full max-w-6xl flex-col px-page pt-space-8 pb-space-12"
className="mb-space-6 text-heading-xl leading-heading-xl tracking-heading-xl"

Wrong style:
className="**px-[var(--page-padding)] **pt-[var(--space-8)] text-[42px] leading-[1.05]"


Please refactor the role naming and route strategy consistently.

Use English for technical routes, enums, types, file names, and internal code identifiers.

Visible UI copy can remain in German.

Route strategy:
Use English routes for app/internal flows such as:
/register/account-type
/register/profile
/register/documents
/login
/dashboard

Do not use German technical routes like:
/registrieren/kontoart

Exception:
German routes are only acceptable for public SEO pages if we explicitly decide that later, for example:
/vermieter
/mieter
/mietobjekt-anbieten

For the account type flow, replace the current role type:

type Role = "tenant" | "landlord";

with:

type Role = "applicant" | "provider";

Meaning:
applicant = the person looking for a home and applying for a rental object
provider = the person or professional offering a rental object, including landlords, property owners, and real estate agents

Update all related constants, copy objects, route params, query params, component props, and mappings accordingly.

For example:
ROLE_KEYS should become ["applicant", "provider"]
ROLE_GLYPHS should use applicant and provider
/register?role=applicant
/register?role=provider

Keep the UI text in German. Do not translate the visible product copy into English unless asked.

Preserve behavior and visual appearance. This is a naming and consistency refactor, not a redesign.

Be very careful with routes and links.

Before changing any route, inspect all existing usages of:
Link href
router.push
redirect
route folders
dynamic segments
query params
navigation items
tests that reference routes

Do not break navigation.

If you rename a route, update every related link, redirect, button, test, and route folder consistently.

Do not leave mixed routes such as:
/register/account-type in one place
/registrieren/kontoart in another place

Use only the agreed English internal route structure:
 /register/account-type
 /register/profile
 /register/documents
 /login
 /dashboard

For the role query param, use only:
role=applicant
role=provider

Do not keep old values like:
role=tenant
role=landlord

After the refactor, verify that:
all Link href values are valid
all router.push paths are valid
all route folders match the hrefs
the account-type selection still navigates correctly
no broken imports or stale route constants remain

If there is any uncertainty about a route, stop and ask before changing it.
