import { Fragment, type ReactNode } from "react";
import { siteConfig } from "@/config/site";

export function BrandName() {
  return <span className="font-bold text-primary">{siteConfig.name}</span>;
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
