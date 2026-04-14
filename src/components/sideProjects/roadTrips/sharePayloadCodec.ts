import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { RoadTrip } from "./types";

export type ShareableRoadTripPayload = {
  version: number;
  trip: RoadTrip;
};

type UnknownRecord = Record<string, unknown>;

const TOKEN_ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// IMPORTANT:
// The order of these keys is part of the public road-trip share format.
// Only append new keys so older links remain decodable.
const SHARE_PAYLOAD_KEY_ORDER = [
  "version",
  "trip",
  "id",
  "name",
  "category",
  "miles",
  "isShared",
  "waypoints",
  "statesCovered",
  "dateLabel",
  "description",
  "lineColor",
  "routeSource",
  "latitude",
  "longitude",
  "state",
  "notes",
] as const;

const buildTokenForIndex = (index: number) => {
  let current = index;
  let token = "";

  do {
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

export const minifyRoadTripSharePayloadKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(minifyRoadTripSharePayloadKeys);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      KEY_TO_TOKEN[key as keyof typeof KEY_TO_TOKEN] ?? key,
      minifyRoadTripSharePayloadKeys(nestedValue),
    ]),
  );
};

export const expandRoadTripSharePayloadKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(expandRoadTripSharePayloadKeys);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      TOKEN_TO_KEY[key] ?? key,
      expandRoadTripSharePayloadKeys(nestedValue),
    ]),
  );
};

export const compressRoadTripSharePayload = (
  payload: ShareableRoadTripPayload,
) =>
  compressToEncodedURIComponent(
    JSON.stringify(minifyRoadTripSharePayloadKeys(payload)),
  );

export const decompressRoadTripSharePayload = (
  compressedPayload: string,
): ShareableRoadTripPayload | null => {
  try {
    const decompressed = decompressFromEncodedURIComponent(compressedPayload);
    if (!decompressed) {
      return null;
    }

    return expandRoadTripSharePayloadKeys(
      JSON.parse(decompressed),
    ) as ShareableRoadTripPayload;
  } catch (error) {
    return null;
  }
};
