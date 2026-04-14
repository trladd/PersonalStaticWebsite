import { REGION_NAME_BY_CODE, normalizeStateCode } from "./roadTripUtils";

const GEOCODE_CACHE_STORAGE_KEY = "roadTrips.geocodeCache.v1";
const NOMINATIM_SEARCH_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const MIN_REQUEST_INTERVAL_MS = 1050;

let lastGeocodeRequestAt = 0;

export interface GeocodeResult {
  displayName: string;
  latitude: number;
  longitude: number;
  state: string;
}

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    state?: string;
    county?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    road?: string;
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function buildQueryCacheKey(query: string): string {
  return query.trim().toLowerCase();
}

function loadGeocodeCache(): Record<string, GeocodeResult[]> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(GEOCODE_CACHE_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, GeocodeResult[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveGeocodeCache(nextCache: Record<string, GeocodeResult[]>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      GEOCODE_CACHE_STORAGE_KEY,
      JSON.stringify(nextCache),
    );
  } catch (error) {
    // Ignore cache persistence issues and continue with in-memory-only behavior.
  }
}

function getStateFromAddress(result: NominatimSearchResult): string {
  const addressState = result.address?.state;
  if (!addressState) {
    return "";
  }

  const normalizedCode = normalizeStateCode(addressState);
  if (!normalizedCode) {
    return addressState;
  }

  return REGION_NAME_BY_CODE[normalizedCode] || addressState;
}

function normalizeResults(results: NominatimSearchResult[]): GeocodeResult[] {
  return results
    .map((result) => ({
      displayName: result.display_name,
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      state: getStateFromAddress(result),
    }))
    .filter(
      (result) =>
        Number.isFinite(result.latitude) &&
        Number.isFinite(result.longitude) &&
        result.displayName.trim().length > 0,
    );
}

export async function searchAddresses(query: string): Promise<GeocodeResult[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const cacheKey = buildQueryCacheKey(trimmedQuery);
  const cache = loadGeocodeCache();
  const cachedResults = cache[cacheKey];
  if (cachedResults) {
    return cachedResults;
  }

  const now = Date.now();
  const elapsed = now - lastGeocodeRequestAt;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await wait(MIN_REQUEST_INTERVAL_MS - elapsed);
  }

  lastGeocodeRequestAt = Date.now();

  const params = new URLSearchParams({
    q: trimmedQuery,
    format: "jsonv2",
    addressdetails: "1",
    limit: "5",
  });

  const response = await fetch(
    `${NOMINATIM_SEARCH_ENDPOINT}?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(`Address lookup failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as NominatimSearchResult[];
  const normalizedResults = normalizeResults(payload);
  cache[cacheKey] = normalizedResults;
  saveGeocodeCache(cache);
  return normalizedResults;
}
