import {
  compressRoadTripSharePayload,
  decompressRoadTripSharePayload,
  ShareableRoadTripPayload,
} from "./sharePayloadCodec";
import { RoadTrip } from "./types";

export const ROAD_TRIP_SHARE_PARAM = "roadTripShare";
export const ROAD_TRIP_SHARE_VERSION = 1;

function stripRouteDataForSharing(trip: RoadTrip): RoadTrip {
  return {
    ...trip,
    id: trip.id,
    isShared: undefined,
    pathCoordinates: undefined,
    routeSource:
      trip.routeSource === "straight-line" ? "straight-line" : undefined,
  };
}

export const buildShareableRoadTripUrl = ({
  currentUrl,
  trip,
}: {
  currentUrl: string;
  trip: RoadTrip;
}) => {
  const url = new URL(currentUrl);
  const payload: ShareableRoadTripPayload = {
    version: ROAD_TRIP_SHARE_VERSION,
    trip: stripRouteDataForSharing(trip),
  };

  url.pathname = "/sideProjects/roadTrips";
  url.searchParams.set(
    ROAD_TRIP_SHARE_PARAM,
    compressRoadTripSharePayload(payload),
  );

  return url.toString();
};

export const parseSharedRoadTripPayload = (
  search: string,
): ShareableRoadTripPayload | null => {
  const params = new URLSearchParams(search);
  const encodedPayload = params.get(ROAD_TRIP_SHARE_PARAM);

  if (!encodedPayload) {
    return null;
  }

  return decompressRoadTripSharePayload(encodedPayload);
};
