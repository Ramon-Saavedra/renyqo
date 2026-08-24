import type { ChecklistItem } from "@/components/ui/checklist/CompletionChecklist";
import type { ListingExtractionResult } from "@/lib/api/listing-assistance";
import { createListingCopy } from "../copy/create-listing";
import type { ExtractionFieldDescriptor } from "./listingExtractionMapping";
import {
  mapBackendFieldToTargetId,
  mapInconsistencyLabel,
} from "./listingExtractionMapping";

interface ExtractionChecklistDefinition extends ChecklistItem {
  readonly field: string;
}

const missingLabels = createListingCopy.missingLabels;
const fieldLabels = createListingCopy.aiCapture.fieldLabels;
const requirementsFields = createListingCopy.requirements.fields;
const objektdatenFields = createListingCopy.objektdaten.fields;

export const EXTRACTION_REQUIRED_CHECKLIST_ITEMS: readonly ExtractionChecklistDefinition[] =
  [
    { field: "city", label: missingLabels.city, targetId: "city" },
    { field: "zip", label: missingLabels.zip, targetId: "zip" },
    { field: "street", label: missingLabels.street, targetId: "street" },
    { field: "objectType", label: fieldLabels.objectType, targetId: "sec-01" },
    { field: "livingArea", label: missingLabels.area, targetId: "area" },
    { field: "rooms", label: missingLabels.rooms, targetId: "rooms" },
    { field: "bedrooms", label: missingLabels.bedrooms, targetId: "bedrooms" },
    { field: "coldRent", label: missingLabels.price, targetId: "price" },
    {
      field: "availableFrom",
      label: missingLabels.availableFrom,
      targetId: "available-from",
    },
  ] as const;

export const EXTRACTION_RECOMMENDED_CHECKLIST_ITEMS: readonly ExtractionChecklistDefinition[] =
  [
    {
      field: "minimumHouseholdNetIncome",
      label: requirementsFields.minIncome.label,
      targetId: "min-income",
    },
    {
      field: "schufaRequired",
      label: requirementsFields.schufa.label,
      targetId: "schufa-required",
    },
    {
      field: "incomeProofRequired",
      label: requirementsFields.income.label,
      targetId: "income-proof-required",
    },
    {
      field: "suitableForPeopleCount",
      label: requirementsFields.peopleCount.label,
      targetId: "people-count",
    },
    {
      field: "petsPolicy",
      label: requirementsFields.pets.label,
      targetId: "pets-policy",
    },
    {
      field: "smokingPolicy",
      label: requirementsFields.smoking.label,
      targetId: "smoking-policy",
    },
  ] as const;

export const EXTRACTION_OPTIONAL_CHECKLIST_ITEMS: readonly ExtractionChecklistDefinition[] =
  [
    {
      field: "additionalCosts",
      label: fieldLabels.additionalCosts,
      targetId: "additional-costs",
    },
    {
      field: "depositMonths",
      label: fieldLabels.depositMonths,
      targetId: "deposit-months",
    },
  ] as const;

export const POST_APPLY_CHECKLIST_ITEMS: readonly ChecklistItem[] = [
  {
    label: objektdatenFields.photos.label,
    targetId: "listing-photos",
  },
  {
    label: objektdatenFields.description.label,
    targetId: "listing-description",
  },
] as const;

function labelsForFields(
  fields: readonly string[],
  definitions: readonly ExtractionChecklistDefinition[],
): string[] {
  const labelByField = new Map(
    definitions.map((definition) => [definition.field, definition.label]),
  );
  return fields
    .map((field) => labelByField.get(field))
    .filter((label): label is string => label !== undefined);
}

function toChecklistItems(
  definitions: readonly ExtractionChecklistDefinition[],
): ChecklistItem[] {
  return definitions.map(({ label, targetId }) => ({ label, targetId }));
}

export interface ExtractionChecklistState {
  readonly required: {
    readonly items: ChecklistItem[];
    readonly missing: string[];
    readonly complete: boolean;
  };
  readonly recommended: {
    readonly items: ChecklistItem[];
    readonly missing: string[];
    readonly complete: boolean;
  };
  readonly check: {
    readonly items: ChecklistItem[];
    readonly missing: string[];
    readonly complete: boolean;
  };
  readonly optional: {
    readonly items: ChecklistItem[];
    readonly missing: string[];
    readonly complete: boolean;
  };
}

function missingLabelsForRecognizedFields(
  definitions: readonly ExtractionChecklistDefinition[],
  recognizedKeys: ReadonlySet<string>,
  backendMissingFields: readonly string[],
): string[] {
  const missing = new Set<string>();
  for (const definition of definitions) {
    if (!recognizedKeys.has(definition.field)) {
      missing.add(definition.label);
    }
  }
  for (const label of labelsForFields(backendMissingFields, definitions)) {
    missing.add(label);
  }
  return [...missing];
}

export function buildExtractionChecklistState(
  result: ListingExtractionResult,
  descriptors: readonly ExtractionFieldDescriptor[],
): ExtractionChecklistState {
  const recognizedKeys = new Set(
    descriptors.map((descriptor) => descriptor.key),
  );
  const requiredMissing = missingLabelsForRecognizedFields(
    EXTRACTION_REQUIRED_CHECKLIST_ITEMS,
    recognizedKeys,
    result.requiredMissingFields,
  );
  const recommendedMissing = missingLabelsForRecognizedFields(
    EXTRACTION_RECOMMENDED_CHECKLIST_ITEMS,
    recognizedKeys,
    result.recommendedMissingFields,
  );
  const optionalMissing = labelsForFields(
    result.recommendedMissingFields,
    EXTRACTION_OPTIONAL_CHECKLIST_ITEMS,
  );
  const checkItems: ChecklistItem[] = Array.from(
    new Map(
      result.inconsistencies.map((issue) => [
        issue.field,
        {
          label: mapInconsistencyLabel(issue),
          targetId: mapBackendFieldToTargetId(issue.field) ?? "sec-01",
        },
      ]),
    ).values(),
  );
  const checkMissing = checkItems.map((item) => item.label);

  return {
    required: {
      items: toChecklistItems(EXTRACTION_REQUIRED_CHECKLIST_ITEMS),
      missing: requiredMissing,
      complete: requiredMissing.length === 0,
    },
    recommended: {
      items: toChecklistItems(EXTRACTION_RECOMMENDED_CHECKLIST_ITEMS),
      missing: recommendedMissing,
      complete: recommendedMissing.length === 0,
    },
    check: {
      items: checkItems,
      missing: checkMissing,
      complete: checkMissing.length === 0,
    },
    optional: {
      items: toChecklistItems(EXTRACTION_OPTIONAL_CHECKLIST_ITEMS),
      missing: optionalMissing,
      complete: optionalMissing.length === 0,
    },
  };
}

export function buildPostApplyChecklistState(
  hasPhotos: boolean,
  hasDescription: boolean,
): {
  readonly items: ChecklistItem[];
  readonly missing: string[];
  readonly complete: boolean;
} {
  const missing = POST_APPLY_CHECKLIST_ITEMS.filter((item) => {
    if (item.targetId === "listing-photos") return !hasPhotos;
    if (item.targetId === "listing-description") return !hasDescription;
    return false;
  }).map((item) => item.label);

  return {
    items: [...POST_APPLY_CHECKLIST_ITEMS],
    missing,
    complete: missing.length === 0,
  };
}

export function countRecognizedFields(
  descriptors: readonly ExtractionFieldDescriptor[],
): number {
  return descriptors.length;
}
