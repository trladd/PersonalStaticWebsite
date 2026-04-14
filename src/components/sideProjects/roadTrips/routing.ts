import { RoadTripCoordinate, RoadTripWaypoint } from "./types";

const OSRM_ROUTE_ENDPOINT = "https://router.project-osrm.org/route/v1/driving";
const MAX_WAYPOINTS_PER_REQUEST = 20;
const REQUEST_DELAY_MS = 1050;
const routeCache = new Map<string, CachedRoute>();

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

export function buildRouteCacheKey(waypoints: RoadTripWaypoint[]): string {
  return waypoints
    .map((waypoint) => `${waypoint.longitude.toFixed(5)},${waypoint.latitude.toFixed(5)}`)
    .join(";");
}

export function getCachedRoute(
  waypoints: RoadTripWaypoint[]
): ResolvedRoute | null {
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
  routeCache.set(buildRouteCacheKey(waypoints), {
    miles: route.miles,
    pathCoordinates: route.pathCoordinates,
  });
}

export function buildWaypointChunks(
  waypoints: RoadTripWaypoint[],
  maxWaypointsPerRequest = MAX_WAYPOINTS_PER_REQUEST
): RoadTripWaypoint[][] {
  if (waypoints.length <= maxWaypointsPerRequest) {
    return [waypoints];
  }

  const chunks: RoadTripWaypoint[][] = [];
  let startIndex = 0;

  while (startIndex < waypoints.length - 1) {
    const endIndex = Math.min(startIndex + maxWaypointsPerRequest, waypoints.length);
    chunks.push(waypoints.slice(startIndex, endIndex));
    startIndex = endIndex - 1;
  }

  return chunks;
}

async function requestChunkRoute(
  waypoints: RoadTripWaypoint[]
): Promise<ResolvedRoute> {
  const coordinates = waypoints
    .map((waypoint) => `${waypoint.longitude},${waypoint.latitude}`)
    .join(";");

  const response = await fetch(
    `${OSRM_ROUTE_ENDPOINT}/${coordinates}?overview=full&geometries=geojson&steps=false`
  );

  if (!response.ok) {
    throw new Error(`Route request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as OsrmRouteResponse;
  const route = payload.routes?.[0];
  const rawCoordinates = route?.geometry?.coordinates;

  if (payload.code !== "Ok" || !route || !rawCoordinates || rawCoordinates.length < 2) {
    throw new Error("The route service did not return a usable driving route.");
  }

  return {
    miles: Math.round(route.distance / 1609.344),
    pathCoordinates: rawCoordinates.map(
      ([longitude, latitude]) => [latitude, longitude] as RoadTripCoordinate
    ),
    routeSource: "osrm",
  };
}

export async function fetchDrivingRoute(
  waypoints: RoadTripWaypoint[]
): Promise<ResolvedRoute> {
  if (waypoints.length < 2) {
    throw new Error("At least two waypoints are required to calculate a route.");
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
    pathCoordinates: mergedPathCoordinates,
    routeSource: "osrm",
  };

  cacheRoute(waypoints, resolvedRoute);
  return resolvedRoute;
}
