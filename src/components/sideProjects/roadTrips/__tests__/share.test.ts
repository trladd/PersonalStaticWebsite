import {
  buildRouteCacheKey,
  getCachedRoute,
  primeRouteCache,
} from "../routing";
import {
  buildShareableRoadTripUrl,
  parseSharedRoadTripPayload,
  ROAD_TRIP_SHARE_PARAM,
} from "../share";
import { RoadTrip } from "../types";

const sampleTrip: RoadTrip = {
  id: "western-expedition",
  name: "Western Expedition 2018",
  category: "taken",
  miles: 3905,
  lineColor: "#2f6fe4",
  waypoints: [
    {
      name: "Home",
      latitude: 39.84005,
      longitude: -86.43149,
      state: "Indiana",
    },
    {
      name: "Moab",
      latitude: 38.57381,
      longitude: -109.54621,
      state: "Utah",
    },
    {
      name: "Greencastle",
      latitude: 39.64449,
      longitude: -86.86473,
      state: "Indiana",
    },
  ],
  statesCovered: ["Indiana", "Utah", "Indiana"],
  dateLabel: "2018",
  description: "Shared-trip regression fixture",
  pathCoordinates: [
    [39.84005, -86.43149],
    [38.57381, -109.54621],
    [39.64449, -86.86473],
  ],
  routeSource: "osrm",
};

describe("road trip share utils", () => {
  it("builds and parses a shareable road-trip payload", () => {
    const url = buildShareableRoadTripUrl({
      currentUrl: "https://trevarladd.com/sideProjects/roadTrips",
      trip: sampleTrip,
    });

    const parsedUrl = new URL(url);
    expect(parsedUrl.pathname).toBe("/sideProjects/roadTrips");
    expect(parsedUrl.searchParams.has(ROAD_TRIP_SHARE_PARAM)).toBe(true);

    const parsedPayload = parseSharedRoadTripPayload(parsedUrl.search);
    expect(parsedPayload).not.toBeNull();
    expect(parsedPayload?.trip.name).toBe(sampleTrip.name);
    expect(parsedPayload?.trip.pathCoordinates).toBeUndefined();
    expect(parsedPayload?.trip.routeSource).toBeUndefined();
    expect(parsedPayload?.trip.lineColor).toBe("#2f6fe4");
  });

  it("primes the route cache for a waypoint set", () => {
    primeRouteCache([
      {
        waypoints: sampleTrip.waypoints,
        route: {
          miles: sampleTrip.miles,
          pathCoordinates: sampleTrip.pathCoordinates ?? [],
          routeSource: "osrm",
        },
      },
    ]);

    expect(buildRouteCacheKey(sampleTrip.waypoints)).toContain(";");
    expect(getCachedRoute(sampleTrip.waypoints)).toEqual({
      miles: sampleTrip.miles,
      pathCoordinates: sampleTrip.pathCoordinates,
      routeSource: "osrm",
    });
  });
});
