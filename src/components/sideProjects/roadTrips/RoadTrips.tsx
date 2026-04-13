import React, { useMemo, useState } from "react";
import L from "leaflet";
import M from "materialize-css";
import {
  getCategoryDefaultLineColor,
  getRoadTripMapTileConfig,
  ROAD_TRIP_MAP_STYLE_OPTIONS,
  RoadTripAppearanceSettings,
  resolveTripLineColor,
} from "./appearance";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { GeocodeResult, searchAddresses } from "./geocoding";
import RoadTripShowcase from "./RoadTripShowcase";
import { fetchDrivingRoute } from "./routing";
import { estimateMilesFromWaypoints, formatNumber, getTripRenderCoordinates } from "./roadTripUtils";
import {
  clearAppearanceSettings,
  clearHomeBase,
  clearSavedTrips,
  loadAppearanceSettings,
  loadHomeBase,
  loadSavedTrips,
  saveAppearanceSettings,
  saveHomeBase,
  saveTrips,
} from "./storage";
import { RoadTrip, RoadTripCategory, RoadTripWaypoint } from "./types";

const DEFAULT_EDITOR_CENTER: [number, number] = [39.5, -98.35];
const DEFAULT_EDITOR_ZOOM = 4;

function createDraggableWaypointIcon(borderColor: string) {
  return L.divIcon({
    className: "roadTrips__draggableWaypointIcon",
    html: `<span class="roadTrips__draggableWaypointDot" style="border-color: ${borderColor}; box-shadow: 0 0 0 4px ${borderColor}33;"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function buildHomeWaypoint(homeBase: RoadTripWaypoint): RoadTripWaypoint {
  return {
    ...homeBase,
    notes: homeBase.notes || "Home base",
  };
}

function createEmptyDraft(homeBase?: RoadTripWaypoint | null): RoadTrip {
  return {
    id: `draft-${Date.now()}`,
    name: "",
    category: "taken",
    miles: 0,
    waypoints: homeBase ? [buildHomeWaypoint(homeBase)] : [],
    statesCovered: [],
    dateLabel: "",
    description: "",
    lineColor: undefined,
    routeSource: "straight-line",
  };
}

function buildTripId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  return `${slug || "road-trip"}-${Date.now()}`;
}

function cloneTrip(trip: RoadTrip): RoadTrip {
  return {
    ...trip,
    statesCovered: trip.statesCovered ? [...trip.statesCovered] : [],
    waypoints: trip.waypoints.map((waypoint) => ({ ...waypoint })),
    pathCoordinates: trip.pathCoordinates ? trip.pathCoordinates.map((item) => [...item]) : undefined,
  };
}

function statesToInputValue(statesCovered: string[] | undefined): string {
  return (statesCovered ?? []).join(", ");
}

function parseStatesInput(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function DraftMapViewport({ draftTrip }: { draftTrip: RoadTrip }) {
  const map = useMap();

  React.useEffect(() => {
    const positions = getTripRenderCoordinates(draftTrip);
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [24, 24], maxZoom: 8 });
      return;
    }

    if (positions.length === 1) {
      map.setView(positions[0], 7);
      return;
    }

    map.setView(DEFAULT_EDITOR_CENTER, DEFAULT_EDITOR_ZOOM);
  }, [draftTrip, map]);

  return null;
}

function DraftMapClickHandler({
  onAddWaypoint,
}: {
  onAddWaypoint: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onAddWaypoint(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function RoadTrips() {
  const [appearanceSettings, setAppearanceSettings] = useState<RoadTripAppearanceSettings>(() =>
    loadAppearanceSettings()
  );
  const [savedTrips, setSavedTrips] = useState<RoadTrip[]>(() => loadSavedTrips());
  const [homeBase, setHomeBase] = useState<RoadTripWaypoint | null>(() => loadHomeBase());
  const [draftTrip, setDraftTrip] = useState<RoadTrip>(() =>
    createEmptyDraft(loadHomeBase())
  );
  const [isResolvingRoute, setIsResolvingRoute] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState<GeocodeResult[]>([]);
  const [isSearchingAddresses, setIsSearchingAddresses] = useState(false);
  const [isHomeSettingsOpen, setIsHomeSettingsOpen] = useState(false);
  const [homeAddressQuery, setHomeAddressQuery] = useState("");
  const [homeAddressResults, setHomeAddressResults] = useState<GeocodeResult[]>([]);
  const [isSearchingHomeAddress, setIsSearchingHomeAddress] = useState(false);

  const isEditingExistingTrip = useMemo(
    () => savedTrips.some((trip) => trip.id === draftTrip.id),
    [draftTrip.id, savedTrips]
  );
  const mapTileConfig = useMemo(
    () => getRoadTripMapTileConfig(appearanceSettings.mapStyle),
    [appearanceSettings.mapStyle]
  );
  const draggableWaypointIcon = useMemo(
    () => createDraggableWaypointIcon(appearanceSettings.waypointBorderColor),
    [appearanceSettings.waypointBorderColor]
  );

  const applySavedTrips = (nextTrips: RoadTrip[]) => {
    setSavedTrips(nextTrips);
    saveTrips(nextTrips);
  };

  const updateAppearanceSettings = (
    updater: (current: RoadTripAppearanceSettings) => RoadTripAppearanceSettings
  ) => {
    setAppearanceSettings((current) => {
      const nextSettings = updater(current);
      saveAppearanceSettings(nextSettings);
      return nextSettings;
    });
  };

  const updateDraftTrip = (updater: (current: RoadTrip) => RoadTrip) => {
    setDraftTrip((current) => updater(current));
  };

  const updateWaypoints = (
    nextWaypoints: RoadTrip["waypoints"],
    nextStateOverrides?: Partial<RoadTrip>,
    invalidateRoute = true
  ) => {
    updateDraftTrip((current) => ({
      ...current,
      ...nextStateOverrides,
      miles:
        invalidateRoute || !current.miles
          ? estimateMilesFromWaypoints(nextWaypoints)
          : current.miles,
      pathCoordinates: invalidateRoute ? undefined : current.pathCoordinates,
      routeSource: invalidateRoute ? "straight-line" : current.routeSource,
      waypoints: nextWaypoints,
    }));
  };

  const handleAddWaypoint = (latitude: number, longitude: number) => {
    const nextIndex = draftTrip.waypoints.length + 1;
    updateWaypoints([
      ...draftTrip.waypoints,
      {
        name: `Waypoint ${nextIndex}`,
        latitude: Number(latitude.toFixed(5)),
        longitude: Number(longitude.toFixed(5)),
        state: "",
      },
    ]);
  };

  const handleAddAddressResult = (result: GeocodeResult) => {
    updateWaypoints([
      ...draftTrip.waypoints,
      {
        name: result.displayName,
        latitude: Number(result.latitude.toFixed(5)),
        longitude: Number(result.longitude.toFixed(5)),
        state: result.state,
      },
    ]);
    M.toast({ html: "Added address result as a waypoint.", displayLength: 1800 });
  };

  const handleHeadBackHome = () => {
    if (!homeBase) {
      M.toast({ html: "Set a home base first using the gear icon.", displayLength: 2200 });
      return;
    }

    updateWaypoints([...draftTrip.waypoints, buildHomeWaypoint(homeBase)]);
    M.toast({ html: "Added a return-home waypoint.", displayLength: 1800 });
  };

  const handleWaypointFieldChange = (
    index: number,
    field: "name" | "state" | "notes",
    value: string
  ) => {
    const nextWaypoints = draftTrip.waypoints.map((waypoint, waypointIndex) =>
      waypointIndex === index ? { ...waypoint, [field]: value } : waypoint
    );
    updateWaypoints(nextWaypoints, {
      statesCovered:
        field === "state" && (!draftTrip.statesCovered || draftTrip.statesCovered.length === 0)
          ? nextWaypoints.map((waypoint) => waypoint.state).filter(Boolean)
          : draftTrip.statesCovered,
    }, false);
  };

  const handleWaypointDrag = (index: number, latitude: number, longitude: number) => {
    const nextWaypoints = draftTrip.waypoints.map((waypoint, waypointIndex) =>
      waypointIndex === index
        ? {
            ...waypoint,
            latitude: Number(latitude.toFixed(5)),
            longitude: Number(longitude.toFixed(5)),
          }
        : waypoint
    );
    updateWaypoints(nextWaypoints);
  };

  const moveWaypoint = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= draftTrip.waypoints.length) {
      return;
    }

    const nextWaypoints = [...draftTrip.waypoints];
    const [movedWaypoint] = nextWaypoints.splice(index, 1);
    nextWaypoints.splice(targetIndex, 0, movedWaypoint);
    updateWaypoints(nextWaypoints);
  };

  const removeWaypoint = (index: number) => {
    const nextWaypoints = draftTrip.waypoints.filter((_, waypointIndex) => waypointIndex !== index);
    updateWaypoints(nextWaypoints);
  };

  const handlePreviewRoute = async () => {
    if (draftTrip.waypoints.length < 2) {
      M.toast({ html: "Add at least two waypoints to preview a routed trip.", displayLength: 2400 });
      return;
    }

    try {
      setIsResolvingRoute(true);
      const route = await fetchDrivingRoute(draftTrip.waypoints);
      setDraftTrip((current) => ({
        ...current,
        miles: route.miles,
        pathCoordinates: route.pathCoordinates,
        routeSource: route.routeSource,
      }));
      M.toast({ html: "Updated the draft with a likely driving route.", displayLength: 2200 });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to resolve the route right now.";
      M.toast({ html: message, displayLength: 3200 });
    } finally {
      setIsResolvingRoute(false);
    }
  };

  const handleAddressSearch = async () => {
    const trimmedQuery = addressQuery.trim();
    if (!trimmedQuery) {
      setAddressResults([]);
      return;
    }

    try {
      setIsSearchingAddresses(true);
      const results = await searchAddresses(trimmedQuery);
      setAddressResults(results);
      if (results.length === 0) {
        M.toast({ html: "No matching places were found.", displayLength: 2200 });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to search addresses right now.";
      M.toast({ html: message, displayLength: 3200 });
    } finally {
      setIsSearchingAddresses(false);
    }
  };

  const handleHomeAddressSearch = async () => {
    const trimmedQuery = homeAddressQuery.trim();
    if (!trimmedQuery) {
      setHomeAddressResults([]);
      return;
    }

    try {
      setIsSearchingHomeAddress(true);
      const results = await searchAddresses(trimmedQuery);
      setHomeAddressResults(results);
      if (results.length === 0) {
        M.toast({ html: "No matching home addresses were found.", displayLength: 2200 });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to search for a home address right now.";
      M.toast({ html: message, displayLength: 3200 });
    } finally {
      setIsSearchingHomeAddress(false);
    }
  };

  const handleSetHomeBase = (result: GeocodeResult) => {
    const nextHomeBase: RoadTripWaypoint = {
      name: "Home",
      latitude: Number(result.latitude.toFixed(5)),
      longitude: Number(result.longitude.toFixed(5)),
      state: result.state,
      notes: result.displayName,
    };

    saveHomeBase(nextHomeBase);
    setHomeBase(nextHomeBase);
    setHomeAddressQuery(result.displayName);
    setHomeAddressResults([]);
    setIsHomeSettingsOpen(false);
    setDraftTrip((current) => {
      if (current.waypoints.length > 0) {
        return current;
      }

      return createEmptyDraft(nextHomeBase);
    });
    M.toast({ html: "Saved your home base for future drafts.", displayLength: 2200 });
  };

  const handleClearHomeBase = () => {
    clearHomeBase();
    setHomeBase(null);
    setHomeAddressQuery("");
    setHomeAddressResults([]);
    setDraftTrip((current) => {
      const onlyHomeWaypoint =
        current.waypoints.length === 1 && current.waypoints[0].name === "Home";
      return onlyHomeWaypoint ? createEmptyDraft(null) : current;
    });
    M.toast({ html: "Cleared the saved home base.", displayLength: 2200 });
  };

  const handleResetAppearanceSettings = () => {
    clearAppearanceSettings();
    const nextAppearanceSettings = loadAppearanceSettings();
    setAppearanceSettings(nextAppearanceSettings);
    setDraftTrip((current) => ({
      ...current,
      lineColor:
        current.lineColor &&
        current.lineColor.toLowerCase() !==
          getCategoryDefaultLineColor(current.category, appearanceSettings).toLowerCase()
          ? current.lineColor
          : undefined,
    }));
    M.toast({ html: "Reset map appearance to defaults.", displayLength: 2200 });
  };

  const handleSaveTrip = () => {
    const trimmedName = draftTrip.name.trim();
    if (!trimmedName) {
      M.toast({ html: "Give the trip a name before saving.", displayLength: 2200 });
      return;
    }

    if (draftTrip.waypoints.length < 2) {
      M.toast({ html: "Add at least two waypoints before saving.", displayLength: 2200 });
      return;
    }

    const fallbackStates = draftTrip.waypoints.map((waypoint) => waypoint.state).filter(Boolean);
    const nextTrip: RoadTrip = {
      ...cloneTrip(draftTrip),
      id: isEditingExistingTrip ? draftTrip.id : buildTripId(trimmedName),
      name: trimmedName,
      statesCovered:
        draftTrip.statesCovered && draftTrip.statesCovered.length > 0
          ? draftTrip.statesCovered
          : fallbackStates,
      lineColor:
        draftTrip.lineColor &&
        draftTrip.lineColor.toLowerCase() !==
          getCategoryDefaultLineColor(draftTrip.category, appearanceSettings).toLowerCase()
          ? draftTrip.lineColor
          : undefined,
      miles: draftTrip.miles > 0 ? draftTrip.miles : estimateMilesFromWaypoints(draftTrip.waypoints),
      routeSource:
        draftTrip.pathCoordinates && draftTrip.pathCoordinates.length >= 2
          ? draftTrip.routeSource ?? "straight-line"
          : "straight-line",
    };

    const nextTrips = isEditingExistingTrip
      ? savedTrips.map((trip) => (trip.id === nextTrip.id ? nextTrip : trip))
      : [...savedTrips, nextTrip];

    applySavedTrips(nextTrips);
    setDraftTrip(createEmptyDraft(homeBase));
    M.toast({
      html: isEditingExistingTrip ? "Trip updated in local storage." : "Trip saved to local storage.",
      displayLength: 2200,
    });
  };

  const handleEditTrip = (trip: RoadTrip) => {
    setDraftTrip(cloneTrip(trip));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteTrip = (tripId: string) => {
    const targetTrip = savedTrips.find((trip) => trip.id === tripId);
    if (!targetTrip) {
      return;
    }

    if (!window.confirm(`Delete "${targetTrip.name}" from local storage?`)) {
      return;
    }

    const nextTrips = savedTrips.filter((trip) => trip.id !== tripId);
    applySavedTrips(nextTrips);
    if (draftTrip.id === tripId) {
      setDraftTrip(createEmptyDraft(homeBase));
    }
    M.toast({ html: "Trip removed from local storage.", displayLength: 2200 });
  };

  const handleClearAllTrips = () => {
    if (!savedTrips.length) {
      return;
    }

    if (!window.confirm("Clear all locally saved road trips?")) {
      return;
    }

    clearSavedTrips();
    setSavedTrips([]);
    setDraftTrip(createEmptyDraft(homeBase));
    M.toast({ html: "Cleared all saved road trips.", displayLength: 2200 });
  };

  return (
    <div className="roadTrips">
      <section className="roadTrips__hero card-panel">
        <p className="roadTrips__eyebrow">Side Project Builder</p>
        <h1 className="roadTrips__title">Road Trip Atlas Builder</h1>
        <p className="roadTrips__intro">
          Click on the map to add waypoints, preview the likely roads between
          them, then save the trip into local browser storage. Saved trips stay
          separated into completed drives and wishlist ideas.
        </p>
        <p className="roadTrips__hint">
          Draft waypoints can be edited before saving, and routed roads are
          cached locally after they resolve.
        </p>
      </section>

      <section className="roadTrips__plannerGrid">
        <article className="roadTrips__editorCard card-panel">
          <div className="roadTrips__sectionHeader">
            <div>
              <h2 className="roadTrips__sectionTitle">Build or Edit a Trip</h2>
              <p className="roadTrips__sectionCopy">
                Click on the draft map to drop waypoints in order, then drag
                them to refine the path or edit names, states, and notes below.
              </p>
            </div>
            <div className="roadTrips__filterRow">
              <button
                type="button"
                className={`btn-flat roadTrips__settingsButton${
                  isHomeSettingsOpen ? " roadTrips__settingsButton--active" : ""
                }`}
                onClick={() => setIsHomeSettingsOpen((current) => !current)}
                aria-label="Map settings"
                title="Map settings"
              >
                <i className="material-icons">settings</i>
              </button>
              <button
                type="button"
                className="btn-flat"
                onClick={() => setDraftTrip(createEmptyDraft(homeBase))}
              >
                New draft
              </button>
              <button
                type="button"
                className="btn-flat"
                disabled={savedTrips.length === 0}
                onClick={handleClearAllTrips}
              >
                Clear saved trips
              </button>
            </div>
          </div>

          {isHomeSettingsOpen ? (
            <div className="roadTrips__homeSettings">
              <div className="roadTrips__homeSettingsHeader">
                <div>
                  <h3 className="roadTrips__homeSettingsTitle">Home Base</h3>
                  <p className="roadTrips__sectionCopy">
                    When set, new drafts start from home automatically and you can append a quick
                    return-home stop with one click.
                  </p>
                </div>
                {homeBase ? (
                  <button type="button" className="btn-flat" onClick={handleClearHomeBase}>
                    Clear home
                  </button>
                ) : null}
              </div>

              {homeBase ? (
                <p className="roadTrips__homeBaseSummary">
                  <strong>Current home:</strong> {homeBase.notes || homeBase.name}
                </p>
              ) : null}

              <div className="roadTrips__searchRow">
                <input
                  type="text"
                  value={homeAddressQuery}
                  onChange={(event) => setHomeAddressQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleHomeAddressSearch();
                    }
                  }}
                  placeholder="Search for your home address"
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    void handleHomeAddressSearch();
                  }}
                  disabled={isSearchingHomeAddress}
                >
                  {isSearchingHomeAddress ? "Searching..." : "Find home"}
                </button>
              </div>

              {homeAddressResults.length > 0 ? (
                <div className="roadTrips__searchResults">
                  {homeAddressResults.map((result) => (
                    <article
                      key={`home-${result.latitude}-${result.longitude}-${result.displayName}`}
                      className="roadTrips__searchResult"
                    >
                      <div>
                        <strong>{result.displayName}</strong>
                        <p className="roadTrips__coordinateText">
                          {result.latitude.toFixed(5)}, {result.longitude.toFixed(5)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-flat"
                        onClick={() => handleSetHomeBase(result)}
                      >
                        Set as home
                      </button>
                    </article>
                  ))}
                </div>
              ) : null}

              <div className="roadTrips__appearanceSection">
                <div className="roadTrips__homeSettingsHeader">
                  <div>
                    <h3 className="roadTrips__homeSettingsTitle">Map Appearance</h3>
                    <p className="roadTrips__sectionCopy">
                      Tune the map palette and basemap style for this browser. If a state is both
                      wishlist and completed, the completed styling wins.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-flat"
                    onClick={handleResetAppearanceSettings}
                  >
                    Reset palette
                  </button>
                </div>

                <div className="roadTrips__paletteGrid">
                  <label className="roadTrips__field">
                    <span className="roadTrips__fieldLabel">Taken line</span>
                    <input
                      type="color"
                      value={appearanceSettings.takenLineColor}
                      onChange={(event) =>
                        updateAppearanceSettings((current) => ({
                          ...current,
                          takenLineColor: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="roadTrips__field">
                    <span className="roadTrips__fieldLabel">Wishlist line</span>
                    <input
                      type="color"
                      value={appearanceSettings.wishlistLineColor}
                      onChange={(event) =>
                        updateAppearanceSettings((current) => ({
                          ...current,
                          wishlistLineColor: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="roadTrips__field">
                    <span className="roadTrips__fieldLabel">Taken state fill</span>
                    <input
                      type="color"
                      value={appearanceSettings.takenStateFillColor}
                      onChange={(event) =>
                        updateAppearanceSettings((current) => ({
                          ...current,
                          takenStateFillColor: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="roadTrips__field">
                    <span className="roadTrips__fieldLabel">Taken state border</span>
                    <input
                      type="color"
                      value={appearanceSettings.takenStateBorderColor}
                      onChange={(event) =>
                        updateAppearanceSettings((current) => ({
                          ...current,
                          takenStateBorderColor: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="roadTrips__field">
                    <span className="roadTrips__fieldLabel">Wishlist state fill</span>
                    <input
                      type="color"
                      value={appearanceSettings.wishlistStateFillColor}
                      onChange={(event) =>
                        updateAppearanceSettings((current) => ({
                          ...current,
                          wishlistStateFillColor: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="roadTrips__field">
                    <span className="roadTrips__fieldLabel">Wishlist state border</span>
                    <input
                      type="color"
                      value={appearanceSettings.wishlistStateBorderColor}
                      onChange={(event) =>
                        updateAppearanceSettings((current) => ({
                          ...current,
                          wishlistStateBorderColor: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="roadTrips__field">
                    <span className="roadTrips__fieldLabel">Neutral state fill</span>
                    <input
                      type="color"
                      value={appearanceSettings.neutralStateFillColor}
                      onChange={(event) =>
                        updateAppearanceSettings((current) => ({
                          ...current,
                          neutralStateFillColor: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="roadTrips__field">
                    <span className="roadTrips__fieldLabel">Neutral state border</span>
                    <input
                      type="color"
                      value={appearanceSettings.neutralStateBorderColor}
                      onChange={(event) =>
                        updateAppearanceSettings((current) => ({
                          ...current,
                          neutralStateBorderColor: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="roadTrips__field">
                    <span className="roadTrips__fieldLabel">Waypoint accent</span>
                    <input
                      type="color"
                      value={appearanceSettings.waypointBorderColor}
                      onChange={(event) =>
                        updateAppearanceSettings((current) => ({
                          ...current,
                          waypointBorderColor: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="roadTrips__field">
                    <span className="roadTrips__fieldLabel">Map style</span>
                    <select
                      className="browser-default"
                      value={appearanceSettings.mapStyle}
                      onChange={(event) =>
                        updateAppearanceSettings((current) => ({
                          ...current,
                          mapStyle: event.target.value as RoadTripAppearanceSettings["mapStyle"],
                        }))
                      }
                    >
                      {ROAD_TRIP_MAP_STYLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>
          ) : null}

          <div className="roadTrips__editorFields">
            <label className="roadTrips__field roadTrips__field--wide">
              <span className="roadTrips__fieldLabel">Address lookup</span>
              <div className="roadTrips__searchRow">
                <input
                  type="text"
                  value={addressQuery}
                  onChange={(event) => setAddressQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleAddressSearch();
                    }
                  }}
                  placeholder="Search for a city, park, attraction, or full address"
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    void handleAddressSearch();
                  }}
                  disabled={isSearchingAddresses}
                >
                  {isSearchingAddresses ? "Searching..." : "Search address"}
                </button>
              </div>
              <span className="roadTrips__fieldHelp">
                Manual search uses OpenStreetMap Nominatim. It is button-triggered instead of live
                autocomplete to stay within the public usage policy.
              </span>
            </label>

            {addressResults.length > 0 ? (
              <div className="roadTrips__searchResults">
                {addressResults.map((result) => (
                  <article
                    key={`${result.latitude}-${result.longitude}-${result.displayName}`}
                    className="roadTrips__searchResult"
                  >
                    <div>
                      <strong>{result.displayName}</strong>
                      <p className="roadTrips__coordinateText">
                        {result.latitude.toFixed(5)}, {result.longitude.toFixed(5)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-flat"
                      onClick={() => handleAddAddressResult(result)}
                    >
                      Add waypoint
                    </button>
                  </article>
                ))}
              </div>
            ) : null}

            <label className="roadTrips__field">
              <span className="roadTrips__fieldLabel">Trip name</span>
              <input
                type="text"
                value={draftTrip.name}
                onChange={(event) =>
                  updateDraftTrip((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Western Expedition 2018"
              />
            </label>

            <label className="roadTrips__field">
              <span className="roadTrips__fieldLabel">Date or label</span>
              <input
                type="text"
                value={draftTrip.dateLabel ?? ""}
                onChange={(event) =>
                  updateDraftTrip((current) => ({ ...current, dateLabel: event.target.value }))
                }
                placeholder="Summer 2018"
              />
            </label>

            <label className="roadTrips__field">
              <span className="roadTrips__fieldLabel">Category</span>
              <select
                className="browser-default"
                value={draftTrip.category}
                onChange={(event) => {
                  const nextCategory = event.target.value as RoadTripCategory;
                  updateDraftTrip((current) => ({
                    ...current,
                    category: nextCategory,
                    lineColor:
                      !current.lineColor ||
                      current.lineColor.toLowerCase() ===
                        getCategoryDefaultLineColor(
                          current.category,
                          appearanceSettings
                        ).toLowerCase()
                        ? getCategoryDefaultLineColor(nextCategory, appearanceSettings)
                        : current.lineColor,
                  }));
                }}
              >
                <option value="taken">Trips Taken</option>
                <option value="wishlist">Trip Wishlist</option>
              </select>
            </label>

            <label className="roadTrips__field">
              <span className="roadTrips__fieldLabel">Line color</span>
              <input
                type="color"
                value={resolveTripLineColor(
                  draftTrip.category,
                  draftTrip.lineColor,
                  appearanceSettings
                )}
                onChange={(event) =>
                  updateDraftTrip((current) => ({ ...current, lineColor: event.target.value }))
                }
              />
            </label>

            <label className="roadTrips__field roadTrips__field--wide">
              <span className="roadTrips__fieldLabel">States covered</span>
              <input
                type="text"
                value={statesToInputValue(draftTrip.statesCovered)}
                onChange={(event) =>
                  updateDraftTrip((current) => ({
                    ...current,
                    statesCovered: parseStatesInput(event.target.value),
                  }))
                }
                placeholder="IN, TX, AZ, UT, WY"
              />
            </label>

            <label className="roadTrips__field roadTrips__field--full">
              <span className="roadTrips__fieldLabel">Description</span>
              <textarea
                className="materialize-textarea"
                value={draftTrip.description ?? ""}
                onChange={(event) =>
                  updateDraftTrip((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="A cross-country family trip with desert and mountain stops."
              />
            </label>
          </div>

          <div className="roadTrips__editorActions">
            <button type="button" className="btn" onClick={handlePreviewRoute} disabled={isResolvingRoute}>
              {isResolvingRoute ? "Routing..." : "Preview likely roads"}
            </button>
            <button
              type="button"
              className="btn-flat"
              onClick={handleHeadBackHome}
              disabled={!homeBase}
            >
              Head back home
            </button>
            <button type="button" className="btn-flat" onClick={handleSaveTrip}>
              {isEditingExistingTrip ? "Update saved trip" : "Save trip locally"}
            </button>
            <span className="roadTrips__draftMeta">
              {draftTrip.waypoints.length} waypoints
              {" • "}
              {formatNumber(draftTrip.miles)} miles
            </span>
          </div>

          <div className="roadTrips__mapShell roadTrips__mapShell--editor">
            <MapContainer
              {...({
                center: DEFAULT_EDITOR_CENTER,
                zoom: DEFAULT_EDITOR_ZOOM,
                style: { height: "100%", width: "100%" },
                scrollWheelZoom: true,
              } as any)}
            >
              <DraftMapViewport draftTrip={draftTrip} />
              <DraftMapClickHandler onAddWaypoint={handleAddWaypoint} />
              <TileLayer
                {...({
                  attribution: mapTileConfig.attribution,
                  url: mapTileConfig.url,
                } as any)}
              />
              {draftTrip.waypoints.length >= 2 ? (
                <Polyline
                  {...({
                    positions: getTripRenderCoordinates(draftTrip),
                    pathOptions: {
                      color: resolveTripLineColor(
                        draftTrip.category,
                        draftTrip.lineColor,
                        appearanceSettings
                      ),
                      weight: 4,
                      opacity: 0.88,
                      dashArray: draftTrip.category === "wishlist" ? "10 10" : undefined,
                    },
                  } as any)}
                />
              ) : null}
              {draftTrip.waypoints.map((waypoint, index) => (
                <Marker
                  key={`${draftTrip.id}-${index}`}
                  {...({
                    position: [waypoint.latitude, waypoint.longitude],
                    draggable: true,
                    icon: draggableWaypointIcon,
                    eventHandlers: {
                      dragend: (event: L.LeafletEvent) => {
                        const target = event.target as L.Marker;
                        const position = target.getLatLng();
                        handleWaypointDrag(index, position.lat, position.lng);
                      },
                    },
                  } as any)}
                >
                  <Tooltip direction="top" offset={[0, -8]}>
                    {waypoint.name || `Waypoint ${index + 1}`}
                  </Tooltip>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="roadTrips__waypointList">
            {draftTrip.waypoints.length === 0 ? (
              <p className="roadTrips__sectionCopy">
                Click on the map to add your first waypoint.
              </p>
            ) : (
              draftTrip.waypoints.map((waypoint, index) => (
                <article key={`${waypoint.latitude}-${waypoint.longitude}-${index}`} className="roadTrips__waypointCard">
                  <div className="roadTrips__waypointTopRow">
                    <strong>Stop {index + 1}</strong>
                    <div className="roadTrips__waypointActions">
                      <button type="button" className="btn-flat" onClick={() => moveWaypoint(index, -1)}>
                        <i className="material-icons">arrow_upward</i>
                      </button>
                      <button type="button" className="btn-flat" onClick={() => moveWaypoint(index, 1)}>
                        <i className="material-icons">arrow_downward</i>
                      </button>
                      <button type="button" className="btn-flat" onClick={() => removeWaypoint(index)}>
                        <i className="material-icons">delete</i>
                      </button>
                    </div>
                  </div>

                  <div className="roadTrips__editorFields">
                    <label className="roadTrips__field">
                      <span className="roadTrips__fieldLabel">Waypoint name</span>
                      <input
                        type="text"
                        value={waypoint.name}
                        onChange={(event) =>
                          handleWaypointFieldChange(index, "name", event.target.value)
                        }
                      />
                    </label>

                    <label className="roadTrips__field">
                      <span className="roadTrips__fieldLabel">State</span>
                      <input
                        type="text"
                        value={waypoint.state}
                        onChange={(event) =>
                          handleWaypointFieldChange(index, "state", event.target.value)
                        }
                        placeholder="IN"
                      />
                    </label>

                    <label className="roadTrips__field roadTrips__field--full">
                      <span className="roadTrips__fieldLabel">Notes</span>
                      <input
                        type="text"
                        value={waypoint.notes ?? ""}
                        onChange={(event) =>
                          handleWaypointFieldChange(index, "notes", event.target.value)
                        }
                        placeholder="What made this stop memorable?"
                      />
                    </label>
                  </div>

                  <p className="roadTrips__coordinateText">
                    {waypoint.latitude.toFixed(5)}, {waypoint.longitude.toFixed(5)}
                  </p>
                </article>
              ))
            )}
          </div>
        </article>

        <article className="roadTrips__libraryCard card-panel">
          <h2 className="roadTrips__sectionTitle">Saved Trip Library</h2>
          <p className="roadTrips__sectionCopy">
            These trips are stored in this browser&apos;s local storage and immediately show up in
            the atlas below.
          </p>

          {savedTrips.length === 0 ? (
            <p className="roadTrips__sectionCopy">
              No trips saved yet. Build one on the left and save it locally.
            </p>
          ) : (
            <div className="roadTrips__savedTripList">
              {savedTrips.map((trip) => (
                <article key={trip.id} className="roadTrips__savedTripItem">
                  <div>
                    <strong>{trip.name}</strong>
                    <p className="roadTrips__sectionCopy">
                      {trip.category === "taken" ? "Trips Taken" : "Trip Wishlist"}
                      {" • "}
                      {formatNumber(trip.miles)} miles
                      {" • "}
                      {trip.waypoints.length} waypoints
                    </p>
                  </div>
                  <div className="roadTrips__savedTripActions">
                    <button type="button" className="btn-flat" onClick={() => handleEditTrip(trip)}>
                      Edit
                    </button>
                    <button type="button" className="btn-flat" onClick={() => handleDeleteTrip(trip.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>

      <RoadTripShowcase
        title="Your Saved Road Trip Atlas"
        intro="Everything saved in this browser renders here with cumulative miles, trip counts, and visited-state coverage."
        trips={savedTrips}
        appearanceSettings={appearanceSettings}
        showHint={false}
      />
    </div>
  );
}

export default RoadTrips;
