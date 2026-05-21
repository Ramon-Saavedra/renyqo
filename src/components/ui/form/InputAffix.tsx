interface InputAffixProps {
  children: React.ReactNode;
  suffix: React.ReactNode;
}

export function InputAffix({ children, suffix }: InputAffixProps) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-caption tabular-nums text-foreground-tertiary">
        {suffix}
      </span>
    </div>
  );
}
