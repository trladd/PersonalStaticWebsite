import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { CustomVehicle, PersistedCarCostState } from "../types";

export type ShareableCarCostPayload = {
  version: number;
  state: PersistedCarCostState;
  savedCustomVehicle: CustomVehicle | null;
};

type UnknownRecord = Record<string, unknown>;

const TOKEN_ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// IMPORTANT:
// The order of these keys is part of the public share format.
// Once a key is assigned a token, that token must stay stable forever so
// existing shared URLs can still be decoded correctly in future versions.
// Always append new keys to the end of this list. Do not reorder, delete, or
// reuse an old token for a different key, even if that older field stops being
// used, because shared URLs may still exist in the wild.
const SHARE_PAYLOAD_KEY_ORDER = [
  "version",
  "state",
  "savedCustomVehicle",
  "isSharedSession",
  "selectedSource",
  "selectedTemplateId",
  "values",
  "recurringType",
  "tripType",
  "updatedAt",
  "id",
  "year",
  "make",
  "model",
  "title",
  "fuelType",
  "fuelEfficiency",
  "fuelUnitPrice",
  "oilChangeCost",
  "oilChangeInterval",
  "tireCost",
  "tireInterval",
  "miscMaintenanceCost",
  "miscMaintenanceBasis",
  "miscMaintenanceInterval",
  "depreciationBasis",
  "purchasePrice",
  "resaleValue",
  "depreciationInterval",
  "tripDistance",
  "recurringMiles",
  "annualInsurance",
  "annualRegistration",
  "annualParking",
  "annualInspection",
  "annualRoadside",
  "loanDownPayment",
  "loanApr",
  "loanTermMonths",
  "loanMonthlyPayment",
  "loanPaymentMode",
  "includeVehicleCost",
  "includeDepreciation",
  "includeAnnualOwnership",
  "includeFinancing",
  "trim",
] as const;

const buildTokenForIndex = (index: number) => {
  let current = index;
  let token = "";

  do {
    // This yields tokens in length order: all 1-character tokens first,
    // then 2-character combinations, then 3-character combinations, and so on.
    token = TOKEN_ALPHABET[current % TOKEN_ALPHABET.length] + token;
    current = Math.floor(current / TOKEN_ALPHABET.length) - 1;
  } while (current >= 0);

  return token;
};

const KEY_TO_TOKEN = Object.fromEntries(
  SHARE_PAYLOAD_KEY_ORDER.map((key, index) => [key, buildTokenForIndex(index)]),
) as Record<(typeof SHARE_PAYLOAD_KEY_ORDER)[number], string>;

const TOKEN_TO_KEY = Object.fromEntries(
  Object.entries(KEY_TO_TOKEN).map(([key, token]) => [token, key]),
) as Record<string, (typeof SHARE_PAYLOAD_KEY_ORDER)[number]>;

const isPlainObject = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const minifySharePayloadKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(minifySharePayloadKeys);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      KEY_TO_TOKEN[key as keyof typeof KEY_TO_TOKEN] ?? key,
      minifySharePayloadKeys(nestedValue),
    ]),
  );
};

export const expandSharePayloadKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(expandSharePayloadKeys);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      TOKEN_TO_KEY[key] ?? key,
      expandSharePayloadKeys(nestedValue),
    ]),
  );
};

export const compressSharePayload = (payload: ShareableCarCostPayload) =>
  compressToEncodedURIComponent(
    JSON.stringify(minifySharePayloadKeys(payload)),
  );

export const decompressSharePayload = (
  compressedPayload: string,
): ShareableCarCostPayload | null => {
  try {
    const decompressed = decompressFromEncodedURIComponent(compressedPayload);

    if (!decompressed) {
      return null;
    }

    return expandSharePayloadKeys(
      JSON.parse(decompressed),
    ) as ShareableCarCostPayload;
  } catch (error) {
    return null;
  }
};

export const getStableShareKeyToken = (
  key: (typeof SHARE_PAYLOAD_KEY_ORDER)[number],
) => KEY_TO_TOKEN[key];
