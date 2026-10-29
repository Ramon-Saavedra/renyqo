"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { buttonClassWithSize } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { cn } from "@/lib/utils/cn";
import styles from "./Conversation.module.css";

interface MobileChatViewProps {
  readonly title: string;
  readonly closeLabel: string;
  readonly onClose: () => void;
  readonly section?: string;
  readonly accessory?: ReactNode;
  readonly status?: ReactNode;
  readonly children: ReactNode;
}

export function MobileChatView({
  title,
  closeLabel,
  onClose,
  section,
  accessory,
  status,
  children,
}: MobileChatViewProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  return (
    <section
      aria-labelledby={titleId}
      data-section={section}
      className="fixed inset-x-0 top-app-topbar z-20 flex h-[calc(100dvh-var(--spacing-app-topbar)-var(--safe-area-top))] flex-col overflow-hidden bg-background"
    >
      <header className={cn("shrink-0 border-b border-border", styles.header)}>
        <div className="flex min-w-0 items-center gap-2 px-card-x py-parent-y">
          <h2
            id={titleId}
            className="min-w-0 flex-1 truncate text-body font-medium wrap-anywhere"
          >
            {title}
          </h2>
          {status}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className={buttonClassWithSize("ghost", "icon-md")}
          >
            <AppIcon icon={X} size={20} strokeWidth={2} decorative />
          </button>
        </div>
        {accessory ? (
          <div className="border-t border-border px-card-x py-parent-y">
            {accessory}
          </div>
        ) : null}
      </header>
      <div className="flex min-h-0 flex-1 flex-col bg-background-muted pb-safe">
        {children}
      </div>
    </section>
  );
}
