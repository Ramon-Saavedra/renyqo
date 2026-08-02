"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { consumeFlash } from "@/lib/utils/flash";

const TOAST_CLASS =
  "fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-md border border-success-surface-border bg-success-surface px-4 py-3 text-caption font-medium text-success-on-surface shadow-card rq-fade-in";

const VISIBLE_MS = 3000;

export function FlashToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const flash = consumeFlash();
    if (flash === null) return undefined;

    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const showTimer = setTimeout(() => {
      setMessage(flash);
      hideTimer = setTimeout(() => setMessage(null), VISIBLE_MS);
    });

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (message === null) return null;

  return (
    <div role="status" aria-live="polite" className={TOAST_CLASS}>
      <AppIcon icon={CheckCircle2} size={15} strokeWidth={1.6} decorative />
      {message}
    </div>
  );
}
