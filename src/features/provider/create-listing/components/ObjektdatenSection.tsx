"use client";

import { cn } from "@/lib/utils/cn";
import { Building2, DoorOpen, Home, Minus, Plus } from "lucide-react";
import { CardCheckbox } from "@/components/ui/form/CardCheckbox";
import { FormField } from "@/components/ui/form/FormField";
import { Input } from "@/components/ui/form/Input";
import { InputAffix } from "@/components/ui/form/InputAffix";
import { Segmented } from "@/components/ui/form/Segmented";
import { Select } from "@/components/ui/form/Select";
import { Textarea } from "@/components/ui/form/Textarea";
import {
  createListingCopy,
  type ObjectType,
  type RoomOption,
  ROOM_OPTIONS,
  BEDROOM_OPTIONS,
} from "../copy/create-listing";
import type {
  DepositMonths,
  ListingDraft,
  ListingDraftErrors,
  ListingPhoto,
} from "../hooks/useListingDraft";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { AutoTitleField } from "./AutoTitleField";
import { PhotoGrid } from "./PhotoGrid";
import { SectionCard } from "./SectionCard";

interface ObjektdatenSectionProps {
  draft: ListingDraft;
  setField: <K extends keyof ListingDraft>(
    field: K,
    value: ListingDraft[K],
  ) => void;
  setPhotos: (photos: ReadonlyArray<ListingPhoto>) => void;
  fieldErrors?: ListingDraftErrors;
}

const OBJECT_TYPE_ICONS = {
  wohnung: Building2,
  haus: Home,
  zimmer: DoorOpen,
} as const;

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function formatCurrency(value: number): string {
  return value.toLocaleString("de-DE");
}

function calculateDeposit(price: string, months: DepositMonths): string | null {
  const coldRent = parseInt(price, 10);
  if (!coldRent || Number.isNaN(coldRent)) return null;
  return formatCurrency(coldRent * months);
}

function isDepositMonths(value: number): value is DepositMonths {
  return value === 1 || value === 2 || value === 3;
}

export function ObjektdatenSection({
  draft,
  setField,
  setPhotos,
  fieldErrors,
}: ObjektdatenSectionProps) {
  const copy = createListingCopy.objektdaten;
  const fields = copy.fields;

  const charCount = draft.description.length;
  const calculatedDeposit = calculateDeposit(draft.price, draft.depositMonths);
  const isOverWarn = charCount > fields.description.warnAt;
  const charClass = cn(
    "font-mono text-meta tabular-nums",
    isOverWarn ? "text-warning" : "text-foreground-tertiary",
  );
  const changeDepositMonths = (next: number) => {
    if (isDepositMonths(next)) setField("depositMonths", next);
  };

  return (
    <SectionCard
      id="sec-01"
      num={copy.num}
      title={copy.title}
      description={copy.description}
      className="bg-background"
    >
      <FormField
        label={fields.street.label}
        htmlFor="street"
        required
        error={fieldErrors?.street}
      >
        <Input
          id="street"
          value={draft.street}
          placeholder={fields.street.placeholder}
          onChange={(e) => setField("street", e.target.value)}
        />
      </FormField>
      <div className="flex gap-3">
        <FormField
          label={fields.zip.label}
          htmlFor="zip"
          required
          error={fieldErrors?.zip}
          className="w-32 shrink-0"
        >
          <Input
            id="zip"
            value={draft.zip}
            placeholder={fields.zip.placeholder}
            onChange={(e) => setField("zip", e.target.value)}
          />
        </FormField>
        <FormField
          label={fields.city.label}
          htmlFor="city"
          required
          error={fieldErrors?.city}
          className="min-w-0 flex-1"
        >
          <Input
            id="city"
            value={draft.city}
            placeholder={fields.city.placeholder}
            onChange={(e) => setField("city", e.target.value)}
          />
        </FormField>
      </div>
      <CardCheckbox
        id="hide-address"
        checked={draft.hideAddress}
        onChange={(value) => setField("hideAddress", value)}
        description={fields.hideAddress.sub}
      >
        {fields.hideAddress.label}
      </CardCheckbox>

      <FormField label={fields.objectType.label} required>
        <Segmented<ObjectType>
          value={draft.objectType}
          onChange={(value) => setField("objectType", value)}
          options={fields.objectType.options.map((o) => ({
            value: o.value as ObjectType,
            label: o.label,
            icon: OBJECT_TYPE_ICONS[o.value as ObjectType],
          }))}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          label={fields.area.label}
          htmlFor="area"
          required
          error={fieldErrors?.area}
        >
          <InputAffix suffix={fields.area.suffix}>
            <Input
              id="area"
              inputMode="numeric"
              value={draft.area}
              placeholder={fields.area.placeholder}
              onChange={(e) => setField("area", digitsOnly(e.target.value))}
              className="pr-13"
            />
          </InputAffix>
        </FormField>

        <FormField
          label={fields.rooms.label}
          htmlFor="rooms"
          required
          error={fieldErrors?.rooms}
        >
          <Select
            id="rooms"
            value={draft.rooms}
            onChange={(e) => setField("rooms", e.target.value as RoomOption)}
          >
            <option value="">{fields.rooms.placeholder}</option>
            {ROOM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace(".", ",")}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label={fields.bedrooms.label}
          htmlFor="bedrooms"
          required
          error={fieldErrors?.bedrooms}
        >
          <Select
            id="bedrooms"
            value={draft.bedrooms}
            onChange={(e) => setField("bedrooms", e.target.value)}
          >
            <option value="">{fields.bedrooms.placeholder}</option>
            {BEDROOM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace(".", ",")}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={fields.price.label}
          htmlFor="price"
          required
          error={fieldErrors?.price}
        >
          <InputAffix suffix={fields.price.suffix}>
            <Input
              id="price"
              inputMode="numeric"
              value={draft.price}
              placeholder={fields.price.placeholder}
              onChange={(e) => setField("price", digitsOnly(e.target.value))}
              className="pr-22"
            />
          </InputAffix>
        </FormField>
        <FormField
          label={fields.availableFrom.label}
          htmlFor="available-from"
          required
          error={fieldErrors?.availableFrom}
        >
          <Input
            id="available-from"
            type="date"
            value={draft.availableFrom}
            onChange={(e) => setField("availableFrom", e.target.value)}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={fields.additionalCosts.label}
          htmlFor="additional-costs"
          error={fieldErrors?.additionalCosts}
        >
          <InputAffix suffix={fields.additionalCosts.suffix}>
            <Input
              id="additional-costs"
              inputMode="numeric"
              value={draft.additionalCosts}
              placeholder={fields.additionalCosts.placeholder}
              onChange={(e) =>
                setField("additionalCosts", digitsOnly(e.target.value))
              }
              className="pr-22"
            />
          </InputAffix>
        </FormField>
        <FormField
          label={fields.deposit.label}
          error={fieldErrors?.depositMonths ?? fieldErrors?.deposit}
        >
          <div
            role="group"
            aria-label={fields.deposit.label}
            className="flex h-11 items-center overflow-hidden rounded-md border border-border-strong bg-background-subtle"
          >
            <button
              type="button"
              aria-label="Kaution verringern"
              disabled={draft.depositMonths <= 1}
              onClick={() => changeDepositMonths(draft.depositMonths - 1)}
              className="grid h-full w-10.5 cursor-pointer place-items-center text-foreground-secondary hover:bg-background-muted hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground-tertiary"
            >
              <AppIcon icon={Minus} size={16} strokeWidth={1.8} decorative />
            </button>
            <span className="min-w-0 flex-1 text-center font-display text-action font-medium tabular-nums text-foreground">
              {draft.depositMonths} Mon.
            </span>
            <span
              aria-hidden="true"
              className="font-mono text-meta text-foreground-tertiary"
            >
              |
            </span>
            <span className="min-w-0 flex-1 text-center font-display text-action font-medium tabular-nums text-foreground">
              {calculatedDeposit
                ? `${calculatedDeposit} €`
                : fields.deposit.empty}
            </span>
            <button
              type="button"
              aria-label="Kaution erhöhen"
              disabled={draft.depositMonths >= 3}
              onClick={() => changeDepositMonths(draft.depositMonths + 1)}
              className="grid h-full w-10.5 cursor-pointer place-items-center text-foreground-secondary hover:bg-background-muted hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground-tertiary"
            >
              <AppIcon icon={Plus} size={16} strokeWidth={1.8} decorative />
            </button>
          </div>
        </FormField>
      </div>

      <FormField label={fields.title.label}>
        <AutoTitleField
          override={draft.titleOverride}
          onOverrideChange={(value) => setField("titleOverride", value)}
        />
      </FormField>

      <FormField
        label={fields.description.label}
        labelTrailing={
          <span className={charClass}>
            {charCount} / {fields.description.warnAt}
          </span>
        }
        hint={fields.description.hint}
      >
        <Textarea
          rows={4}
          value={draft.description}
          placeholder={fields.description.placeholder}
          onChange={(e) =>
            setField(
              "description",
              e.target.value.slice(0, fields.description.maxLength),
            )
          }
        />
      </FormField>

      <FormField label={fields.photos.label}>
        <PhotoGrid photos={draft.photos} setPhotos={setPhotos} />
      </FormField>
    </SectionCard>
  );
}
