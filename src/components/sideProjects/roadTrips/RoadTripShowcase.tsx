import React, { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import usStatesGeoJson from "./data/us-states.json";
import {
  getRoadTripMapTileConfig,
  RoadTripAppearanceSettings,
  resolveTripLineColor,
} from "./appearance";
import {
  buildStateCoverage,
  formatNumber,
  getCategoryLabel,
  getTripRenderCoordinates,
  getTripStateCodes,
  getTripStateNames,
  normalizeStateCode,
  STATE_NAME_BY_CODE,
  summarizeStateCompletion,
  summarizeRoadTrips,
} from "./roadTripUtils";
import { loadAppearanceSettings } from "./storage";
import { RoadTrip, RoadTripCategory, RoadTripShowcaseConfig } from "./types";
import { useResolvedRoadTrips } from "./useResolvedRoadTrips";
import "./RoadTrips.css";

type TripVisibilityFilter = "all" | RoadTripCategory;

interface RoadTripShowcaseProps extends RoadTripShowcaseConfig {
  appearanceSettings?: RoadTripAppearanceSettings;
  autoResolveRoutes?: boolean;
  className?: string;
  showBreakdowns?: boolean;
  showFilter?: boolean;
  showHero?: boolean;
  showHint?: boolean;
}

const DEFAULT_CENTER: [number, number] = [39.5, -98.35];
const DEFAULT_ZOOM = 4;
const DEFAULT_US_BOUNDS: [[number, number], [number, number]] = [
  [24.396308, -124.848974],
  [49.384358, -66.885444],
];

const FILTER_OPTIONS: { label: string; value: TripVisibilityFilter }[] = [
  { label: "All Trips", value: "all" },
  { label: "Trips Taken", value: "taken" },
  { label: "Trip Wishlist", value: "wishlist" },
];

function MapResizerAndViewport({ trips }: { trips: RoadTrip[] }) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const invalidate = () => map.invalidateSize();

    invalidate();
    const timer = setTimeout(invalidate, 150);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          invalidate();
        }
      },
      { threshold: 0.01 }
    );

    observer.observe(container);
    window.addEventListener("resize", invalidate);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("resize", invalidate);
    };
  }, [map]);

  useEffect(() => {
    const points = trips.flatMap((trip) => getTripRenderCoordinates(trip));

    if (points.length >= 2) {
      map.fitBounds(points, {
        padding: [28, 28],
        maxZoom: 5,
      });
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 6);
      return;
    }

    map.fitBounds(DEFAULT_US_BOUNDS, { padding: [20, 20] });
  }, [map, trips]);

  return null;
}

function getStateLayerStyle(
  stateName: string,
  stateCoverage: ReturnType<typeof buildStateCoverage>,
  appearanceSettings: RoadTripAppearanceSettings
) {
  const stateCode = normalizeStateCode(stateName);
  const coverage = stateCode ? stateCoverage[stateCode] : undefined;

  if (coverage?.taken && coverage?.wishlist) {
    return {
      color: appearanceSettings.takenStateBorderColor,
      weight: 1.5,
      fillColor: appearanceSettings.takenStateFillColor,
      fillOpacity: 0.58,
    };
  }

  if (coverage?.taken) {
    return {
      color: appearanceSettings.takenStateBorderColor,
      weight: 1.4,
      fillColor: appearanceSettings.takenStateFillColor,
      fillOpacity: 0.54,
    };
  }

  if (coverage?.wishlist) {
    return {
      color: appearanceSettings.wishlistStateBorderColor,
      weight: 1.4,
      dashArray: "6 6",
      fillColor: appearanceSettings.wishlistStateFillColor,
      fillOpacity: 0.45,
    };
  }

  return {
    color: appearanceSettings.neutralStateBorderColor,
    weight: 0.8,
    fillColor: appearanceSettings.neutralStateFillColor,
    fillOpacity: 0.5,
  };
}

function RoadTripShowcase({
  title,
  intro,
  trips,
  appearanceSettings,
  autoResolveRoutes = true,
  className = "",
  showBreakdowns = true,
  showFilter = true,
  showHero = true,
  showHint = true,
}: RoadTripShowcaseProps) {
  const [filter, setFilter] = useState<TripVisibilityFilter>("all");
  const resolvedTrips = useResolvedRoadTrips(trips, autoResolveRoutes);
  const effectiveAppearanceSettings = appearanceSettings ?? loadAppearanceSettings();
  const mapTileConfig = useMemo(
    () => getRoadTripMapTileConfig(effectiveAppearanceSettings.mapStyle),
    [effectiveAppearanceSettings.mapStyle]
  );

  const summary = useMemo(() => summarizeRoadTrips(resolvedTrips), [resolvedTrips]);
  const stateCompletion = useMemo(
    () => summarizeStateCompletion(summary.taken.statesVisited),
    [summary.taken.statesVisited]
  );
  const remainingStatesTooltip = useMemo(
    () =>
      stateCompletion.remainingStateCodes
        .map((stateCode) => STATE_NAME_BY_CODE[stateCode])
        .join(", "),
    [stateCompletion.remainingStateCodes]
  );
  const visibleTrips = useMemo(
    () => resolvedTrips.filter((trip) => filter === "all" || trip.category === filter),
    [filter, resolvedTrips]
  );
  const visibleStateCoverage = useMemo(
    () => buildStateCoverage(visibleTrips),
    [visibleTrips]
  );

  const groupedVisibleTrips = useMemo(
    () => ({
      taken: visibleTrips.filter((trip) => trip.category === "taken"),
      wishlist: visibleTrips.filter((trip) => trip.category === "wishlist"),
    }),
    [visibleTrips]
  );

  return (
    <div className={`roadTrips ${className}`.trim()}>
      {showHero ? (
        <section className="roadTrips__hero card-panel">
          <p className="roadTrips__eyebrow">Reusable Road Trip Component</p>
          <h1 className="roadTrips__title">{title}</h1>
          <p className="roadTrips__intro">{intro}</p>
          {showHint ? (
            <p className="roadTrips__hint">
              Routes fall back to straight waypoint lines first, then resolve to
              likely roads and cache locally when routing data is available.
            </p>
          ) : null}
        </section>
      ) : (
        <div className="roadTrips__inlineHeader">
          <div>
            <h3 className="roadTrips__inlineTitle">{title}</h3>
            <p className="roadTrips__inlineCopy">{intro}</p>
          </div>
        </div>
      )}

      <section className="roadTrips__summaryGrid">
        <article className="roadTrips__statCard">
          <span className="roadTrips__statLabel">Trips Taken</span>
          <strong className="roadTrips__statValue">{formatNumber(summary.taken.tripCount)}</strong>
          <span className="roadTrips__statMeta">
            {formatNumber(summary.taken.totalMiles)} miles logged
          </span>
        </article>
        <article className="roadTrips__statCard">
          <span className="roadTrips__statLabel">Trip Wishlist</span>
          <strong className="roadTrips__statValue">
            {formatNumber(summary.wishlist.tripCount)}
          </strong>
          <span className="roadTrips__statMeta">
            {formatNumber(summary.wishlist.totalMiles)} planned miles
          </span>
        </article>
        <article className="roadTrips__statCard">
          <span className="roadTrips__statLabel">Visited States</span>
          <strong className="roadTrips__statValue">
            {formatNumber(summary.taken.statesVisited.length)}
          </strong>
          <span className="roadTrips__statMeta">Filled in from completed trips</span>
        </article>
        <article className="roadTrips__statCard">
          <span className="roadTrips__statLabel">All Covered States</span>
          <strong className="roadTrips__statValue">
            {formatNumber(summary.totalStatesVisited.length)}
          </strong>
          <span className="roadTrips__statMeta">Taken and wishlist combined</span>
        </article>
      </section>

      <section className="roadTrips__completionCard card-panel">
        <div className="roadTrips__completionHeader">
          <div>
            <h2 className="roadTrips__sectionTitle">State Completion</h2>
            <p className="roadTrips__sectionCopy">
              Based on completed trips only. Wishlist routes do not count toward visited-state
              completion.
            </p>
          </div>
          <div
            className="roadTrips__completionBadge"
            title={
              stateCompletion.remainingCount > 0
                ? `States remaining: ${remainingStatesTooltip}`
                : "All tracked states are complete."
            }
          >
            {stateCompletion.remainingCount} remaining
          </div>
        </div>
        <div
          className="roadTrips__completionMeter"
          aria-label={`${stateCompletion.visitedCount} of ${stateCompletion.totalStates} states visited`}
        >
          <div
            className="roadTrips__completionFill"
            style={{
              width: `${stateCompletion.completionPercent}%`,
              background: `linear-gradient(90deg, ${effectiveAppearanceSettings.takenLineColor} 0%, ${effectiveAppearanceSettings.takenStateFillColor} 100%)`,
            }}
          />
        </div>
        <div className="roadTrips__completionStats">
          <span>
            {stateCompletion.visitedCount}/{stateCompletion.totalStates} states visited
          </span>
          <span>{stateCompletion.completionPercent}% complete</span>
        </div>
      </section>

      <section className="roadTrips__mapSection card-panel">
        <div className="roadTrips__sectionHeader">
          <div>
            <h2 className="roadTrips__sectionTitle">Trip Map</h2>
            <p className="roadTrips__sectionCopy">
              Completed trips use solid lines, wishlist routes use dashed lines,
              and state shading updates with the active filter.
            </p>
          </div>
          {showFilter ? (
            <div className="roadTrips__filterRow" aria-label="Trip filters">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`roadTrips__filterButton${
                    filter === option.value ? " roadTrips__filterButton--active" : ""
                  }`}
                  type="button"
                  onClick={() => setFilter(option.value)}
                  aria-pressed={filter === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="roadTrips__legend" aria-label="Map legend">
          <span className="roadTrips__legendItem">
            <span
              className="roadTrips__legendSwatch"
              style={{ background: effectiveAppearanceSettings.takenLineColor }}
            />
            Trips taken
          </span>
          <span className="roadTrips__legendItem">
            <span
              className="roadTrips__legendSwatch"
              style={{
                background: `repeating-linear-gradient(90deg, ${effectiveAppearanceSettings.wishlistLineColor} 0, ${effectiveAppearanceSettings.wishlistLineColor} 7px, #ffffff 7px, #ffffff 12px)`,
                borderColor: effectiveAppearanceSettings.wishlistLineColor,
              }}
            />
            Wishlist trips
          </span>
          <span className="roadTrips__legendItem">
            <span
              className="roadTrips__legendSwatch"
              style={{ background: effectiveAppearanceSettings.takenStateFillColor }}
            />
            Overlap uses visited color
          </span>
        </div>

        <div className="roadTrips__mapShell">
          <MapContainer
            {...({
              center: DEFAULT_CENTER,
              zoom: DEFAULT_ZOOM,
              minZoom: 3,
              style: { height: "100%", width: "100%" },
              scrollWheelZoom: true,
            } as any)}
          >
            <MapResizerAndViewport trips={visibleTrips} />
            <TileLayer
              {...({
                attribution: mapTileConfig.attribution,
                url: mapTileConfig.url,
              } as any)}
            />
            <GeoJSON
              {...({
                data: usStatesGeoJson as any,
                style: (feature: any) =>
                  getStateLayerStyle(
                    feature?.properties?.name ?? "",
                    visibleStateCoverage,
                    effectiveAppearanceSettings
                  ),
                onEachFeature: (feature: any, layer: any) => {
                  const stateName = feature?.properties?.name ?? "Unknown state";
                  const stateCode = normalizeStateCode(stateName);
                  const coverage = stateCode ? visibleStateCoverage[stateCode] : undefined;

                  let coverageLabel = "No currently visible trips";
                  if (coverage?.taken && coverage?.wishlist) {
                    coverageLabel = "Visited";
                  } else if (coverage?.taken) {
                    coverageLabel = "Visited";
                  } else if (coverage?.wishlist) {
                    coverageLabel = "Wishlist";
                  }

                  layer.bindTooltip(`${stateName}: ${coverageLabel}`);
                },
              } as any)}
            />

            {visibleTrips.map((trip) => {
              const positions = getTripRenderCoordinates(trip);
              const color = resolveTripLineColor(
                trip.category,
                trip.lineColor,
                effectiveAppearanceSettings
              );

              return (
                <React.Fragment key={trip.id}>
                  <Polyline
                    {...({
                      positions,
                      pathOptions: {
                        color,
                        weight: trip.category === "taken" ? 4 : 3.5,
                        opacity: trip.category === "taken" ? 0.88 : 0.78,
                        dashArray: trip.category === "wishlist" ? "10 10" : undefined,
                      },
                    } as any)}
                  />
                  {trip.waypoints.map((waypoint, index) => (
                    <CircleMarker
                      key={`${trip.id}-${waypoint.name}-${index}`}
                      {...({
                        center: [waypoint.latitude, waypoint.longitude],
                        radius: 5.5,
                        pathOptions: {
                          color,
                          fillColor: "#ffffff",
                          fillOpacity: 0.95,
                          weight: 2,
                        },
                      } as any)}
                    >
                      <Tooltip direction="top" offset={[0, -8]}>
                        {trip.name}: stop {index + 1}
                      </Tooltip>
                      <Popup>
                        <strong>{waypoint.name}</strong>
                        <br />
                        {trip.name}
                        {waypoint.notes ? (
                          <>
                            <br />
                            {waypoint.notes}
                          </>
                        ) : null}
                      </Popup>
                    </CircleMarker>
                  ))}
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>
      </section>

      {showBreakdowns ? (
        <>
          <section className="roadTrips__dataSection">
            <article className="roadTrips__categoryPanel card-panel">
              <h2 className="roadTrips__sectionTitle">Trips Taken</h2>
              <p className="roadTrips__categoryMeta">
                {formatNumber(summary.taken.tripCount)} trips
                {" • "}
                {formatNumber(summary.taken.totalMiles)} miles
                {" • "}
                {formatNumber(summary.taken.statesVisited.length)} states
              </p>
              <div className="roadTrips__stateList">
                {summary.taken.statesVisited.map((stateCode) => (
                  <span
                    key={stateCode}
                    className="roadTrips__stateChip roadTrips__stateChip--taken"
                  >
                    {STATE_NAME_BY_CODE[stateCode]}
                  </span>
                ))}
              </div>
            </article>
            <article className="roadTrips__categoryPanel card-panel">
              <h2 className="roadTrips__sectionTitle">Trip Wishlist</h2>
              <p className="roadTrips__categoryMeta">
                {formatNumber(summary.wishlist.tripCount)} trips
                {" • "}
                {formatNumber(summary.wishlist.totalMiles)} miles
                {" • "}
                {formatNumber(summary.wishlist.statesVisited.length)} states
              </p>
              <div className="roadTrips__stateList">
                {summary.wishlist.statesVisited.map((stateCode) => (
                  <span
                    key={stateCode}
                    className="roadTrips__stateChip roadTrips__stateChip--wishlist"
                  >
                    {STATE_NAME_BY_CODE[stateCode]}
                  </span>
                ))}
              </div>
            </article>
          </section>

          {(["taken", "wishlist"] as RoadTripCategory[]).map((category) => {
            const categoryTrips = groupedVisibleTrips[category];

            if (categoryTrips.length === 0) {
              return null;
            }

            return (
              <section key={category} className="roadTrips__tripSection">
                <div className="roadTrips__sectionHeader roadTrips__sectionHeader--stacked">
                  <div>
                    <h2 className="roadTrips__sectionTitle">{getCategoryLabel(category)}</h2>
                    <p className="roadTrips__sectionCopy">
                      {category === "taken"
                        ? "Completed drives with miles already counted in your running total."
                        : "Planned routes that stay visible without mixing into your visited-state total."}
                    </p>
                  </div>
                </div>
                <div className="roadTrips__tripGrid">
                  {categoryTrips.map((trip) => (
                    <article key={trip.id} className="roadTrips__tripCard card-panel">
                      <div className="roadTrips__tripHeading">
                        <div>
                          <h3 className="roadTrips__tripTitle">{trip.name}</h3>
                          {trip.description ? (
                            <p className="roadTrips__tripDescription">{trip.description}</p>
                          ) : null}
                        </div>
                        {trip.dateLabel ? (
                          <span
                            className={`roadTrips__tripPill roadTrips__tripPill--${trip.category}`}
                          >
                            {trip.dateLabel}
                          </span>
                        ) : null}
                      </div>
                      <div className="roadTrips__tripStats">
                        <span>{formatNumber(trip.miles)} miles</span>
                        <span>{trip.waypoints.length} waypoints</span>
                        <span>{getTripStateCodes(trip).length} states</span>
                      </div>
                      <p className="roadTrips__tripRoute">
                        {trip.waypoints.map((waypoint) => waypoint.name).join(" -> ")}
                      </p>
                      <div className="roadTrips__stateList">
                        {getTripStateNames(trip).map((stateName) => (
                          <span
                            key={`${trip.id}-${stateName}`}
                            className={`roadTrips__stateChip roadTrips__stateChip--${trip.category}`}
                          >
                            {stateName}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </>
      ) : null}
    </div>
  );
}

export default RoadTripShowcase;
