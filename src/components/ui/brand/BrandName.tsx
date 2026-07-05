import { Fragment, type ReactNode } from "react";

export function BrandName() {
  return <span className="font-bold text-primary">Renyqo</span>;
}

export function withBrand(template: string): ReactNode {
  const parts = template.split("{brand}");
  return parts.map((part, index) => (
    <Fragment key={index}>
      {part}
      {index < parts.length - 1 && <BrandName />}
    </Fragment>
  ));
}
