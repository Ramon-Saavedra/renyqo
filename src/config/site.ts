const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const siteConfig = {
  name: "Renyqo",
  description:
    "Renyqo ist die smarte Plattform für Vermietung: Mietobjekte anlegen, Bewerbungen vorsortieren und passende Mieter einfacher finden.",
  url: SITE_URL,
  locale: "de-DE",
  ogLocale: "de_DE",
} as const;

export type SiteConfig = typeof siteConfig;
