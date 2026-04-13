import { useEffect, useState } from "react";
import { fetchDrivingRoute, getCachedRoute } from "./routing";
import { RoadTrip } from "./types";

function applyCachedRoutes(trips: RoadTrip[]): RoadTrip[] {
  return trips.map((trip) => {
    if (trip.pathCoordinates && trip.pathCoordinates.length >= 2) {
      return trip;
    }

    if (trip.waypoints.length < 2) {
      return trip;
    }

    const cachedRoute = getCachedRoute(trip.waypoints);
    if (!cachedRoute) {
      return trip;
    }

    return {
      ...trip,
      miles: trip.miles > 0 ? trip.miles : cachedRoute.miles,
      pathCoordinates: cachedRoute.pathCoordinates,
      routeSource: cachedRoute.routeSource,
    };
  });
}

export function useResolvedRoadTrips(trips: RoadTrip[], autoResolveRoutes = true): RoadTrip[] {
  const [resolvedTrips, setResolvedTrips] = useState<RoadTrip[]>(() => applyCachedRoutes(trips));

  useEffect(() => {
    setResolvedTrips(applyCachedRoutes(trips));
  }, [trips]);

  useEffect(() => {
    if (!autoResolveRoutes) {
      return;
    }

    let cancelled = false;

    const resolveRoutes = async () => {
      for (const trip of trips) {
        if (cancelled) {
          return;
        }

        if ((trip.pathCoordinates && trip.pathCoordinates.length >= 2) || trip.waypoints.length < 2) {
          continue;
        }

        if (getCachedRoute(trip.waypoints)) {
          continue;
        }

        try {
          const route = await fetchDrivingRoute(trip.waypoints);
          if (cancelled) {
            return;
          }

          setResolvedTrips((currentTrips) =>
            currentTrips.map((currentTrip) =>
              currentTrip.id === trip.id
                ? {
                    ...currentTrip,
                    miles: currentTrip.miles > 0 ? currentTrip.miles : route.miles,
                    pathCoordinates: route.pathCoordinates,
                    routeSource: route.routeSource,
                  }
                : currentTrip
            )
          );
        } catch (error) {
          // Keep straight-line fallback when route resolution fails.
        }
      }
    };

    void resolveRoutes();

    return () => {
      cancelled = true;
    };
  }, [autoResolveRoutes, trips]);

  return resolvedTrips;
}
