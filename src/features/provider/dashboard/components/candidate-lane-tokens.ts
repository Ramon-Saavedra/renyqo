export const DARK: Record<string, string> = {
  "--rq-edge": "#2E2E2E",
  "--rq-lane-edge": "#2C2C33",
  "--rq-div": "#26262C",
  "--rq-text": "#EDEDEF",
  "--rq-dim": "#83838A",
  "--rq-faint": "#5E5E64",
  "--rq-sub": "#7E7E85",
  "--rq-card": "#0E402F",
  "--rq-card-sep": "rgba(160,220,196,.13)",
  "--rq-card-hover": "#12503A",
  "--rq-card-name": "#F0F7F3",
  "--rq-card-dim": "#9EC4B4",
  "--rq-avatar-bg": "#2E8A67",
  "--rq-avatar-bd": "#48A882",
  "--rq-avatar-tx": "#F2FBF7",
  "--rq-rail-on": "#2A7A5C",
  "--rq-rail-off": "rgba(255,255,255,.11)",
  "--rq-warn-ico": "#F0B96B",
  "--rq-warn-ico-bg": "rgba(245,158,66,.16)",
  "--rq-tip-bg": "#08281D",
  "--rq-tip-bd": "#2A7A5C",
  "--rq-tip-tx": "#EAF5F0",
  "--rq-skel1": "rgba(255,255,255,.085)",
  "--rq-skel2": "rgba(255,255,255,.055)",
  "--rq-wait-bd": "rgba(250,201,132,.32)",
  "--rq-streak": "rgba(255,255,255,.055)",
  "--rq-empty-hatch": "rgba(255,255,255,.03)",
  "--rq-empty-bd": "rgba(255,255,255,.13)",
  "--rq-empty-tx": "#55555B",
};

export const LIGHT: Record<string, string> = {
  "--rq-edge": "#E5E5E5",
  "--rq-lane-edge": "#E5E5E5",
  "--rq-div": "#EBEBE8",
  "--rq-text": "#1A141A",
  "--rq-dim": "#6E6E6E",
  "--rq-faint": "#9A9A96",
  "--rq-sub": "#6E6E6E",
  "--rq-card": "#E9F3EE",
  "--rq-card-sep": "rgba(14,64,47,.14)",
  "--rq-card-hover": "#DFEEE7",
  "--rq-card-name": "#0B2C20",
  "--rq-card-dim": "#4C6B5D",
  "--rq-avatar-bg": "#0E402F",
  "--rq-avatar-bd": "#0E402F",
  "--rq-avatar-tx": "#E9F3EE",
  "--rq-rail-on": "#1C6B4E",
  "--rq-rail-off": "rgba(26,20,26,.10)",
  "--rq-warn-ico": "#8A5D18",
  "--rq-warn-ico-bg": "rgba(245,158,66,.20)",
  "--rq-tip-bg": "#0E402F",
  "--rq-tip-bd": "#2A7A5C",
  "--rq-tip-tx": "#EAF5F0",
  "--rq-skel1": "rgba(26,20,26,.085)",
  "--rq-skel2": "rgba(26,20,26,.055)",
  "--rq-wait-bd": "rgba(138,93,24,.30)",
  "--rq-streak": "rgba(1,128,99,.045)",
  "--rq-empty-hatch": "rgba(26,20,26,.035)",
  "--rq-empty-bd": "rgba(26,20,26,.16)",
  "--rq-empty-text": "#9A9A96",
  "--rq-empty-tx": "#9A9A96",
};

export const ROW: Record<string, string> = {
  "--rq-dir": "row",
  "--rq-field-flex": "1 1 0",
  "--rq-sep": "inset 1px 0 0 var(--rq-div)",
  "--rq-card-sep-shadow": "inset 1px 0 0 var(--rq-card-sep)",
  "--rq-pad": "15px 15px 16px",
  "--rq-meta-gap": "8px",
  "--rq-teaser-flex": "0 0 118px",
  "--rq-teaser-h": "auto",
  "--rq-teaser-iw": "150px",
  "--rq-teaser-ih": "100%",
  "--rq-mask": "linear-gradient(to right, #000 40%, rgba(0,0,0,.1) 100%)",
  "--rq-bleed-r": "-26px",
  "--rq-bleed-b": "0px",
  "--rq-lane-radius": "var(--radius-lg) 0 0 var(--radius-lg)",
  "--rq-panel-pad": "26px",
  "--rq-chat-display": "block",
  "--rq-name-fs": "13px",
};

export const MID: Record<string, string> = {
  "--rq-pad": "13px 11px 14px",
  "--rq-meta-gap": "6px",
  "--rq-teaser-flex": "0 0 84px",
  "--rq-teaser-iw": "112px",
  "--rq-mask": "linear-gradient(to right, #000 34%, rgba(0,0,0,.1) 100%)",
  "--rq-chat-display": "none",
  "--rq-name-fs": "12.5px",
};

export const COL: Record<string, string> = {
  "--rq-dir": "column",
  "--rq-field-flex": "0 0 auto",
  "--rq-sep": "inset 0 1px 0 var(--rq-div)",
  "--rq-card-sep-shadow": "inset 0 1px 0 var(--rq-card-sep)",
  "--rq-pad": "13px 14px 14px",
  "--rq-meta-gap": "8px",
  "--rq-teaser-flex": "0 0 auto",
  "--rq-teaser-h": "104px",
  "--rq-teaser-iw": "100%",
  "--rq-teaser-ih": "104px",
  "--rq-mask": "linear-gradient(to bottom, #000 34%, rgba(0,0,0,.08) 100%)",
  "--rq-bleed-r": "0px",
  "--rq-bleed-b": "0px",
  "--rq-lane-radius": "var(--radius-lg) var(--radius-lg) 0 0",
  "--rq-panel-pad": "20px",
  "--rq-chat-display": "block",
  "--rq-name-fs": "13px",
};

export type Tier = {
  max: number;
  rgb: string;
  dark: string;
  light: string;
  band: number;
  ms: number;
  sweep: number;
  crawl: number;
  label: string;
};

export const TIERS: Tier[] = [
  {
    max: 10,
    rgb: "47,169,138",
    dark: "#2FA98A",
    light: "#018063",
    band: 50,
    ms: 6.0,
    sweep: 5.4,
    crawl: 2.6,
    label: "ruhig",
  },
  {
    max: 20,
    rgb: "154,196,64",
    dark: "#9AC440",
    light: "#5C7A12",
    band: 66,
    ms: 5.4,
    sweep: 5.0,
    crawl: 2.3,
    label: "leichter Andrang",
  },
  {
    max: 30,
    rgb: "234,196,50",
    dark: "#EAC432",
    light: "#86660A",
    band: 82,
    ms: 4.8,
    sweep: 4.6,
    crawl: 2.1,
    label: "Andrang",
  },
  {
    max: 40,
    rgb: "247,181,30",
    dark: "#F7B51E",
    light: "#8F5A08",
    band: 98,
    ms: 4.3,
    sweep: 4.2,
    crawl: 1.9,
    label: "spürbarer Andrang",
  },
  {
    max: 50,
    rgb: "247,150,45",
    dark: "#F7962D",
    light: "#9C5314",
    band: 114,
    ms: 3.8,
    sweep: 3.8,
    crawl: 1.7,
    label: "hoher Andrang",
  },
  {
    max: 60,
    rgb: "244,124,45",
    dark: "#F47C2D",
    light: "#A8481C",
    band: 130,
    ms: 3.3,
    sweep: 3.4,
    crawl: 1.5,
    label: "starker Andrang",
  },
  {
    max: 70,
    rgb: "238,100,48",
    dark: "#EE6430",
    light: "#B03A1A",
    band: 146,
    ms: 2.9,
    sweep: 3.1,
    crawl: 1.4,
    label: "sehr hoher Andrang",
  },
  {
    max: 80,
    rgb: "232,80,50",
    dark: "#E85032",
    light: "#B8321C",
    band: 162,
    ms: 2.5,
    sweep: 2.8,
    crawl: 1.25,
    label: "kritischer Andrang",
  },
  {
    max: 90,
    rgb: "237,60,50",
    dark: "#ED3C32",
    light: "#C22A1C",
    band: 178,
    ms: 2.2,
    sweep: 2.5,
    crawl: 1.15,
    label: "sehr kritisch",
  },
  {
    max: 100,
    rgb: "239,40,40",
    dark: "#EF2828",
    light: "#C41E1E",
    band: 194,
    ms: 1.9,
    sweep: 2.2,
    crawl: 1.05,
    label: "Überlast",
  },
  {
    max: Infinity,
    rgb: "214,20,20",
    dark: "#D61414",
    light: "#A81212",
    band: 210,
    ms: 1.6,
    sweep: 2.0,
    crawl: 0.95,
    label: "Überlauf",
  },
];

export const STRENGTH_DARK = [
  0.11, 0.14, 0.18, 0.22, 0.26, 0.3, 0.34, 0.38, 0.42, 0.46, 0.5,
];
export const STRENGTH_LIGHT = [
  0.14, 0.17, 0.2, 0.24, 0.27, 0.31, 0.34, 0.38, 0.41, 0.45, 0.5,
];

export const MONO = "'Roboto Mono', ui-monospace, monospace";

export function tierAt(index: number): Tier {
  const found = TIERS[index];
  if (found) return found;
  const fallback = TIERS[TIERS.length - 1];
  if (fallback) return fallback;
  throw new Error("TIERS must not be empty");
}

export function strengthAt(scale: readonly number[], index: number): number {
  const found = scale[index];
  if (found !== undefined) return found;
  const fallback = scale[scale.length - 1];
  if (fallback !== undefined) return fallback;
  return 0.5;
}
