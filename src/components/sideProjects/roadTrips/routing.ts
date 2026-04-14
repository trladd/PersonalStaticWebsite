import { compressToUTF16, decompressFromUTF16 } from "lz-string";
import { ROAD_TRIPS_ROUTE_CACHE_STORAGE_KEY } from "./storage";
import { RoadTripCoordinate, RoadTripWaypoint } from "./types";

const OSRM_ROUTE_ENDPOINT = "https://router.project-osrm.org/route/v1/driving";
const MAX_WAYPOINTS_PER_REQUEST = 20;
const REQUEST_DELAY_MS = 1050;
const MAX_PERSISTED_ROUTE_CACHE_ENTRIES = 320;
const COMPRESSED_ROUTE_CACHE_PREFIX = "lz:";
const routeCache = new Map<string, CachedRoute>();
let hasHydratedRouteCache = false;

interface OsrmRouteResponse {
  code: string;
  routes?: {
    distance: number;
    geometry?: {
      coordinates: [number, number][];
    };
  }[];
}

interface CachedRoute {
  miles: number;
  pathCoordinates: RoadTripCoordinate[];
}

interface PersistedRouteCacheEntry {
  key: string;
  miles: number;
  pathCoordinates: RoadTripCoordinate[];
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(5));
}

function normalizePathCoordinates(
  pathCoordinates: RoadTripCoordinate[],
): RoadTripCoordinate[] {
  return pathCoordinates.map(([latitude, longitude]) => [
    roundCoordinate(latitude),
    roundCoordinate(longitude),
  ]);
}

export interface ResolvedRoute {
  miles: number;
  pathCoordinates: RoadTripCoordinate[];
  routeSource: "osrm";
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function sanitizePathCoordinates(value: unknown): RoadTripCoordinate[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const coordinates = value.filter(
    (item): item is RoadTripCoordinate =>
      Array.isArray(item) &&
      item.length === 2 &&
      typeof item[0] === "number" &&
      typeof item[1] === "number",
  );

  return coordinates.length >= 2 ? normalizePathCoordinates(coordinates) : null;
}

function parsePersistedRouteCache(raw: string): unknown {
  const trimmed = raw.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith(COMPRESSED_ROUTE_CACHE_PREFIX)) {
    const decompressed = decompressFromUTF16(
      trimmed.slice(COMPRESSED_ROUTE_CACHE_PREFIX.length),
    );

    if (!decompressed) {
      return null;
    }

    return JSON.parse(decompressed) as unknown;
  }

  return JSON.parse(trimmed) as unknown;
}

function hydrateRouteCache() {
  if (hasHydratedRouteCache || typeof window === "undefined") {
    return;
  }

  hasHydratedRouteCache = true;

  try {
    const raw = window.localStorage.getItem(ROAD_TRIPS_ROUTE_CACHE_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = parsePersistedRouteCache(raw);
    if (!Array.isArray(parsed)) {
      return;
    }

    parsed.forEach((item) => {
      if (!item || typeof item !== "object") {
        return;
      }

      const candidate = item as Partial<PersistedRouteCacheEntry>;
      if (typeof candidate.key !== "string" || !candidate.key.trim()) {
        return;
      }

      const pathCoordinates = sanitizePathCoordinates(
        candidate.pathCoordinates,
      );
      if (
        typeof candidate.miles !== "number" ||
        !Number.isFinite(candidate.miles) ||
        candidate.miles <= 0 ||
        !pathCoordinates
      ) {
        return;
      }

      routeCache.set(candidate.key, {
        miles: Math.round(candidate.miles),
        pathCoordinates,
      });
    });
  } catch (error) {
    // Ignore malformed persisted route cache.
  }
}

function persistRouteCache() {
  if (typeof window === "undefined") {
    return;
  }

  const entries = Array.from(routeCache.entries())
    .slice(-MAX_PERSISTED_ROUTE_CACHE_ENTRIES)
    .map(([key, route]) => ({
      key,
      miles: route.miles,
      pathCoordinates: normalizePathCoordinates(route.pathCoordinates),
    }));

  try {
    window.localStorage.setItem(
      ROAD_TRIPS_ROUTE_CACHE_STORAGE_KEY,
      `${COMPRESSED_ROUTE_CACHE_PREFIX}${compressToUTF16(JSON.stringify(entries))}`,
    );
  } catch (error) {
    // Ignore storage quota or serialization failures.
  }
}

export function buildRouteCacheKey(waypoints: RoadTripWaypoint[]): string {
  return waypoints
    .map(
      (waypoint) =>
        `${waypoint.longitude.toFixed(5)},${waypoint.latitude.toFixed(5)}`,
    )
    .join(";");
}

export function getCachedRoute(
  waypoints: RoadTripWaypoint[],
): ResolvedRoute | null {
  hydrateRouteCache();
  const cached = routeCache.get(buildRouteCacheKey(waypoints));

  if (!cached || cached.pathCoordinates.length < 2) {
    return null;
  }

  return {
    miles: cached.miles,
    pathCoordinates: cached.pathCoordinates,
    routeSource: "osrm",
  };
}

function cacheRoute(waypoints: RoadTripWaypoint[], route: ResolvedRoute) {
  hydrateRouteCache();
  const cacheKey = buildRouteCacheKey(waypoints);
  const normalizedPathCoordinates = normalizePathCoordinates(
    route.pathCoordinates,
  );
  routeCache.delete(cacheKey);
  routeCache.set(cacheKey, {
    miles: route.miles,
    pathCoordinates: normalizedPathCoordinates,
  });
  persistRouteCache();
}

export function primeRouteCache(
  cacheEntries: Array<{
    waypoints: RoadTripWaypoint[];
    route: ResolvedRoute;
  }>,
) {
  hydrateRouteCache();

  cacheEntries.forEach(({ waypoints, route }) => {
    const cacheKey = buildRouteCacheKey(waypoints);
    if (routeCache.has(cacheKey)) {
      return;
    }

    routeCache.set(cacheKey, {
      miles: route.miles,
      pathCoordinates: normalizePathCoordinates(route.pathCoordinates),
    });
  });

  persistRouteCache();
}

export function resetRouteCacheForTests() {
  routeCache.clear();
  hasHydratedRouteCache = false;
}

export function buildWaypointChunks(
  waypoints: RoadTripWaypoint[],
  maxWaypointsPerRequest = MAX_WAYPOINTS_PER_REQUEST,
): RoadTripWaypoint[][] {
  if (waypoints.length <= maxWaypointsPerRequest) {
    return [waypoints];
  }

  const chunks: RoadTripWaypoint[][] = [];
  let startIndex = 0;

  while (startIndex < waypoints.length - 1) {
    const endIndex = Math.min(
      startIndex + maxWaypointsPerRequest,
      waypoints.length,
    );
    chunks.push(waypoints.slice(startIndex, endIndex));
    startIndex = endIndex - 1;
  }

  return chunks;
}

async function requestChunkRoute(
  waypoints: RoadTripWaypoint[],
): Promise<ResolvedRoute> {
  const coordinates = waypoints
    .map((waypoint) => `${waypoint.longitude},${waypoint.latitude}`)
    .join(";");

  const response = await fetch(
    `${OSRM_ROUTE_ENDPOINT}/${coordinates}?overview=full&geometries=geojson&steps=false`,
  );

  if (!response.ok) {
    throw new Error(`Route request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as OsrmRouteResponse;
  const route = payload.routes?.[0];
  const rawCoordinates = route?.geometry?.coordinates;

  if (
    payload.code !== "Ok" ||
    !route ||
    !rawCoordinates ||
    rawCoordinates.length < 2
  ) {
    throw new Error("The route service did not return a usable driving route.");
  }

  return {
    miles: Math.round(route.distance / 1609.344),
    pathCoordinates: rawCoordinates.map(
      ([longitude, latitude]) => [latitude, longitude] as RoadTripCoordinate,
    ),
    routeSource: "osrm",
  };
}

export async function fetchDrivingRoute(
  waypoints: RoadTripWaypoint[],
): Promise<ResolvedRoute> {
  if (waypoints.length < 2) {
    throw new Error(
      "At least two waypoints are required to calculate a route.",
    );
  }

  const cachedRoute = getCachedRoute(waypoints);
  if (cachedRoute) {
    return cachedRoute;
  }

  const chunks = buildWaypointChunks(waypoints);
  let mergedPathCoordinates: RoadTripCoordinate[] = [];
  let totalMiles = 0;

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    const route = await requestChunkRoute(chunks[chunkIndex]);
    totalMiles += route.miles;
    mergedPathCoordinates =
      chunkIndex === 0
        ? route.pathCoordinates
        : mergedPathCoordinates.concat(route.pathCoordinates.slice(1));

    if (chunkIndex < chunks.length - 1) {
      await wait(REQUEST_DELAY_MS);
    }
  }

  const resolvedRoute: ResolvedRoute = {
    miles: totalMiles,
    pathCoordinates: normalizePathCoordinates(mergedPathCoordinates),
    routeSource: "osrm",
  };

  cacheRoute(waypoints, resolvedRoute);
  return resolvedRoute;
}
