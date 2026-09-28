import { siteConfig } from "@/config/site";
import "./Watermark.css";

export function Watermark() {
  return (
    <span aria-hidden="true" className="watermark">
      {siteConfig.name}
    </span>
  );
}
