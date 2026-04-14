import {
  RoadTrip,
  RoadTripCategory,
  RoadTripCoordinate,
  RoadTripWaypoint,
} from "./types";
import usStatesGeoJson from "./data/us-states.json";
import canadaRegionsGeoJson from "./data/canada-regions.json";
import mexicoRegionsGeoJson from "./data/mexico-regions.json";

export const STATE_NAME_BY_CODE: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

interface SupportedRegionFeatureProperties {
  name: string;
  regionCode: string;
  countryCode: string;
  type?: string;
}

export const CANADA_REGION_NAME_BY_CODE: Record<string, string> =
  Object.fromEntries(
    (
      canadaRegionsGeoJson.features as Array<{
        properties: SupportedRegionFeatureProperties;
      }>
    ).map((feature) => [
      feature.properties.regionCode,
      feature.properties.name,
    ]),
  );

export const MEXICO_REGION_NAME_BY_CODE: Record<string, string> =
  Object.fromEntries(
    (
      mexicoRegionsGeoJson.features as Array<{
        properties: SupportedRegionFeatureProperties;
      }>
    ).map((feature) => [
      feature.properties.regionCode,
      feature.properties.name,
    ]),
  );

export const REGION_NAME_BY_CODE: Record<string, string> = {
  ...STATE_NAME_BY_CODE,
  ...CANADA_REGION_NAME_BY_CODE,
  ...MEXICO_REGION_NAME_BY_CODE,
};

function normalizeLookupKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildRegionLookupEntries(): Array<[string, string]> {
  const usEntries = Object.entries(STATE_NAME_BY_CODE).flatMap(
    ([code, name]) => [
      [normalizeLookupKey(code), code] as [string, string],
      [normalizeLookupKey(name), code] as [string, string],
    ],
  );
  const canadaEntries = Object.entries(CANADA_REGION_NAME_BY_CODE).flatMap(
    ([code, name]) => [
      [normalizeLookupKey(code), code] as [string, string],
      [normalizeLookupKey(code.replace(/^CA-/, "")), code] as [string, string],
      [normalizeLookupKey(name), code] as [string, string],
    ],
  );
  const mexicoEntries = Object.entries(MEXICO_REGION_NAME_BY_CODE).flatMap(
    ([code, name]) => [
      [normalizeLookupKey(code), code] as [string, string],
      [normalizeLookupKey(code.replace(/^MX-/, "")), code] as [string, string],
      [normalizeLookupKey(name), code] as [string, string],
    ],
  );

  return [...usEntries, ...canadaEntries, ...mexicoEntries];
}

const STATE_CODE_BY_NAME = buildRegionLookupEntries().reduce<
  Record<string, string>
>((acc, [lookupKey, code]) => {
  acc[lookupKey] = code;
  return acc;
}, {});

const CATEGORY_LABELS: Record<RoadTripCategory, string> = {
  taken: "Trips Taken",
  wishlist: "Trip Wishlist",
};

const TRACKED_STATE_CODES = Object.keys(STATE_NAME_BY_CODE).filter(
  (code) => code !== "DC",
);
const routeStateCodeCache = new WeakMap<RoadTripCoordinate[], string[]>();

type GeoJsonRing = [number, number][];
type GeoJsonPolygon = GeoJsonRing[];
type GeoJsonGeometry =
  | {
      type: "Polygon";
      coordinates: GeoJsonPolygon;
    }
  | {
      type: "MultiPolygon";
      coordinates: GeoJsonPolygon[];
    };

interface IndexedStateGeometry {
  code: string;
  name: string;
  geometry: GeoJsonGeometry;
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
}

interface SupportedGeoJsonFeature {
  properties?: {
    name?: string;
    regionCode?: string;
  };
  geometry?: GeoJsonGeometry;
}

function computeBoundingBox(coordinates: GeoJsonPolygon[] | GeoJsonPolygon) {
  const polygons = Array.isArray(coordinates[0]?.[0]?.[0])
    ? (coordinates as GeoJsonPolygon[])
    : [coordinates as GeoJsonPolygon];

  let minLatitude = Number.POSITIVE_INFINITY;
  let maxLatitude = Number.NEGATIVE_INFINITY;
  let minLongitude = Number.POSITIVE_INFINITY;
  let maxLongitude = Number.NEGATIVE_INFINITY;

  polygons.forEach((polygon) => {
    polygon.forEach((ring) => {
      ring.forEach(([longitude, latitude]) => {
        minLatitude = Math.min(minLatitude, latitude);
        maxLatitude = Math.max(maxLatitude, latitude);
        minLongitude = Math.min(minLongitude, longitude);
        maxLongitude = Math.max(maxLongitude, longitude);
      });
    });
  });

  return {
    minLatitude,
    maxLatitude,
    minLongitude,
    maxLongitude,
  };
}

function indexRegionGeometries(
  features: SupportedGeoJsonFeature[],
): IndexedStateGeometry[] {
  return features
    .map((feature) => {
      const name = String(feature?.properties?.name ?? "");
      const rawRegionCode = String(feature?.properties?.regionCode ?? name);
      const code = normalizeStateCode(rawRegionCode);
      const geometry = feature?.geometry as GeoJsonGeometry | undefined;

      if (
        !code ||
        !geometry ||
        (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")
      ) {
        return null;
      }

      const bounds = computeBoundingBox(geometry.coordinates as any);

      return {
        code,
        name,
        geometry,
        ...bounds,
      };
    })
    .filter(Boolean) as IndexedStateGeometry[];
}

const indexedStateGeometries: IndexedStateGeometry[] = [
  ...indexRegionGeometries(
    usStatesGeoJson.features as unknown as SupportedGeoJsonFeature[],
  ),
  ...indexRegionGeometries(
    canadaRegionsGeoJson.features as unknown as SupportedGeoJsonFeature[],
  ),
  ...indexRegionGeometries(
    mexicoRegionsGeoJson.features as unknown as SupportedGeoJsonFeature[],
  ),
];

export function getCategoryLabel(category: RoadTripCategory): string {
  return CATEGORY_LABELS[category];
}

export function getTrackedStateCodes(): string[] {
  return TRACKED_STATE_CODES;
}

export function normalizeStateCode(input: string): string | null {
  const lookupKey = normalizeLookupKey(input);
  if (!lookupKey) {
    return null;
  }

  const upper = input.trim().toUpperCase();
  if (REGION_NAME_BY_CODE[upper]) {
    return upper;
  }

  return STATE_CODE_BY_NAME[lookupKey] ?? null;
}

export function isTrackedUsStateCode(code: string): boolean {
  return TRACKED_STATE_CODES.includes(code);
}

function isPointInRing(
  latitude: number,
  longitude: number,
  ring: GeoJsonRing,
): boolean {
  let isInside = false;

  for (
    let currentIndex = 0, previousIndex = ring.length - 1;
    currentIndex < ring.length;
    previousIndex = currentIndex, currentIndex += 1
  ) {
    const [currentLongitude, currentLatitude] = ring[currentIndex];
    const [previousLongitude, previousLatitude] = ring[previousIndex];

    const crossesLatitudeBand =
      (currentLatitude > latitude) !== (previousLatitude > latitude);
    const intersectionLongitude =
      ((previousLongitude - currentLongitude) * (latitude - currentLatitude)) /
        (previousLatitude - currentLatitude || Number.EPSILON) +
      currentLongitude;
    const intersects = crossesLatitudeBand && longitude < intersectionLongitude;

    if (intersects) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function isPointInPolygon(
  latitude: number,
  longitude: number,
  polygon: GeoJsonPolygon,
): boolean {
  if (!polygon.length || !isPointInRing(latitude, longitude, polygon[0])) {
    return false;
  }

  for (let ringIndex = 1; ringIndex < polygon.length; ringIndex += 1) {
    if (isPointInRing(latitude, longitude, polygon[ringIndex])) {
      return false;
    }
  }

  return true;
}

export function deriveStateCodesFromCoordinates(
  coordinates: RoadTripCoordinate[],
): string[] {
  if (coordinates.length === 0) {
    return [];
  }

  const cached = routeStateCodeCache.get(coordinates);
  if (cached) {
    return cached;
  }

  const foundStateCodes = new Set<string>();

  coordinates.forEach(([latitude, longitude]) => {
    indexedStateGeometries.forEach((stateGeometry) => {
      if (
        latitude < stateGeometry.minLatitude ||
        latitude > stateGeometry.maxLatitude ||
        longitude < stateGeometry.minLongitude ||
        longitude > stateGeometry.maxLongitude
      ) {
        return;
      }

      const polygons =
        stateGeometry.geometry.type === "Polygon"
          ? [stateGeometry.geometry.coordinates]
          : stateGeometry.geometry.coordinates;

      if (
        polygons.some((polygon) =>
          isPointInPolygon(latitude, longitude, polygon),
        )
      ) {
        foundStateCodes.add(stateGeometry.code);
      }
    });
  });

  const derivedStates = Array.from(foundStateCodes);
  routeStateCodeCache.set(coordinates, derivedStates);
  return derivedStates;
}

export function getTripRegionCodes(trip: RoadTrip): string[] {
  const rawStates = [
    ...(trip.statesCovered ?? []),
    ...trip.waypoints.map((waypoint) => waypoint.state),
    ...(trip.pathCoordinates
      ? deriveStateCodesFromCoordinates(trip.pathCoordinates)
      : []),
  ];

  return Array.from(
    new Set(rawStates.map(normalizeStateCode).filter(Boolean)),
  ) as string[];
}

export function getTripStateCodes(trip: RoadTrip): string[] {
  return getTripRegionCodes(trip).filter(isTrackedUsStateCode);
}

export function getTripAdditionalRegionCodes(trip: RoadTrip): string[] {
  return getTripRegionCodes(trip).filter((code) => !isTrackedUsStateCode(code));
}

export function getTripStateNames(trip: RoadTrip): string[] {
  return getTripStateCodes(trip)
    .map((code) => STATE_NAME_BY_CODE[code])
    .filter(Boolean);
}

export function getTripRegionNames(trip: RoadTrip): string[] {
  return getTripRegionCodes(trip)
    .map((code) => REGION_NAME_BY_CODE[code])
    .filter(Boolean);
}

export function getTripAdditionalRegionNames(trip: RoadTrip): string[] {
  return getTripAdditionalRegionCodes(trip)
    .map((code) => REGION_NAME_BY_CODE[code])
    .filter(Boolean);
}

export function getTripRenderCoordinates(trip: RoadTrip): RoadTripCoordinate[] {
  if (trip.pathCoordinates && trip.pathCoordinates.length >= 2) {
    return trip.pathCoordinates;
  }

  return trip.waypoints.map(
    (waypoint) => [waypoint.latitude, waypoint.longitude] as RoadTripCoordinate,
  );
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function calculateSegmentMiles(
  start: RoadTripCoordinate,
  end: RoadTripCoordinate,
): number {
  const earthRadiusMiles = 3958.7613;
  const [startLatitude, startLongitude] = start;
  const [endLatitude, endLongitude] = end;
  const latitudeDelta = toRadians(endLatitude - startLatitude);
  const longitudeDelta = toRadians(endLongitude - startLongitude);
  const startLatitudeRadians = toRadians(startLatitude);
  const endLatitudeRadians = toRadians(endLatitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(startLatitudeRadians) *
      Math.cos(endLatitudeRadians) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);
  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadiusMiles * arc;
}

export function estimateMilesFromCoordinates(
  coordinates: RoadTripCoordinate[],
): number {
  if (coordinates.length < 2) {
    return 0;
  }

  let miles = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    miles += calculateSegmentMiles(coordinates[index - 1], coordinates[index]);
  }

  return Math.round(miles);
}

export function estimateMilesFromWaypoints(
  waypoints: RoadTripWaypoint[],
): number {
  return estimateMilesFromCoordinates(
    waypoints.map(
      (waypoint) =>
        [waypoint.latitude, waypoint.longitude] as RoadTripCoordinate,
    ),
  );
}

export interface RoadTripCategorySummary {
  category: RoadTripCategory;
  label: string;
  tripCount: number;
  totalMiles: number;
  statesVisited: string[];
  additionalRegionsVisited: string[];
}

export interface RoadTripSummary {
  totalTrips: number;
  totalMiles: number;
  totalStatesVisited: string[];
  totalAdditionalRegionsVisited: string[];
  taken: RoadTripCategorySummary;
  wishlist: RoadTripCategorySummary;
}

function summarizeCategory(
  trips: RoadTrip[],
  category: RoadTripCategory,
): RoadTripCategorySummary {
  const categoryTrips = trips.filter((trip) => trip.category === category);
  const statesVisited = Array.from(
    new Set(categoryTrips.flatMap((trip) => getTripStateCodes(trip))),
  );
  const additionalRegionsVisited = Array.from(
    new Set(
      categoryTrips.flatMap((trip) => getTripAdditionalRegionCodes(trip)),
    ),
  );

  return {
    category,
    label: getCategoryLabel(category),
    tripCount: categoryTrips.length,
    totalMiles: categoryTrips.reduce((sum, trip) => sum + trip.miles, 0),
    statesVisited,
    additionalRegionsVisited,
  };
}

export function summarizeRoadTrips(trips: RoadTrip[]): RoadTripSummary {
  const taken = summarizeCategory(trips, "taken");
  const wishlist = summarizeCategory(trips, "wishlist");

  return {
    totalTrips: trips.length,
    totalMiles: trips.reduce((sum, trip) => sum + trip.miles, 0),
    totalStatesVisited: Array.from(
      new Set(trips.flatMap((trip) => getTripStateCodes(trip))),
    ),
    totalAdditionalRegionsVisited: Array.from(
      new Set(trips.flatMap((trip) => getTripAdditionalRegionCodes(trip))),
    ),
    taken,
    wishlist,
  };
}

export interface StateCoverage {
  taken: boolean;
  wishlist: boolean;
}

export function buildStateCoverage(
  trips: RoadTrip[],
): Record<string, StateCoverage> {
  return trips.reduce<Record<string, StateCoverage>>((acc, trip) => {
    getTripRegionCodes(trip).forEach((stateCode) => {
      const current = acc[stateCode] ?? { taken: false, wishlist: false };
      current[trip.category] = true;
      acc[stateCode] = current;
    });
    return acc;
  }, {});
}

export interface StateCompletionSummary {
  totalStates: number;
  visitedCount: number;
  remainingCount: number;
  completionPercent: number;
  visitedStateCodes: string[];
  remainingStateCodes: string[];
}

export function summarizeStateCompletion(
  visitedStateCodes: string[],
): StateCompletionSummary {
  const normalizedVisited = Array.from(
    new Set(
      visitedStateCodes
        .map(normalizeStateCode)
        .filter((code): code is string => typeof code === "string")
        .filter((code) => TRACKED_STATE_CODES.includes(code)),
    ),
  );

  const remainingStateCodes = TRACKED_STATE_CODES.filter(
    (code) => !normalizedVisited.includes(code),
  );

  return {
    totalStates: TRACKED_STATE_CODES.length,
    visitedCount: normalizedVisited.length,
    remainingCount: remainingStateCodes.length,
    completionPercent:
      TRACKED_STATE_CODES.length === 0
        ? 0
        : Math.round(
            (normalizedVisited.length / TRACKED_STATE_CODES.length) * 100,
          ),
    visitedStateCodes: normalizedVisited,
    remainingStateCodes,
  };
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
