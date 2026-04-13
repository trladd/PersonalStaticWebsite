export type RoadTripMapStyle = "light" | "voyager" | "dark" | "osm";

export interface RoadTripAppearanceSettings {
  takenLineColor: string;
  wishlistLineColor: string;
  takenStateFillColor: string;
  takenStateBorderColor: string;
  wishlistStateFillColor: string;
  wishlistStateBorderColor: string;
  neutralStateFillColor: string;
  neutralStateBorderColor: string;
  waypointBorderColor: string;
  mapStyle: RoadTripMapStyle;
}

export interface RoadTripMapTileConfig {
  attribution: string;
  url: string;
}

export const DEFAULT_ROAD_TRIP_APPEARANCE: RoadTripAppearanceSettings = {
  takenLineColor: "#29524a",
  wishlistLineColor: "#c97a45",
  takenStateFillColor: "#2f6458",
  takenStateBorderColor: "#244740",
  wishlistStateFillColor: "#d69a71",
  wishlistStateBorderColor: "#ad6639",
  neutralStateFillColor: "#eef2f6",
  neutralStateBorderColor: "#a8b3bc",
  waypointBorderColor: "#2d4c46",
  mapStyle: "light",
};

const LEGACY_CATEGORY_LINE_COLORS = {
  taken: "#29524a",
  wishlist: "#c97a45",
} as const;

export const ROAD_TRIP_MAP_STYLE_OPTIONS: {
  label: string;
  value: RoadTripMapStyle;
}[] = [
  { label: "Light", value: "light" },
  { label: "Voyager", value: "voyager" },
  { label: "Dark", value: "dark" },
  { label: "OpenStreetMap", value: "osm" },
];

export function getRoadTripMapTileConfig(
  mapStyle: RoadTripMapStyle
): RoadTripMapTileConfig {
  if (mapStyle === "voyager") {
    return {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO',
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    };
  }

  if (mapStyle === "dark") {
    return {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO',
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    };
  }

  if (mapStyle === "osm") {
    return {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    };
  }

  return {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO',
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  };
}

export function getCategoryDefaultLineColor(
  category: "taken" | "wishlist",
  appearanceSettings: RoadTripAppearanceSettings
): string {
  return category === "taken"
    ? appearanceSettings.takenLineColor
    : appearanceSettings.wishlistLineColor;
}

export function resolveTripLineColor(
  category: "taken" | "wishlist",
  lineColor: string | undefined,
  appearanceSettings: RoadTripAppearanceSettings
): string {
  const currentDefault = getCategoryDefaultLineColor(category, appearanceSettings);
  if (!lineColor) {
    return currentDefault;
  }

  const legacyDefault = LEGACY_CATEGORY_LINE_COLORS[category];
  return lineColor.toLowerCase() === legacyDefault.toLowerCase() ? currentDefault : lineColor;
}
