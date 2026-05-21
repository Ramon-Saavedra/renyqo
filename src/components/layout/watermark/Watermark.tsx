import { siteConfig } from "@/config/site";

export function Watermark() {
  return (
    <span aria-hidden="true" className="watermark">
      {siteConfig.name}
    </span>
  );
}
