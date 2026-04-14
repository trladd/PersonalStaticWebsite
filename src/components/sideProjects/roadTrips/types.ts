export type RoadTripCategory = "taken" | "wishlist";

export interface RoadTripWaypoint {
  name: string;
  latitude: number;
  longitude: number;
  state: string;
  notes?: string;
}

export type RoadTripCoordinate = [number, number];

export type RoadTripRouteSource = "osrm" | "manual" | "straight-line";

export interface RoadTrip {
  id: string;
  name: string;
  category: RoadTripCategory;
  miles: number;
  isShared?: boolean;
  waypoints: RoadTripWaypoint[];
  statesCovered?: string[];
  dateLabel?: string;
  description?: string;
  lineColor?: string;
  pathCoordinates?: RoadTripCoordinate[];
  routeSource?: RoadTripRouteSource;
}

export interface RoadTripShowcaseConfig {
  title: string;
  intro: string;
  trips: RoadTrip[];
}
