import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import M from "materialize-css";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import {
  getCategoryDefaultLineColor,
  getRoadTripMapTileConfig,
  ROAD_TRIP_MAP_STYLE_OPTIONS,
  RoadTripAppearanceSettings,
  resolveTripLineColor,
} from "./appearance";
import { GeocodeResult, searchAddresses } from "./geocoding";
import RoadTripShowcase from "./RoadTripShowcase";
import { buildRouteCacheKey, fetchDrivingRoute } from "./routing";
import { buildShareableRoadTripUrl, parseSharedRoadTripPayload } from "./share";
import {
  estimateMilesFromWaypoints,
  formatNumber,
  getTripRenderCoordinates,
} from "./roadTripUtils";
import {
  clearAppearanceSettings,
  clearHomeBase,
  loadAppearanceSettings,
  loadHomeBase,
  loadSavedTrips,
  saveAppearanceSettings,
  saveHomeBase,
  sanitizeRoadTrip,
  saveTrips,
} from "./storage";
import { RoadTrip, RoadTripCategory, RoadTripWaypoint } from "./types";
import "./RoadTrips.css";

type RoadTripsView = "atlas" | "manage";

interface RoadTripsProps {
  navWrapperRef?: React.RefObject<HTMLDivElement>;
}

interface ModalShellProps {
  title: string;
  description?: string;
  narrow?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const DEFAULT_EDITOR_CENTER: [number, number] = [39.5, -98.35];
const DEFAULT_EDITOR_ZOOM = 4;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function calculateWaypointDistanceMiles(
  start: Pick<RoadTripWaypoint, "latitude" | "longitude">,
  end: Pick<RoadTripWaypoint, "latitude" | "longitude">,
): number {
  const earthRadiusMiles = 3958.7613;
  const latitudeDelta = toRadians(end.latitude - start.latitude);
  const longitudeDelta = toRadians(end.longitude - start.longitude);
  const startLatitudeRadians = toRadians(start.latitude);
  const endLatitudeRadians = toRadians(end.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(startLatitudeRadians) *
      Math.cos(endLatitudeRadians) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);
  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadiusMiles * arc;
}

function getWaypointInsertionIndex(
  waypoints: RoadTripWaypoint[],
  nextWaypoint: RoadTripWaypoint,
): number {
  if (waypoints.length < 2) {
    return waypoints.length;
  }

  let bestInsertionIndex = waypoints.length;
  let lowestAddedDistance = Number.POSITIVE_INFINITY;

  for (
    let insertionIndex = 0;
    insertionIndex <= waypoints.length;
    insertionIndex += 1
  ) {
    const previousWaypoint = waypoints[insertionIndex - 1];
    const followingWaypoint = waypoints[insertionIndex];

    let addedDistance = 0;

    if (previousWaypoint) {
      addedDistance += calculateWaypointDistanceMiles(
        previousWaypoint,
        nextWaypoint,
      );
    }

    if (followingWaypoint) {
      addedDistance += calculateWaypointDistanceMiles(
        nextWaypoint,
        followingWaypoint,
      );
    }

    if (previousWaypoint && followingWaypoint) {
      addedDistance -= calculateWaypointDistanceMiles(
        previousWaypoint,
        followingWaypoint,
      );
    }

    if (addedDistance < lowestAddedDistance) {
      lowestAddedDistance = addedDistance;
      bestInsertionIndex = insertionIndex;
    }
  }

  return bestInsertionIndex;
}

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

function buildImportedSharedTripId(name: string): string {
  return `shared-${buildTripId(name)}`;
}

function cloneTrip(trip: RoadTrip): RoadTrip {
  return {
    ...trip,
    statesCovered: trip.statesCovered ? [...trip.statesCovered] : [],
    waypoints: trip.waypoints.map((waypoint) => ({ ...waypoint })),
    pathCoordinates: trip.pathCoordinates
      ? trip.pathCoordinates.map((item) => [...item])
      : undefined,
  };
}

function stripResolvedRouteData(trip: RoadTrip): RoadTrip {
  return {
    ...cloneTrip(trip),
    pathCoordinates: undefined,
    routeSource:
      trip.routeSource === "straight-line" ? "straight-line" : undefined,
  };
}

function buildShareableTripSnapshot(trip: RoadTrip): RoadTrip {
  return stripResolvedRouteData({
    ...cloneTrip(trip),
    name: trip.name.trim(),
    isShared: undefined,
    miles:
      trip.miles > 0 ? trip.miles : estimateMilesFromWaypoints(trip.waypoints),
  });
}

function buildImportedSharedTrip(sharedTrip: RoadTrip): RoadTrip {
  const sanitizedTrip = sanitizeRoadTrip(sharedTrip);
  const baseTrip = sanitizedTrip
    ? stripResolvedRouteData(sanitizedTrip)
    : createEmptyDraft(null);
  const trimmedName = baseTrip.name.trim() || "Shared trip";

  return {
    ...baseTrip,
    id: buildImportedSharedTripId(trimmedName),
    name: trimmedName,
    isShared: true,
  };
}

function DraftMapViewport({ draftTrip }: { draftTrip: RoadTrip }) {
  const map = useMap();

  useEffect(() => {
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

function ModalShell({
  title,
  description,
  narrow = false,
  onClose,
  children,
}: ModalShellProps) {
  return (
    <div
      className="roadTrips__modalBackdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`roadTrips__modalCard card-panel${narrow ? " roadTrips__modalCard--narrow" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="roadTrips__sectionHeader">
          <div>
            <h2 className="roadTrips__sectionTitle">{title}</h2>
            {description ? (
              <p className="roadTrips__sectionCopy">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="btn-flat"
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            <i className="material-icons">close</i>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RoadTrips({ navWrapperRef: _navWrapperRef }: RoadTripsProps) {
  const [currentView, setCurrentView] = useState<RoadTripsView>("atlas");
  const [appearanceSettings, setAppearanceSettings] =
    useState<RoadTripAppearanceSettings>(() => loadAppearanceSettings());
  const [savedTrips, setSavedTrips] = useState<RoadTrip[]>(() =>
    loadSavedTrips().map(stripResolvedRouteData),
  );
  const [homeBase, setHomeBase] = useState<RoadTripWaypoint | null>(() =>
    loadHomeBase(),
  );
  const [draftTrip, setDraftTrip] = useState<RoadTrip>(() =>
    createEmptyDraft(loadHomeBase()),
  );
  const [draggedWaypointIndex, setDraggedWaypointIndex] = useState<
    number | null
  >(null);
  const [editingWaypointIndex, setEditingWaypointIndex] = useState<
    number | null
  >(null);
  const [waypointEditor, setWaypointEditor] = useState<RoadTripWaypoint | null>(
    null,
  );
  const [isResolvingRoute, setIsResolvingRoute] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState<GeocodeResult[]>([]);
  const [isSearchingAddresses, setIsSearchingAddresses] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTripLibraryOpen, setIsTripLibraryOpen] = useState(false);
  const [homeAddressQuery, setHomeAddressQuery] = useState("");
  const [homeAddressResults, setHomeAddressResults] = useState<GeocodeResult[]>(
    [],
  );
  const [isSearchingHomeAddress, setIsSearchingHomeAddress] = useState(false);
  const routeRequestSequenceRef = useRef(0);
  const latestDraftWaypointsRef = useRef(draftTrip.waypoints);

  const isEditingExistingTrip = useMemo(
    () => savedTrips.some((trip) => trip.id === draftTrip.id),
    [draftTrip.id, savedTrips],
  );
  const isSaveDisabled = draftTrip.name.trim().length === 0;
  const saveDisabledReason = "Add a trip name before saving.";
  const isShareDisabled =
    draftTrip.name.trim().length === 0 || draftTrip.waypoints.length < 2;
  const shareDisabledReason =
    draftTrip.name.trim().length === 0
      ? "Add a trip name before sharing."
      : "Add at least two waypoints before sharing.";
  const mapTileConfig = useMemo(
    () => getRoadTripMapTileConfig(appearanceSettings.mapStyle),
    [appearanceSettings.mapStyle],
  );
  const draggableWaypointIcon = useMemo(
    () => createDraggableWaypointIcon(appearanceSettings.waypointBorderColor),
    [appearanceSettings.waypointBorderColor],
  );
  const draftLineColor = useMemo(
    () =>
      resolveTripLineColor(
        draftTrip.category,
        draftTrip.lineColor,
        appearanceSettings,
      ),
    [appearanceSettings, draftTrip.category, draftTrip.lineColor],
  );
  const draftRouteKey = useMemo(
    () => buildRouteCacheKey(draftTrip.waypoints),
    [draftTrip.waypoints],
  );

  useEffect(() => {
    latestDraftWaypointsRef.current = draftTrip.waypoints;
  }, [draftTrip.waypoints]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const sharedPayload = parseSharedRoadTripPayload(window.location.search);
    if (!sharedPayload?.trip) {
      return;
    }

    const importedTrip = buildImportedSharedTrip(sharedPayload.trip);
    if (importedTrip.waypoints.length < 2) {
      M.toast({
        html: "That shared trip link didn't contain enough waypoint data.",
        displayLength: 2800,
      });
      return;
    }

    setSavedTrips((current) => {
      const nextTrips = [importedTrip, ...current];
      saveTrips(nextTrips);
      return nextTrips;
    });
    setDraftTrip(importedTrip);
    setCurrentView("manage");

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("roadTripShare");
    window.history.replaceState({}, document.title, nextUrl.toString());

    M.toast({
      html: `Saved shared trip "${importedTrip.name}" to this browser.`,
      displayLength: 2800,
    });
  }, []);

  useEffect(() => {
    if (
      !(isSettingsOpen || isTripLibraryOpen || editingWaypointIndex !== null)
    ) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (editingWaypointIndex !== null) {
        setEditingWaypointIndex(null);
        setWaypointEditor(null);
        return;
      }

      if (isTripLibraryOpen) {
        setIsTripLibraryOpen(false);
        return;
      }

      if (isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingWaypointIndex, isSettingsOpen, isTripLibraryOpen]);

  const applySavedTrips = (nextTrips: RoadTrip[]) => {
    const normalizedTrips = nextTrips.map(stripResolvedRouteData);
    setSavedTrips(normalizedTrips);
    saveTrips(normalizedTrips);
  };

  const updateAppearanceSettings = (
    updater: (
      current: RoadTripAppearanceSettings,
    ) => RoadTripAppearanceSettings,
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
    nextWaypoints: RoadTripWaypoint[],
    nextStateOverrides?: Partial<RoadTrip>,
    invalidateRoute = true,
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

  const handleStartNewDraft = () => {
    setDraftTrip(createEmptyDraft(homeBase));
    setEditingWaypointIndex(null);
    setWaypointEditor(null);
    setAddressResults([]);
  };

  const handleAddWaypoint = (latitude: number, longitude: number) => {
    const nextWaypoint: RoadTripWaypoint = {
      name: `Waypoint ${draftTrip.waypoints.length + 1}`,
      latitude: Number(latitude.toFixed(5)),
      longitude: Number(longitude.toFixed(5)),
      state: "",
    };
    const insertionIndex = getWaypointInsertionIndex(
      draftTrip.waypoints,
      nextWaypoint,
    );
    const nextWaypoints = [...draftTrip.waypoints];

    nextWaypoints.splice(insertionIndex, 0, nextWaypoint);
    updateWaypoints(nextWaypoints);
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
    M.toast({
      html: "Added address result as a waypoint.",
      displayLength: 1800,
    });
  };

  const handleHeadBackHome = () => {
    if (!homeBase) {
      M.toast({
        html: "Set a home base first in settings.",
        displayLength: 2200,
      });
      return;
    }

    updateWaypoints([...draftTrip.waypoints, buildHomeWaypoint(homeBase)]);
    M.toast({ html: "Added a return-home waypoint.", displayLength: 1800 });
  };

  const handleWaypointDrag = (
    index: number,
    latitude: number,
    longitude: number,
  ) => {
    const nextWaypoints = draftTrip.waypoints.map((waypoint, waypointIndex) =>
      waypointIndex === index
        ? {
            ...waypoint,
            latitude: Number(latitude.toFixed(5)),
            longitude: Number(longitude.toFixed(5)),
          }
        : waypoint,
    );
    updateWaypoints(nextWaypoints);
    if (editingWaypointIndex === index && waypointEditor) {
      setWaypointEditor({
        ...waypointEditor,
        latitude: Number(latitude.toFixed(5)),
        longitude: Number(longitude.toFixed(5)),
      });
    }
  };

  const reorderWaypoint = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= draftTrip.waypoints.length ||
      toIndex >= draftTrip.waypoints.length
    ) {
      return;
    }

    const nextWaypoints = [...draftTrip.waypoints];
    const [movedWaypoint] = nextWaypoints.splice(fromIndex, 1);
    nextWaypoints.splice(toIndex, 0, movedWaypoint);
    updateWaypoints(nextWaypoints);
  };

  const removeWaypoint = (index: number) => {
    const nextWaypoints = draftTrip.waypoints.filter(
      (_, waypointIndex) => waypointIndex !== index,
    );
    updateWaypoints(nextWaypoints);
    if (editingWaypointIndex === index) {
      setEditingWaypointIndex(null);
      setWaypointEditor(null);
    }
  };

  const handleOpenWaypointEditor = (index: number) => {
    setEditingWaypointIndex(index);
    setWaypointEditor({ ...draftTrip.waypoints[index] });
  };

  const handleSaveWaypointEditor = () => {
    if (editingWaypointIndex === null || !waypointEditor) {
      return;
    }

    const normalizedWaypoint: RoadTripWaypoint = {
      ...waypointEditor,
      name:
        waypointEditor.name.trim() || `Waypoint ${editingWaypointIndex + 1}`,
      state: waypointEditor.state.trim(),
      notes: waypointEditor.notes?.trim() || undefined,
    };

    const nextWaypoints = draftTrip.waypoints.map((waypoint, waypointIndex) =>
      waypointIndex === editingWaypointIndex ? normalizedWaypoint : waypoint,
    );

    updateWaypoints(
      nextWaypoints,
      {
        statesCovered:
          !draftTrip.statesCovered || draftTrip.statesCovered.length === 0
            ? nextWaypoints.map((waypoint) => waypoint.state).filter(Boolean)
            : draftTrip.statesCovered,
      },
      false,
    );
    setEditingWaypointIndex(null);
    setWaypointEditor(null);
  };

  const resolveDraftRoute = async (
    waypoints: RoadTripWaypoint[],
    options?: {
      showSuccessToast?: boolean;
      showFailureToast?: boolean;
      showNeedMoreWaypointsToast?: boolean;
    },
  ) => {
    const {
      showSuccessToast = false,
      showFailureToast = false,
      showNeedMoreWaypointsToast = false,
    } = options ?? {};

    if (waypoints.length < 2) {
      if (showNeedMoreWaypointsToast) {
        M.toast({
          html: "Add at least two waypoints to preview a routed trip.",
          displayLength: 2400,
        });
      }
      return;
    }

    const requestWaypoints = waypoints.map((waypoint) => ({ ...waypoint }));
    const routeKey = buildRouteCacheKey(requestWaypoints);
    const requestSequence = routeRequestSequenceRef.current + 1;
    routeRequestSequenceRef.current = requestSequence;

    try {
      setIsResolvingRoute(true);
      const route = await fetchDrivingRoute(requestWaypoints);
      setDraftTrip((current) =>
        buildRouteCacheKey(current.waypoints) === routeKey
          ? {
              ...current,
              miles: route.miles,
              pathCoordinates: route.pathCoordinates,
              routeSource: route.routeSource,
            }
          : current,
      );

      if (
        showSuccessToast &&
        routeRequestSequenceRef.current === requestSequence
      ) {
        M.toast({
          html: "Updated the draft with a likely driving route.",
          displayLength: 2200,
        });
      }
    } catch (error) {
      if (
        showFailureToast &&
        routeRequestSequenceRef.current === requestSequence
      ) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to resolve the route right now.";
        M.toast({ html: message, displayLength: 3200 });
      }
    } finally {
      if (routeRequestSequenceRef.current === requestSequence) {
        setIsResolvingRoute(false);
      }
    }
  };

  useEffect(() => {
    if (currentView !== "manage" || draftTrip.waypoints.length < 2) {
      return;
    }

    if (draftTrip.routeSource === "osrm" && draftTrip.pathCoordinates?.length) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void resolveDraftRoute(latestDraftWaypointsRef.current);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [
    currentView,
    draftRouteKey,
    draftTrip.id,
    draftTrip.pathCoordinates,
    draftTrip.routeSource,
    draftTrip.waypoints.length,
  ]);

  const handlePreviewRoute = async () => {
    if (draftTrip.waypoints.length < 2) {
      M.toast({
        html: "Add at least two waypoints to preview a routed trip.",
        displayLength: 2400,
      });
      return;
    }

    await resolveDraftRoute(draftTrip.waypoints, {
      showSuccessToast: true,
      showFailureToast: true,
      showNeedMoreWaypointsToast: true,
    });
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
        M.toast({
          html: "No matching places were found.",
          displayLength: 2200,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to search addresses right now.";
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
        M.toast({
          html: "No matching home addresses were found.",
          displayLength: 2200,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to search for a home address right now.";
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
    setDraftTrip((current) => {
      if (current.waypoints.length > 0) {
        return current;
      }

      return createEmptyDraft(nextHomeBase);
    });
    M.toast({
      html: "Saved your home base for future drafts.",
      displayLength: 2200,
    });
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
    setDraftTrip((current) => {
      const currentDefaultColor = getCategoryDefaultLineColor(
        current.category,
        appearanceSettings,
      );
      return {
        ...current,
        lineColor:
          current.lineColor &&
          current.lineColor.toLowerCase() !== currentDefaultColor.toLowerCase()
            ? current.lineColor
            : undefined,
      };
    });
    M.toast({ html: "Reset map appearance to defaults.", displayLength: 2200 });
  };

  const handleSaveTrip = () => {
    const trimmedName = draftTrip.name.trim();
    if (!trimmedName) {
      M.toast({
        html: "Give the trip a name before saving.",
        displayLength: 2200,
      });
      return;
    }

    if (draftTrip.waypoints.length < 2) {
      M.toast({
        html: "Add at least two waypoints before saving.",
        displayLength: 2200,
      });
      return;
    }

    const fallbackStates = draftTrip.waypoints
      .map((waypoint) => waypoint.state)
      .filter(Boolean);
    const nextTrip: RoadTrip = stripResolvedRouteData({
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
          getCategoryDefaultLineColor(
            draftTrip.category,
            appearanceSettings,
          ).toLowerCase()
          ? draftTrip.lineColor
          : undefined,
      miles:
        draftTrip.miles > 0
          ? draftTrip.miles
          : estimateMilesFromWaypoints(draftTrip.waypoints),
      routeSource: "straight-line",
    });

    const nextTrips = isEditingExistingTrip
      ? savedTrips.map((trip) => (trip.id === nextTrip.id ? nextTrip : trip))
      : [...savedTrips, nextTrip];

    applySavedTrips(nextTrips);
    setDraftTrip(createEmptyDraft(homeBase));
    M.toast({
      html: isEditingExistingTrip
        ? "Trip updated in local storage."
        : "Trip saved to local storage.",
      displayLength: 2200,
    });
  };

  const handleShareTrip = async () => {
    const trimmedName = draftTrip.name.trim();
    if (!trimmedName) {
      M.toast({
        html: "Add a trip name before sharing.",
        displayLength: 2200,
      });
      return;
    }

    if (draftTrip.waypoints.length < 2) {
      M.toast({
        html: "Add at least two waypoints before sharing.",
        displayLength: 2200,
      });
      return;
    }

    const shareUrl = buildShareableRoadTripUrl({
      currentUrl: window.location.href,
      trip: buildShareableTripSnapshot({
        ...draftTrip,
        name: trimmedName,
      }),
    });

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${trimmedName} road trip`,
          text: `Take a look at this road trip: ${trimmedName}.`,
          url: shareUrl,
        });
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      M.toast({
        html: "Share link copied. Send it to someone and it will save into their atlas.",
        displayLength: 3000,
      });
    } catch (error) {
      M.toast({
        html: "Couldn't copy the share link automatically.",
        displayLength: 2500,
      });
    }
  };

  const handleLoadTrip = (trip: RoadTrip) => {
    setDraftTrip(cloneTrip(trip));
    setIsTripLibraryOpen(false);
    setCurrentView("manage");
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

  const settingsButton = (
    <button
      type="button"
      className={`btn-flat roadTrips__settingsButton${isSettingsOpen ? " roadTrips__settingsButton--active" : ""}`}
      onClick={() => setIsSettingsOpen(true)}
      aria-label="Open map settings"
      title="Map settings"
    >
      <i className="material-icons">settings</i>
    </button>
  );

  return (
    <div className="roadTrips">
      <section className="roadTrips__topNav card-panel">
        <div
          className="roadTrips__tabBar"
          role="tablist"
          aria-label="Road trip views"
        >
          <button
            type="button"
            className={`roadTrips__tabButton${currentView === "atlas" ? " roadTrips__tabButton--active" : ""}`}
            aria-pressed={currentView === "atlas"}
            onClick={() => setCurrentView("atlas")}
          >
            Atlas
          </button>
          <button
            type="button"
            className={`roadTrips__tabButton${currentView === "manage" ? " roadTrips__tabButton--active" : ""}`}
            aria-pressed={currentView === "manage"}
            onClick={() => setCurrentView("manage")}
          >
            Make / Edit Trips
          </button>
        </div>
        <p className="roadTrips__sectionCopy roadTrips__topNavCopy">
          Local trips stay in this browser, while the homepage snapshot remains
          driven by shipped data.
        </p>
      </section>

      {currentView === "atlas" ? (
        <RoadTripShowcase
          title="Your Saved Road Trip Atlas"
          intro="Everything saved in this browser renders here with cumulative miles, trip counts, state completion, and exact routes cached locally so repeat visits load faster."
          trips={savedTrips}
          appearanceSettings={appearanceSettings}
          headerActions={settingsButton}
          showImageExport
          showHint={false}
        />
      ) : (
        <>
          <section className="roadTrips__hero card-panel">
            <div className="roadTrips__sectionHeader">
              <div>
                <p className="roadTrips__eyebrow">Side Project Builder</p>
                <h1 className="roadTrips__title">Build or Edit a Trip</h1>
                <p className="roadTrips__intro">
                  Click the map to add stops, drag waypoint markers to refine
                  the route, search for addresses when you know the place name,
                  and share a trip link that saves into someone else's atlas.
                </p>
              </div>
              <div className="roadTrips__heroActions">
                {settingsButton}
                <button
                  type="button"
                  className="btn-flat"
                  disabled={savedTrips.length === 0}
                  onClick={() => setIsTripLibraryOpen(true)}
                >
                  Load trip
                </button>
                <button
                  type="button"
                  className="btn-flat"
                  onClick={handleStartNewDraft}
                >
                  New draft
                </button>
              </div>
            </div>
          </section>

          <section className="roadTrips__manageLayout">
            <article className="roadTrips__editorCard card-panel">
              <div className="roadTrips__sectionHeader">
                <div>
                  <h2 className="roadTrips__sectionTitle">Trip Details</h2>
                  <p className="roadTrips__sectionCopy">
                    Save only waypoint data, then let the atlas calculate exact
                    road geometry when it is viewed.
                  </p>
                </div>
                <div className="roadTrips__tripPills">
                  {isEditingExistingTrip ? (
                    <span className="roadTrips__tripPill roadTrips__tripPill--taken">
                      Editing saved trip
                    </span>
                  ) : null}
                  {draftTrip.isShared ? (
                    <span className="roadTrips__tripPill roadTrips__tripPill--shared">
                      Shared trip
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="roadTrips__editorFields">
                <label className="roadTrips__field">
                  <span className="roadTrips__fieldLabel">Trip name</span>
                  <input
                    type="text"
                    value={draftTrip.name}
                    onChange={(event) =>
                      updateDraftTrip((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
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
                      updateDraftTrip((current) => ({
                        ...current,
                        dateLabel: event.target.value,
                      }))
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
                      const nextCategory = event.target
                        .value as RoadTripCategory;
                      updateDraftTrip((current) => ({
                        ...current,
                        category: nextCategory,
                        lineColor:
                          !current.lineColor ||
                          current.lineColor.toLowerCase() ===
                            getCategoryDefaultLineColor(
                              current.category,
                              appearanceSettings,
                            ).toLowerCase()
                            ? undefined
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
                    value={draftLineColor}
                    onChange={(event) =>
                      updateDraftTrip((current) => ({
                        ...current,
                        lineColor: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="roadTrips__field roadTrips__field--full">
                  <span className="roadTrips__fieldLabel">Description</span>
                  <textarea
                    className="materialize-textarea"
                    value={draftTrip.description ?? ""}
                    onChange={(event) =>
                      updateDraftTrip((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="A cross-country family trip with desert and mountain stops."
                  />
                </label>
              </div>

              <div className="roadTrips__editorActions">
                <button
                  type="button"
                  className="btn"
                  onClick={handlePreviewRoute}
                  disabled={isResolvingRoute}
                >
                  {isResolvingRoute ? "Calculating..." : "Refresh route now"}
                </button>
                <button
                  type="button"
                  className="btn-flat"
                  onClick={handleHeadBackHome}
                  disabled={!homeBase}
                >
                  Head back home
                </button>
                <span
                  className="roadTrips__buttonTooltipWrapper"
                  title={isShareDisabled ? shareDisabledReason : undefined}
                >
                  <button
                    type="button"
                    className="btn-flat roadTrips__shareButton"
                    onClick={() => {
                      void handleShareTrip();
                    }}
                    disabled={isShareDisabled}
                  >
                    <i className="material-icons tiny">ios_share</i>
                    Share trip
                  </button>
                </span>
                <span
                  className="roadTrips__buttonTooltipWrapper"
                  title={isSaveDisabled ? saveDisabledReason : undefined}
                >
                  <button
                    type="button"
                    className="btn roadTrips__saveButton"
                    onClick={handleSaveTrip}
                    disabled={isSaveDisabled}
                    aria-label={
                      isSaveDisabled
                        ? `${isEditingExistingTrip ? "Update saved trip" : "Save trip locally"} unavailable: ${saveDisabledReason}`
                        : undefined
                    }
                  >
                    {isEditingExistingTrip
                      ? "Update saved trip"
                      : "Save trip locally"}
                  </button>
                </span>
                <span className="roadTrips__draftMeta">
                  {draftTrip.waypoints.length} waypoints /{" "}
                  {formatNumber(draftTrip.miles)} miles
                </span>
                <span className="roadTrips__draftMeta">
                  Exact roads update automatically after waypoint changes.
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
                          color: draftLineColor,
                          weight: 4,
                          opacity: 0.88,
                          dashArray:
                            draftTrip.category === "wishlist"
                              ? "10 10"
                              : undefined,
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
                            handleWaypointDrag(
                              index,
                              position.lat,
                              position.lng,
                            );
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
              <section className="roadTrips__waypointSection">
                <div className="roadTrips__sectionHeader roadTrips__sectionHeader--stacked">
                  <div>
                    <h3 className="roadTrips__sectionTitle">Waypoints</h3>
                    <p className="roadTrips__sectionCopy">
                      Add stops by clicking the map or searching for a place,
                      then drag the rows to reorder them. Use Edit for names,
                      notes, and state details.
                    </p>
                  </div>
                </div>
                <div className="roadTrips__editorFields">
                  <label className="roadTrips__field roadTrips__field--wide">
                    <span className="roadTrips__fieldLabel">
                      Address lookup
                    </span>
                    <div className="roadTrips__searchRow">
                      <input
                        type="text"
                        value={addressQuery}
                        onChange={(event) =>
                          setAddressQuery(event.target.value)
                        }
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
                        {isSearchingAddresses
                          ? "Searching..."
                          : "Search address"}
                      </button>
                    </div>
                    <span className="roadTrips__fieldHelp">
                      Search is button-triggered to stay friendly to the public
                      OpenStreetMap Nominatim policy.
                    </span>
                  </label>

                  {addressResults.length > 0 ? (
                    <div className="roadTrips__lookupPanel roadTrips__lookupPanel--results">
                      <div className="roadTrips__miniSectionHeader">
                        <span className="roadTrips__miniSectionEyebrow">
                          Search results
                        </span>
                        <span className="roadTrips__miniSectionCount">
                          {addressResults.length} match
                          {addressResults.length === 1 ? "" : "es"}
                        </span>
                      </div>
                      <div className="roadTrips__searchResults">
                        {addressResults.map((result) => (
                          <article
                            key={`${result.latitude}-${result.longitude}-${result.displayName}`}
                            className="roadTrips__searchResult"
                          >
                            <div>
                              <strong>{result.displayName}</strong>
                              <p className="roadTrips__coordinateText">
                                {result.latitude.toFixed(5)},{" "}
                                {result.longitude.toFixed(5)}
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
                    </div>
                  ) : null}
                </div>
                <div className="roadTrips__lookupDivider" aria-hidden="true">
                  <span className="roadTrips__lookupDividerLine" />
                  <span className="roadTrips__lookupDividerLabel">
                    Current trip stops
                  </span>
                  <span className="roadTrips__lookupDividerLine" />
                </div>
                <div className="roadTrips__lookupPanel roadTrips__lookupPanel--waypoints">
                  <div className="roadTrips__miniSectionHeader">
                    <span className="roadTrips__miniSectionEyebrow">
                      Active waypoints
                    </span>
                    <span className="roadTrips__miniSectionCount">
                      {draftTrip.waypoints.length} stop
                      {draftTrip.waypoints.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="roadTrips__compactWaypointList">
                    {draftTrip.waypoints.length === 0 ? (
                      <p className="roadTrips__sectionCopy roadTrips__emptyState">
                        Click on the map or use address lookup to add your first
                        waypoint.
                      </p>
                    ) : (
                      draftTrip.waypoints.map((waypoint, index) => (
                        <article
                          key={`${waypoint.latitude}-${waypoint.longitude}-${index}`}
                          className={`roadTrips__compactWaypointCard${draggedWaypointIndex === index ? " roadTrips__compactWaypointCard--dragging" : ""}`}
                          draggable
                          onDragStart={() => setDraggedWaypointIndex(index)}
                          onDragEnd={() => setDraggedWaypointIndex(null)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => {
                            if (draggedWaypointIndex === null) {
                              return;
                            }

                            reorderWaypoint(draggedWaypointIndex, index);
                            setDraggedWaypointIndex(null);
                          }}
                        >
                          <button
                            type="button"
                            className="btn-flat roadTrips__dragHandle"
                            aria-label={`Drag waypoint ${index + 1}`}
                            title="Drag to reorder"
                          >
                            <i className="material-icons">drag_indicator</i>
                          </button>
                          <div className="roadTrips__compactWaypointMain">
                            <strong>
                              Stop {index + 1}:{" "}
                              {waypoint.name || `Waypoint ${index + 1}`}
                            </strong>
                            <p className="roadTrips__compactWaypointMeta">
                              {waypoint.state || "State not set"} /{" "}
                              {waypoint.latitude.toFixed(5)},{" "}
                              {waypoint.longitude.toFixed(5)}
                            </p>
                          </div>
                          <div className="roadTrips__waypointActions">
                            <button
                              type="button"
                              className="btn-flat"
                              onClick={() => handleOpenWaypointEditor(index)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-flat"
                              onClick={() => removeWaypoint(index)}
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </article>
          </section>
        </>
      )}

      {isSettingsOpen ? (
        <ModalShell
          title="Map Settings"
          description="Home base and palette settings live in one place so the atlas and trip builder stay in sync."
          onClose={() => setIsSettingsOpen(false)}
        >
          <div className="roadTrips__homeSettings">
            <div className="roadTrips__homeSettingsHeader">
              <div>
                <h3 className="roadTrips__homeSettingsTitle">Home Base</h3>
                <p className="roadTrips__sectionCopy">
                  New drafts start at home when it is set, and the builder can
                  quickly append a return-home stop.
                </p>
              </div>
              {homeBase ? (
                <button
                  type="button"
                  className="btn-flat"
                  onClick={handleClearHomeBase}
                >
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
                        {result.latitude.toFixed(5)},{" "}
                        {result.longitude.toFixed(5)}
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
          </div>

          <div className="roadTrips__appearanceSection">
            <div className="roadTrips__sectionHeader">
              <div>
                <h3 className="roadTrips__homeSettingsTitle">Map Palette</h3>
                <p className="roadTrips__sectionCopy">
                  Tune the lines, state colors, waypoint accent, and basemap in
                  one shared settings panel.
                </p>
              </div>
              <button
                type="button"
                className="btn-flat"
                onClick={handleResetAppearanceSettings}
              >
                Reset defaults
              </button>
            </div>

            <div className="roadTrips__paletteGrid">
              <label className="roadTrips__field">
                <span className="roadTrips__fieldLabel">Taken trip line</span>
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
                <span className="roadTrips__fieldLabel">
                  Wishlist trip line
                </span>
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
                <span className="roadTrips__fieldLabel">
                  Taken state border
                </span>
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
                <span className="roadTrips__fieldLabel">
                  Wishlist state fill
                </span>
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
                <span className="roadTrips__fieldLabel">
                  Wishlist state border
                </span>
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
                <span className="roadTrips__fieldLabel">
                  Neutral state fill
                </span>
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
                <span className="roadTrips__fieldLabel">
                  Neutral state border
                </span>
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
                      mapStyle: event.target
                        .value as RoadTripAppearanceSettings["mapStyle"],
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
        </ModalShell>
      ) : null}
      {isTripLibraryOpen ? (
        <ModalShell
          title="Load a Saved Trip"
          description="Pick a locally saved trip to load it into the editor, or delete one you no longer want."
          onClose={() => setIsTripLibraryOpen(false)}
        >
          <div className="roadTrips__savedTripList">
            {savedTrips.length === 0 ? (
              <p className="roadTrips__sectionCopy roadTrips__emptyState">
                No local trips have been saved yet.
              </p>
            ) : (
              savedTrips.map((trip) => (
                <article key={trip.id} className="roadTrips__savedTripItem">
                  <div>
                    <div className="roadTrips__savedTripHeading">
                      <strong>{trip.name}</strong>
                      {trip.isShared ? (
                        <span className="roadTrips__tripPill roadTrips__tripPill--shared">
                          Shared
                        </span>
                      ) : null}
                    </div>
                    <p className="roadTrips__savedTripMeta">
                      {trip.category === "taken"
                        ? "Trips Taken"
                        : "Trip Wishlist"}{" "}
                      / {formatNumber(trip.miles)} miles /{" "}
                      {trip.waypoints.length} waypoints
                    </p>
                  </div>
                  <div className="roadTrips__savedTripActions">
                    <button
                      type="button"
                      className="btn-flat"
                      onClick={() => handleLoadTrip(trip)}
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      className="btn-flat"
                      onClick={() => handleDeleteTrip(trip.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </ModalShell>
      ) : null}

      {editingWaypointIndex !== null && waypointEditor ? (
        <ModalShell
          title={`Edit Stop ${editingWaypointIndex + 1}`}
          description="Rename the stop, adjust the state label, or add notes. Drag the marker on the map if the coordinates need to move."
          narrow
          onClose={() => {
            setEditingWaypointIndex(null);
            setWaypointEditor(null);
          }}
        >
          <div className="roadTrips__editorFields">
            <label className="roadTrips__field roadTrips__field--full">
              <span className="roadTrips__fieldLabel">Waypoint name</span>
              <input
                type="text"
                value={waypointEditor.name}
                onChange={(event) =>
                  setWaypointEditor((current) =>
                    current
                      ? { ...current, name: event.target.value }
                      : current,
                  )
                }
              />
            </label>
            <label className="roadTrips__field">
              <span className="roadTrips__fieldLabel">State</span>
              <input
                type="text"
                value={waypointEditor.state}
                onChange={(event) =>
                  setWaypointEditor((current) =>
                    current
                      ? { ...current, state: event.target.value }
                      : current,
                  )
                }
                placeholder="IN"
              />
            </label>
            <label className="roadTrips__field">
              <span className="roadTrips__fieldLabel">Coordinates</span>
              <input
                type="text"
                value={`${waypointEditor.latitude.toFixed(5)}, ${waypointEditor.longitude.toFixed(5)}`}
                readOnly
              />
            </label>
            <label className="roadTrips__field roadTrips__field--full">
              <span className="roadTrips__fieldLabel">Notes</span>
              <textarea
                className="materialize-textarea"
                value={waypointEditor.notes ?? ""}
                onChange={(event) =>
                  setWaypointEditor((current) =>
                    current
                      ? { ...current, notes: event.target.value }
                      : current,
                  )
                }
                placeholder="What made this stop memorable?"
              />
            </label>
          </div>

          <div className="roadTrips__editorActions">
            <button
              type="button"
              className="btn roadTrips__saveButton"
              onClick={handleSaveWaypointEditor}
            >
              Save stop changes
            </button>
            <button
              type="button"
              className="btn-flat"
              onClick={() => {
                setEditingWaypointIndex(null);
                setWaypointEditor(null);
              }}
            >
              Cancel
            </button>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}

export default RoadTrips;
