"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Link2 } from "lucide-react";
import { SiFacebook, SiWhatsapp } from "react-icons/si";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { BrandIcon } from "@/components/ui/icon/BrandIcon";
import { cn } from "@/lib/utils/cn";
import { dashboardCopy } from "../copy/dashboard";

interface ShareButtonsProps {
  title: string;
  shareUrl: string;
  variant?: "primary" | "popover" | "sidebar";
  selected?: boolean;
}

const ROW_CLASS = "mt-2.5 grid grid-cols-3 gap-1";
const POPOVER_ROW_CLASS =
  "grid min-w-64 grid-cols-3 gap-1 rounded-md border border-border bg-background p-1.5 shadow-card";
const SIDEBAR_ROW_CLASS = "mt-auto grid grid-cols-3 gap-1 pt-2";

const BUTTON_CLASS =
  "inline-flex h-6.5 min-w-0 cursor-pointer items-center justify-center gap-1 rounded-sm border border-primary-foreground/20 bg-primary-foreground/10 px-1.5 text-caption font-medium text-primary-foreground hover:border-primary-foreground/35 hover:bg-primary-foreground/20";
const POPOVER_BUTTON_CLASS =
  "inline-flex h-7 min-w-0 cursor-pointer items-center justify-center gap-1 rounded-sm border border-border-strong bg-background-subtle px-1.5 text-caption font-medium text-foreground-secondary hover:bg-background-muted hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";
const SIDEBAR_BUTTON_CLASS =
  "inline-flex h-5.5 min-w-0 cursor-pointer items-center justify-center rounded-sm border border-primary-foreground/40 bg-primary-foreground/20 text-primary-foreground hover:border-primary-foreground/60 hover:bg-primary-foreground/30 focus-visible:outline-none focus-visible:shadow-focus";
const SIDEBAR_BUTTON_INACTIVE_CLASS =
  "inline-flex h-5.5 min-w-0 cursor-pointer items-center justify-center rounded-sm border border-border-strong bg-background-subtle text-foreground-secondary hover:border-foreground-tertiary hover:bg-background-muted hover:text-foreground focus-visible:outline-none focus-visible:shadow-focus";

const LABEL_CLASS = "truncate";

export function ShareButtons({
  title,
  shareUrl,
  variant = "primary",
  selected = false,
}: ShareButtonsProps) {
  const { share } = dashboardCopy.sidebar;
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowClass =
    variant === "popover"
      ? POPOVER_ROW_CLASS
      : variant === "sidebar"
        ? SIDEBAR_ROW_CLASS
        : ROW_CLASS;
  const buttonClass =
    variant === "popover"
      ? POPOVER_BUTTON_CLASS
      : variant === "sidebar"
        ? selected
          ? SIDEBAR_BUTTON_CLASS
          : SIDEBAR_BUTTON_INACTIVE_CLASS
        : BUTTON_CLASS;
  const showLabel = variant !== "sidebar";

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const shareText = `${title} — ${shareUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    shareUrl,
  )}`;

  const handleCopy = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      void navigator.clipboard?.writeText(shareUrl).then(() => {
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
      });
    },
    [shareUrl],
  );

  const stop = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  return (
    <div className={rowClass}>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={stop}
        className={buttonClass}
        aria-label={share.whatsapp}
      >
        <BrandIcon icon={SiWhatsapp} size={11} decorative />
        {showLabel && <span className={LABEL_CLASS}>{share.whatsapp}</span>}
      </a>
      <a
        href={facebookHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={stop}
        className={buttonClass}
        aria-label={share.facebook}
      >
        <BrandIcon icon={SiFacebook} size={11} decorative />
        {showLabel && <span className={LABEL_CLASS}>{share.facebook}</span>}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className={buttonClass}
        aria-label={share.copyAria}
      >
        <AppIcon
          icon={copied ? Check : Link2}
          size={11}
          strokeWidth={1.8}
          decorative
        />
        {showLabel && (
          <span className={cn(LABEL_CLASS)}>
            {copied ? share.copied : share.copy}
          </span>
        )}
      </button>
    </div>
  );
}
