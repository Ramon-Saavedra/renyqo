import type { ObjectTypeBackend } from "@/lib/api/listings";
import { OBJECT_TYPE_LABEL } from "../copy/listing-detail";

interface TypeChipProps {
  objectType: ObjectTypeBackend;
}

const CHIP_CLASS =
  "rounded-sm border border-border px-1.75 py-0.75 font-mono text-meta tracking-normal text-warning-vivid uppercase";

export function TypeChip({ objectType }: TypeChipProps) {
  return <span className={CHIP_CLASS}>{OBJECT_TYPE_LABEL[objectType]}</span>;
}
