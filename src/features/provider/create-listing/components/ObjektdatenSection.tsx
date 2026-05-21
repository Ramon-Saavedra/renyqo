"use client";

import { Building2, DoorOpen, Home } from "lucide-react";
import { CardCheckbox } from "@/components/ui/form/CardCheckbox";
import { FormField } from "@/components/ui/form/FormField";
import { Input } from "@/components/ui/form/Input";
import { InputAffix } from "@/components/ui/form/InputAffix";
import { NumberStepper } from "@/components/ui/form/NumberStepper";
import { Segmented } from "@/components/ui/form/Segmented";
import { Select } from "@/components/ui/form/Select";
import { Textarea } from "@/components/ui/form/Textarea";
import {
  createListingCopy,
  type ObjectType,
  type RoomOption,
  ROOM_OPTIONS,
} from "../copy/create-listing";
import type { ListingDraft, ListingPhoto } from "../hooks/useListingDraft";
import { useAutoTitle } from "../hooks/useAutoTitle";
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
}

const OBJECT_TYPE_ICONS = {
  wohnung: Building2,
  haus: Home,
  zimmer: DoorOpen,
} as const;

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export function ObjektdatenSection({
  draft,
  setField,
  setPhotos,
}: ObjektdatenSectionProps) {
  const copy = createListingCopy.objektdaten;
  const fields = copy.fields;
  const { autoTitle, isAutoPlaceholder } = useAutoTitle({
    objectType: draft.objectType,
    rooms: draft.rooms,
    address: draft.address,
  });

  const charCount = draft.description.length;
  const isOverWarn = charCount > fields.description.warnAt;
  const charClass = `font-mono text-meta tabular-nums${isOverWarn ? " text-warning" : " text-foreground-tertiary"}`;

  return (
    <SectionCard
      id="sec-01"
      num={copy.num}
      title={copy.title}
      description={copy.description}
    >
      <FormField label={fields.address.label} htmlFor="address" required>
        <Input
          id="address"
          value={draft.address}
          placeholder={fields.address.placeholder}
          onChange={(e) => setField("address", e.target.value)}
        />
        <CardCheckbox
          id="hide-address"
          checked={draft.hideAddress}
          onChange={(value) => setField("hideAddress", value)}
          description={fields.hideAddress.sub}
        >
          {fields.hideAddress.label}
        </CardCheckbox>
      </FormField>

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
        <FormField label={fields.area.label} htmlFor="area" required>
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

        <FormField label={fields.rooms.label} htmlFor="rooms" required>
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

        <FormField label={fields.bedrooms.label}>
          <NumberStepper
            value={draft.bedrooms}
            onChange={(value) => setField("bedrooms", value)}
            min={0}
            max={10}
            allowNull
            ariaLabel={fields.bedrooms.label}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={fields.price.label} htmlFor="price" required>
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
        >
          <Input
            id="available-from"
            type="date"
            value={draft.availableFrom}
            onChange={(e) => setField("availableFrom", e.target.value)}
          />
        </FormField>
      </div>

      <FormField label={fields.title.label}>
        <AutoTitleField
          autoTitle={autoTitle}
          isAutoPlaceholder={isAutoPlaceholder}
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
