interface DetailSectionHeadingProps {
  children: React.ReactNode;
}

const HEADING_CLASS =
  "mb-2.5 font-mono text-meta uppercase text-foreground-tertiary";

export function DetailSectionHeading({ children }: DetailSectionHeadingProps) {
  return <h2 className={HEADING_CLASS}>{children}</h2>;
}
