import { Minus, Plus } from "lucide-react";
import { FormField } from "@/components/ui/form/FormField";
import { Input } from "@/components/ui/form/Input";
import { InputAffix } from "@/components/ui/form/InputAffix";
import { Select } from "@/components/ui/form/Select";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { listingDetailCopy } from "../../copy/listing-detail";
import { DetailCard } from "../../components/DetailCard";
import type { ChangedFields } from "../changed-fields";
import { listingEditCopy } from "../copy";
import type {
  EditFieldSetter,
  ListingEditErrors,
  ListingEditForm,
} from "../types";
import { BEDROOM_OPTIONS } from "@/features/provider/create-listing/copy/create-listing";

interface FactsEditCardProps {
  form: ListingEditForm;
  setField: EditFieldSetter;
  errors: ListingEditErrors;
  savedFields: ChangedFields;
  className?: string;
}

const { fields, suffix } = listingEditCopy;

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function decimalOnly(value: string): string {
  return value.replace(/[^\d.,]/g, "");
}

function formatCurrency(value: number): string {
  return value.toLocaleString("de-DE");
}

export function FactsEditCard({
  form,
  setField,
  errors,
  savedFields,
  className,
}: FactsEditCardProps) {
  const coldRent = parseInt(form.coldRent, 10);
  const calculatedDeposit =
    !isNaN(coldRent) && coldRent > 0 && form.depositMonths !== null
      ? formatCurrency(coldRent * form.depositMonths)
      : null;

  const changeDepositMonths = (next: number) => {
    setField("depositMonths", next);
    const rent = parseInt(form.coldRent, 10);
    if (!isNaN(rent) && rent > 0) {
      setField("deposit", String(rent * next));
    }
  };

  return (
    <DetailCard title={listingDetailCopy.facts.title} className={className}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={fields.coldRent}
          htmlFor="edit-cold-rent"
          error={errors.coldRent}
        >
          <InputAffix suffix={suffix.perMonth}>
            <Input
              id="edit-cold-rent"
              inputMode="numeric"
              value={form.coldRent}
              saved={savedFields.has("coldRent")}
              onChange={(e) => {
                const val = digitsOnly(e.target.value);
                setField("coldRent", val);
                const rent = parseInt(val, 10);
                if (!isNaN(rent) && rent > 0 && form.depositMonths !== null) {
                  setField("deposit", String(rent * form.depositMonths));
                }
              }}
              className="pr-22"
            />
          </InputAffix>
        </FormField>
        <FormField
          label={fields.additionalCosts}
          htmlFor="edit-additional-costs"
          error={errors.additionalCosts}
        >
          <InputAffix suffix={suffix.perMonth}>
            <Input
              id="edit-additional-costs"
              inputMode="numeric"
              value={form.additionalCosts}
              saved={savedFields.has("additionalCosts")}
              onChange={(e) =>
                setField("additionalCosts", digitsOnly(e.target.value))
              }
              className="pr-22"
            />
          </InputAffix>
        </FormField>
        <FormField
          label={fields.deposit}
          error={errors.deposit ?? errors.depositMonths}
          className="sm:col-span-2"
        >
          <div
            role="group"
            aria-label={fields.deposit}
            className="flex h-11 items-center overflow-hidden rounded-md border border-border-strong bg-background-subtle"
          >
            <button
              type="button"
              aria-label="Kaution verringern"
              disabled={form.depositMonths === null || form.depositMonths <= 1}
              onClick={() => changeDepositMonths(form.depositMonths! - 1)}
              className="grid h-full w-10.5 cursor-pointer place-items-center text-foreground-secondary hover:bg-background-muted hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground-tertiary"
            >
              <AppIcon icon={Minus} size={16} strokeWidth={1.8} decorative />
            </button>
            <span className="min-w-0 flex-1 text-center font-display text-action font-medium tabular-nums text-foreground">
              {form.depositMonths ?? "—"} Mon.
            </span>
            <span
              aria-hidden="true"
              className="font-mono text-meta text-foreground-tertiary"
            >
              |
            </span>
            <span className="min-w-0 flex-1 text-center font-display text-action font-medium tabular-nums text-foreground">
              {calculatedDeposit ? `${calculatedDeposit} €` : "—"}
            </span>
            <button
              type="button"
              aria-label="Kaution erhöhen"
              disabled={form.depositMonths !== null && form.depositMonths >= 3}
              onClick={() => changeDepositMonths((form.depositMonths ?? 1) + 1)}
              className="grid h-full w-10.5 cursor-pointer place-items-center text-foreground-secondary hover:bg-background-muted hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground-tertiary"
            >
              <AppIcon icon={Plus} size={16} strokeWidth={1.8} decorative />
            </button>
          </div>
        </FormField>
        <FormField
          label={fields.livingArea}
          htmlFor="edit-living-area"
          error={errors.livingArea}
        >
          <InputAffix suffix={suffix.area}>
            <Input
              id="edit-living-area"
              inputMode="numeric"
              value={form.livingArea}
              saved={savedFields.has("livingArea")}
              onChange={(e) =>
                setField("livingArea", digitsOnly(e.target.value))
              }
              className="pr-13"
            />
          </InputAffix>
        </FormField>
        <FormField
          label={fields.rooms}
          htmlFor="edit-rooms"
          error={errors.rooms}
        >
          <Input
            id="edit-rooms"
            inputMode="decimal"
            value={form.rooms}
            saved={savedFields.has("rooms")}
            onChange={(e) => setField("rooms", decimalOnly(e.target.value))}
          />
        </FormField>
        <FormField label={fields.bedrooms} htmlFor="edit-bedrooms">
          <Select
            id="edit-bedrooms"
            value={form.bedrooms}
            onChange={(e) => setField("bedrooms", e.target.value)}
          >
            <option value="">{listingEditCopy.emptyOption}</option>
            {BEDROOM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace(".", ",")}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={fields.availableFrom} htmlFor="edit-available-from">
          <Input
            id="edit-available-from"
            type="date"
            value={form.availableFrom}
            saved={savedFields.has("availableFrom")}
            onChange={(e) => setField("availableFrom", e.target.value)}
          />
        </FormField>
      </div>
    </DetailCard>
  );
}
