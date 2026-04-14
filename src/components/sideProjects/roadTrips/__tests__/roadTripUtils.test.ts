import {
  buildStateCoverage,
  deriveStateCodesFromCoordinates,
  estimateMilesFromWaypoints,
  getTripAdditionalRegionCodes,
  getTripRegionCodes,
  getTripStateCodes,
  normalizeStateCode,
  summarizeStateCompletion,
  summarizeRoadTrips,
} from "../roadTripUtils";
import { buildRouteCacheKey, buildWaypointChunks } from "../routing";
import { RoadTrip } from "../types";

const trips: RoadTrip[] = [
  {
    id: "midwest",
    name: "Midwest",
    category: "taken",
    miles: 500,
    statesCovered: ["IN", "Illinois", "KY"],
    waypoints: [
      {
        name: "Indianapolis",
        latitude: 39.7684,
        longitude: -86.1581,
        state: "IN",
      },
      { name: "Chicago", latitude: 41.8781, longitude: -87.6298, state: "IL" },
    ],
  },
  {
    id: "west",
    name: "West",
    category: "wishlist",
    miles: 900,
    statesCovered: ["CO", "Utah"],
    waypoints: [
      { name: "Denver", latitude: 39.7392, longitude: -104.9903, state: "CO" },
      { name: "Moab", latitude: 38.5733, longitude: -109.5498, state: "UT" },
    ],
  },
];

describe("roadTripUtils", () => {
  it("normalizes state names and postal codes", () => {
    expect(normalizeStateCode("in")).toBe("IN");
    expect(normalizeStateCode("Indiana")).toBe("IN");
    expect(normalizeStateCode("  utah ")).toBe("UT");
    expect(normalizeStateCode("Ontario")).toBe("CA-ON");
    expect(normalizeStateCode("Yucatán")).toBe("MX-YUC");
    expect(normalizeStateCode("")).toBeNull();
  });

  it("prefers explicitly covered states over waypoint-only states", () => {
    expect(getTripStateCodes(trips[0])).toEqual(["IN", "IL", "KY"]);
  });

  it("builds summaries and cross-category state coverage", () => {
    const summary = summarizeRoadTrips(trips);
    const coverage = buildStateCoverage(trips);

    expect(summary.totalTrips).toBe(2);
    expect(summary.totalMiles).toBe(1400);
    expect(summary.taken.tripCount).toBe(1);
    expect(summary.wishlist.tripCount).toBe(1);
    expect(summary.totalStatesVisited).toEqual(["IN", "IL", "KY", "CO", "UT"]);
    expect(summary.totalAdditionalRegionsVisited).toEqual([]);
    expect(coverage.IN).toEqual({ taken: true, wishlist: false });
    expect(coverage.UT).toEqual({ taken: false, wishlist: true });
  });

  it("keeps non-us regions separate from tracked us states", () => {
    const internationalTrip: RoadTrip = {
      id: "north-america",
      name: "North America",
      category: "taken",
      miles: 1000,
      statesCovered: ["Ontario", "MX-CHH"],
      waypoints: [
        {
          name: "Toronto",
          latitude: 43.6532,
          longitude: -79.3832,
          state: "ON",
        },
        {
          name: "Chihuahua",
          latitude: 28.6329,
          longitude: -106.0691,
          state: "Chihuahua",
        },
      ],
    };

    expect(getTripRegionCodes(internationalTrip)).toEqual(["CA-ON", "MX-CHH"]);
    expect(getTripStateCodes(internationalTrip)).toEqual([]);
    expect(getTripAdditionalRegionCodes(internationalTrip)).toEqual([
      "CA-ON",
      "MX-CHH",
    ]);
  });

  it("estimates miles from waypoint coordinates", () => {
    const miles = estimateMilesFromWaypoints(trips[0].waypoints);

    expect(miles).toBeGreaterThan(100);
  });

  it("chunks waypoint requests and builds stable route cache keys", () => {
    const repeatedWaypoints = new Array(25).fill(null).map((_, index) => ({
      name: `Stop ${index + 1}`,
      latitude: 39 + index * 0.1,
      longitude: -86 + index * 0.1,
      state: "IN",
    }));

    const chunks = buildWaypointChunks(repeatedWaypoints, 10);
    expect(chunks).toHaveLength(3);
    expect(chunks[1][0]).toEqual(chunks[0][chunks[0].length - 1]);
    expect(buildRouteCacheKey(repeatedWaypoints)).toContain(";");
  });

  it("derives passed-through states from routed coordinates and summarizes completion", () => {
    const derivedStates = deriveStateCodesFromCoordinates([
      [39.7684, -86.1581],
      [41.8781, -87.6298],
    ]);
    const completion = summarizeStateCompletion(["IN", "IL"]);

    expect(derivedStates).toEqual(expect.arrayContaining(["IN", "IL"]));
    expect(completion.visitedCount).toBe(2);
    expect(completion.remainingCount).toBeGreaterThan(0);
  });
});
