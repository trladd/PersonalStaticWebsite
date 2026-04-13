import {
  DEFAULT_ROAD_TRIP_APPEARANCE,
  RoadTripAppearanceSettings,
  ROAD_TRIP_MAP_STYLE_OPTIONS,
} from "./appearance";
import { estimateMilesFromWaypoints } from "./roadTripUtils";
import { RoadTrip, RoadTripCategory, RoadTripCoordinate, RoadTripWaypoint } from "./types";

export const ROAD_TRIPS_STORAGE_KEY = "roadTrips.savedTrips.v1";
export const ROAD_TRIPS_HOME_STORAGE_KEY = "roadTrips.homeBase.v1";
export const ROAD_TRIPS_APPEARANCE_STORAGE_KEY = "roadTrips.appearance.v1";

function isRoadTripCategory(value: unknown): value is RoadTripCategory {
  return value === "taken" || value === "wishlist";
}

function sanitizeWaypoint(value: unknown, index: number): RoadTripWaypoint | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<RoadTripWaypoint>;
  if (typeof candidate.latitude !== "number" || typeof candidate.longitude !== "number") {
    return null;
  }

  return {
    name:
      typeof candidate.name === "string" && candidate.name.trim()
        ? candidate.name.trim()
        : `Waypoint ${index + 1}`,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    state: typeof candidate.state === "string" ? candidate.state.trim() : "",
    notes: typeof candidate.notes === "string" ? candidate.notes : undefined,
  };
}

function sanitizePathCoordinates(value: unknown): RoadTripCoordinate[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const coordinates = value.filter(
    (item): item is RoadTripCoordinate =>
      Array.isArray(item) &&
      item.length === 2 &&
      typeof item[0] === "number" &&
      typeof item[1] === "number"
  );

  return coordinates.length >= 2 ? coordinates : undefined;
}

function isWaypoint(value: RoadTripWaypoint | null): value is RoadTripWaypoint {
  return value !== null;
}

function sanitizeTrip(value: unknown, index: number): RoadTrip | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<RoadTrip>;
  if (!isRoadTripCategory(candidate.category)) {
    return null;
  }

  const waypoints = Array.isArray(candidate.waypoints)
    ? candidate.waypoints
        .map((waypoint, waypointIndex) => sanitizeWaypoint(waypoint, waypointIndex))
        .filter(isWaypoint)
    : [];

  if (waypoints.length === 0) {
    return null;
  }

  return {
    id:
      typeof candidate.id === "string" && candidate.id.trim()
        ? candidate.id.trim()
        : `trip-${index + 1}`,
    name:
      typeof candidate.name === "string" && candidate.name.trim()
        ? candidate.name.trim()
        : `Trip ${index + 1}`,
    category: candidate.category,
    miles:
      typeof candidate.miles === "number" && Number.isFinite(candidate.miles) && candidate.miles > 0
        ? Math.round(candidate.miles)
        : estimateMilesFromWaypoints(waypoints),
    waypoints,
    statesCovered: Array.isArray(candidate.statesCovered)
      ? candidate.statesCovered.filter((state): state is string => typeof state === "string")
      : undefined,
    dateLabel: typeof candidate.dateLabel === "string" ? candidate.dateLabel : undefined,
    description: typeof candidate.description === "string" ? candidate.description : undefined,
    lineColor: typeof candidate.lineColor === "string" ? candidate.lineColor : undefined,
    pathCoordinates: sanitizePathCoordinates(candidate.pathCoordinates),
    routeSource:
      candidate.routeSource === "manual" ||
      candidate.routeSource === "osrm" ||
      candidate.routeSource === "straight-line"
        ? candidate.routeSource
        : undefined,
  };
}

export function loadSavedTrips(): RoadTrip[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ROAD_TRIPS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((trip, index) => sanitizeTrip(trip, index))
      .filter((trip): trip is RoadTrip => Boolean(trip));
  } catch (error) {
    return [];
  }
}

export function saveTrips(trips: RoadTrip[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ROAD_TRIPS_STORAGE_KEY, JSON.stringify(trips));
}

export function clearSavedTrips() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ROAD_TRIPS_STORAGE_KEY);
}

export function loadHomeBase(): RoadTripWaypoint | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(ROAD_TRIPS_HOME_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return sanitizeWaypoint(JSON.parse(raw), 0);
  } catch (error) {
    return null;
  }
}

export function saveHomeBase(homeBase: RoadTripWaypoint) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ROAD_TRIPS_HOME_STORAGE_KEY, JSON.stringify(homeBase));
}

export function clearHomeBase() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ROAD_TRIPS_HOME_STORAGE_KEY);
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value.trim());
}

function sanitizeAppearanceSettings(
  value: unknown
): RoadTripAppearanceSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_ROAD_TRIP_APPEARANCE;
  }

  const candidate = value as Partial<RoadTripAppearanceSettings>;
  const validMapStyles = new Set(ROAD_TRIP_MAP_STYLE_OPTIONS.map((option) => option.value));

  return {
    takenLineColor: isHexColor(candidate.takenLineColor)
      ? candidate.takenLineColor
      : DEFAULT_ROAD_TRIP_APPEARANCE.takenLineColor,
    wishlistLineColor: isHexColor(candidate.wishlistLineColor)
      ? candidate.wishlistLineColor
      : DEFAULT_ROAD_TRIP_APPEARANCE.wishlistLineColor,
    takenStateFillColor: isHexColor(candidate.takenStateFillColor)
      ? candidate.takenStateFillColor
      : DEFAULT_ROAD_TRIP_APPEARANCE.takenStateFillColor,
    takenStateBorderColor: isHexColor(candidate.takenStateBorderColor)
      ? candidate.takenStateBorderColor
      : DEFAULT_ROAD_TRIP_APPEARANCE.takenStateBorderColor,
    wishlistStateFillColor: isHexColor(candidate.wishlistStateFillColor)
      ? candidate.wishlistStateFillColor
      : DEFAULT_ROAD_TRIP_APPEARANCE.wishlistStateFillColor,
    wishlistStateBorderColor: isHexColor(candidate.wishlistStateBorderColor)
      ? candidate.wishlistStateBorderColor
      : DEFAULT_ROAD_TRIP_APPEARANCE.wishlistStateBorderColor,
    neutralStateFillColor: isHexColor(candidate.neutralStateFillColor)
      ? candidate.neutralStateFillColor
      : DEFAULT_ROAD_TRIP_APPEARANCE.neutralStateFillColor,
    neutralStateBorderColor: isHexColor(candidate.neutralStateBorderColor)
      ? candidate.neutralStateBorderColor
      : DEFAULT_ROAD_TRIP_APPEARANCE.neutralStateBorderColor,
    waypointBorderColor: isHexColor(candidate.waypointBorderColor)
      ? candidate.waypointBorderColor
      : DEFAULT_ROAD_TRIP_APPEARANCE.waypointBorderColor,
    mapStyle:
      candidate.mapStyle && validMapStyles.has(candidate.mapStyle)
        ? candidate.mapStyle
        : DEFAULT_ROAD_TRIP_APPEARANCE.mapStyle,
  };
}

export function loadAppearanceSettings(): RoadTripAppearanceSettings {
  if (typeof window === "undefined") {
    return DEFAULT_ROAD_TRIP_APPEARANCE;
  }

  try {
    const raw = window.localStorage.getItem(ROAD_TRIPS_APPEARANCE_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_ROAD_TRIP_APPEARANCE;
    }

    return sanitizeAppearanceSettings(JSON.parse(raw));
  } catch (error) {
    return DEFAULT_ROAD_TRIP_APPEARANCE;
  }
}

export function saveAppearanceSettings(settings: RoadTripAppearanceSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    ROAD_TRIPS_APPEARANCE_STORAGE_KEY,
    JSON.stringify(settings)
  );
}

export function clearAppearanceSettings() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ROAD_TRIPS_APPEARANCE_STORAGE_KEY);
}
