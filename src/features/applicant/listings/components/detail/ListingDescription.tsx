"use client";

import { useEffect, useRef, useState } from "react";
import { buttonClassWithSize } from "@/components/ui/button/Button";
import { cn } from "@/lib/utils/cn";
import { listingDetailCopy } from "../../copy/listing-detail";
import { DetailSectionHeading } from "./DetailSectionHeading";

interface ListingDescriptionProps {
  text: string | null;
  className?: string;
}

const BLOCK_CLASS = "max-w-prose";

const TEXT_CLASS = "text-caption leading-relaxed text-foreground-secondary";

const EMPTY_CLASS = "text-caption text-foreground-tertiary";

const { description } = listingDetailCopy;

export function ListingDescription({
  text,
  className,
}: ListingDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  const trimmed = text?.trim() ?? "";

  useEffect(() => {
    const node = textRef.current;
    if (!node || expanded) return undefined;

    const measure = () => {
      setIsClamped(node.scrollHeight - node.clientHeight > 1);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [trimmed, expanded]);

  if (!trimmed) {
    return (
      <section className={className}>
        <DetailSectionHeading>{description.title}</DetailSectionHeading>
        <p className={EMPTY_CLASS}>{description.empty}</p>
      </section>
    );
  }

  return (
    <section className={cn(BLOCK_CLASS, className)}>
      <DetailSectionHeading>{description.title}</DetailSectionHeading>

      <p ref={textRef} className={cn(TEXT_CLASS, !expanded && "line-clamp-5")}>
        {trimmed}
      </p>

      {isClamped && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className={buttonClassWithSize(
            "ghost",
            "sm",
            "mt-1 px-0 text-primary",
          )}
          aria-expanded={expanded}
        >
          {expanded ? description.less : description.more}
        </button>
      )}
    </section>
  );
}
