import { getCachedRoute, primeRouteCache } from "./routing";
import { estimateMilesFromWaypoints } from "./roadTripUtils";
import { sanitizeRoadTrip } from "./storage";
import { RoadTrip, RoadTripShowcaseConfig } from "./types";

export const ROAD_TRIP_MAIN_PAGE_SNAPSHOT_PATH =
  "/data/road-trip-main-page.json";
export const ROAD_TRIP_MAIN_PAGE_SNAPSHOT_REPO_PATH =
  "public/data/road-trip-main-page.json";

export const DEFAULT_ROAD_TRIP_MAIN_PAGE_SNAPSHOT_META = {
  title: "Road Trip Snapshot",
  intro:
    "A live snapshot from my own road-trip atlas, mixing completed drives with a few future routes I still want to make happen.",
};

function parseSnapshotPayload(raw: string): unknown {
  const trimmed = raw.trim();

  if (!trimmed || trimmed === "undefined") {
    throw new Error(
      `Main-page road trip snapshot is empty or invalid. Check ${ROAD_TRIP_MAIN_PAGE_SNAPSHOT_REPO_PATH}.`,
    );
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch (error) {
    throw new Error(
      `Main-page road trip snapshot is not valid JSON. Check ${ROAD_TRIP_MAIN_PAGE_SNAPSHOT_REPO_PATH}.`,
    );
  }
}

function sanitizeSnapshotTrips(value: unknown): RoadTrip[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((trip, index) => sanitizeRoadTrip(trip, index))
    .filter((trip): trip is RoadTrip => Boolean(trip));
}

export function sanitizeRoadTripShowcaseConfig(
  value: unknown,
): RoadTripShowcaseConfig | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<RoadTripShowcaseConfig>;
  const trips = sanitizeSnapshotTrips(candidate.trips);

  if (trips.length === 0) {
    return null;
  }

  return {
    title:
      typeof candidate.title === "string" && candidate.title.trim()
        ? candidate.title.trim()
        : DEFAULT_ROAD_TRIP_MAIN_PAGE_SNAPSHOT_META.title,
    intro:
      typeof candidate.intro === "string" && candidate.intro.trim()
        ? candidate.intro.trim()
        : DEFAULT_ROAD_TRIP_MAIN_PAGE_SNAPSHOT_META.intro,
    trips,
  };
}

export function primeRouteCacheFromTrips(trips: RoadTrip[]) {
  primeRouteCache(
    trips
      .filter((trip) => (trip.pathCoordinates?.length ?? 0) >= 2)
      .map((trip) => ({
        waypoints: trip.waypoints,
        route: {
          miles:
            trip.miles > 0
              ? trip.miles
              : estimateMilesFromWaypoints(trip.waypoints),
          pathCoordinates: trip.pathCoordinates ?? [],
          routeSource: "osrm" as const,
        },
      })),
  );
}

export function buildRoadTripShowcaseSnapshot({
  title = DEFAULT_ROAD_TRIP_MAIN_PAGE_SNAPSHOT_META.title,
  intro = DEFAULT_ROAD_TRIP_MAIN_PAGE_SNAPSHOT_META.intro,
  trips,
}: {
  title?: string;
  intro?: string;
  trips: RoadTrip[];
}): RoadTripShowcaseConfig {
  return {
    title,
    intro,
    trips: trips.map((trip) => {
      const cachedRoute = getCachedRoute(trip.waypoints);

      return {
        ...trip,
        pathCoordinates: cachedRoute?.pathCoordinates ?? trip.pathCoordinates,
        routeSource:
          cachedRoute?.routeSource ??
          (trip.pathCoordinates?.length ? "osrm" : trip.routeSource),
        miles:
          trip.miles > 0
            ? trip.miles
            : (cachedRoute?.miles ??
              estimateMilesFromWaypoints(trip.waypoints)),
      };
    }),
  };
}

export async function fetchRoadTripMainPageSnapshot({
  cache = "default",
}: {
  cache?: RequestCache;
} = {}): Promise<RoadTripShowcaseConfig> {
  const response = await fetch(ROAD_TRIP_MAIN_PAGE_SNAPSHOT_PATH, {
    cache,
  });

  if (!response.ok) {
    throw new Error(`Snapshot request failed with status ${response.status}.`);
  }

  const payload = parseSnapshotPayload(await response.text());
  const config = sanitizeRoadTripShowcaseConfig(payload);

  if (!config) {
    throw new Error("Snapshot data was not in the expected format.");
  }

  primeRouteCacheFromTrips(config.trips);
  return config;
}
