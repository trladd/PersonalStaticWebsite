import { useEffect, useState } from "react";
import { fetchDrivingRoute, getCachedRoute } from "./routing";
import { RoadTrip } from "./types";

function applyCachedRoutes(trips: RoadTrip[]): RoadTrip[] {
  return trips.map((trip) => {
    if (trip.waypoints.length < 2) {
      return trip;
    }

    const cachedRoute = getCachedRoute(trip.waypoints);
    if (!cachedRoute) {
      return {
        ...trip,
        pathCoordinates: undefined,
      };
    }

    return {
      ...trip,
      miles: trip.miles > 0 ? trip.miles : cachedRoute.miles,
      pathCoordinates: cachedRoute.pathCoordinates,
      routeSource: cachedRoute.routeSource,
    };
  });
}

export function useResolvedRoadTrips(trips: RoadTrip[], autoResolveRoutes = true): {
  resolvedTrips: RoadTrip[];
  isResolvingRoutes: boolean;
} {
  const [resolvedTrips, setResolvedTrips] = useState<RoadTrip[]>(() => applyCachedRoutes(trips));
  const [isResolvingRoutes, setIsResolvingRoutes] = useState(false);

  useEffect(() => {
    setResolvedTrips(applyCachedRoutes(trips));
  }, [trips]);

  useEffect(() => {
    if (!autoResolveRoutes) {
      setIsResolvingRoutes(false);
      return;
    }

    let cancelled = false;

    const resolveRoutes = async () => {
      const tripsNeedingRoutes = trips.filter(
        (trip) => trip.waypoints.length >= 2 && !getCachedRoute(trip.waypoints)
      );

      if (tripsNeedingRoutes.length === 0) {
        setIsResolvingRoutes(false);
        return;
      }

      setIsResolvingRoutes(true);

      for (const trip of tripsNeedingRoutes) {
        if (cancelled) {
          return;
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

      if (!cancelled) {
        setIsResolvingRoutes(false);
      }
    };

    void resolveRoutes();

    return () => {
      cancelled = true;
    };
  }, [autoResolveRoutes, trips]);

  return {
    resolvedTrips,
    isResolvingRoutes,
  };
}
