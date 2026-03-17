import {
  DEFAULT_FUEL_PRICES,
  defaultValues,
} from "../config/constants";
import {
  FuelType,
  PartialTemplateValues,
  SelectedVehicleLookupDetails,
  VehicleLookupOption,
} from "../types";
import { mapVehicleClassToBucket } from "./vehicleClass";

type XmlNodeRecord = Record<string, string>;

type EpaTrimCandidate = {
  label: string;
  value: string;
  epaModelValue: string;
  vehicleId: string;
};

const EPA_BASE_URL = "https://www.fueleconomy.gov/ws/rest/vehicle";
const NHTSA_BASE_URL = "https://vpic.nhtsa.dot.gov/api/vehicles";

const CURRENT_YEAR = new Date().getFullYear() + 1;
const MIN_MODEL_YEAR = 1984;

const makeCache = new Map<number, Promise<VehicleLookupOption[]>>();
const modelCache = new Map<string, Promise<VehicleLookupOption[]>>();
const trimCache = new Map<string, Promise<EpaTrimCandidate[]>>();
const vehicleDetailsCache = new Map<string, Promise<SelectedVehicleLookupDetails>>();

const normalizeVehicleText = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseXmlItems = (xmlText: string, itemTagName: string) => {
  const xml = new DOMParser().parseFromString(xmlText, "text/xml");
  return Array.from(xml.getElementsByTagName(itemTagName)).map((node) => {
    const entries = Array.from(node.children).map((child) => [
      child.tagName,
      child.textContent ?? "",
    ]);
    return Object.fromEntries(entries) as XmlNodeRecord;
  });
};

const fetchText = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed request: ${url}`);
  }

  return response.text();
};

const fetchJson = async <T>(url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed request: ${url}`);
  }

  return (await response.json()) as T;
};

export const mapEpaFuelType = (fuelTypeText: string): FuelType => {
  const normalizedFuelType = fuelTypeText.toLowerCase();

  if (normalizedFuelType.includes("electric")) {
    return "electric";
  }
  if (normalizedFuelType.includes("diesel")) {
    return "diesel";
  }
  if (normalizedFuelType.includes("e85")) {
    return "e85";
  }
  if (normalizedFuelType.includes("cng")) {
    return "cng";
  }
  if (normalizedFuelType.includes("lpg")) {
    return "lpg";
  }
  if (normalizedFuelType.includes("midgrade")) {
    return "midgrade";
  }
  if (normalizedFuelType.includes("premium")) {
    return "premium";
  }

  return "regular";
};

const toNumberOrNull = (value: string) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

export const getEfficiencyInfo = (
  vehicleRecord: XmlNodeRecord,
  fuelType: FuelType,
) => {
  if (fuelType === "electric") {
    const cityKwhPer100Miles = toNumberOrNull(vehicleRecord.cityE);
    const combinedKwhPer100Miles = toNumberOrNull(vehicleRecord.combE);
    const highwayKwhPer100Miles = toNumberOrNull(vehicleRecord.highwayE);
    const milesPerKwh = (value: number | null) =>
      value && value > 0 ? 100 / value : null;

    return {
      city: milesPerKwh(cityKwhPer100Miles),
      combined: milesPerKwh(combinedKwhPer100Miles),
      highway: milesPerKwh(highwayKwhPer100Miles),
      unitLabel: "mi/kWh" as const,
      annualFuelCost: toNumberOrNull(vehicleRecord.fuelCost08),
    };
  }

  return {
    city: toNumberOrNull(vehicleRecord.city08),
    combined: toNumberOrNull(vehicleRecord.comb08),
    highway: toNumberOrNull(vehicleRecord.highway08),
    unitLabel: "MPG" as const,
    annualFuelCost: toNumberOrNull(vehicleRecord.fuelCost08),
  };
};

const buildVehicleValuesFromDetail = (
  fuelType: FuelType,
  combinedEfficiency: number | null,
): PartialTemplateValues => ({
  ...defaultValues,
  fuelType,
  fuelEfficiency: combinedEfficiency ?? defaultValues.fuelEfficiency,
  fuelUnitPrice: DEFAULT_FUEL_PRICES[fuelType],
});

const trimLabelNeedsOptionText = (
  selectedModel: string,
  epaModelValue: string,
  optionText: string,
) => {
  const normalizedSelectedModel = normalizeVehicleText(selectedModel);
  const normalizedEpaModel = normalizeVehicleText(epaModelValue);

  return (
    normalizedEpaModel === normalizedSelectedModel ||
    optionText.toLowerCase().includes("auto") ||
    optionText.toLowerCase().includes("manual")
  );
};

const dedupeOptions = (options: VehicleLookupOption[]) => {
  const seenValues = new Set<string>();

  return options.filter((option) => {
    if (seenValues.has(option.value)) {
      return false;
    }

    seenValues.add(option.value);
    return true;
  });
};

const fetchEpaMakes = async (year: number) => {
  const xmlText = await fetchText(
    `${EPA_BASE_URL}/menu/make?year=${year}`,
  );

  return dedupeOptions(
    parseXmlItems(xmlText, "menuItem")
      .map((item) => ({
        label: item.text,
        value: item.value,
      }))
      .filter((item) => item.value),
  ).sort((left, right) => left.label.localeCompare(right.label));
};

const fetchNhtsaAllMakes = async () => {
  const payload = await fetchJson<{
    Results: Array<{ Make_Name: string }>;
  }>(`${NHTSA_BASE_URL}/getallmakes?format=json`);

  return payload.Results.map((result) => result.Make_Name);
};

const fetchNhtsaModelsForMakeYear = async (year: number, make: string) => {
  const payload = await fetchJson<{
    Results: Array<{ Model_Name: string }>;
  }>(
    `${NHTSA_BASE_URL}/GetModelsForMakeYear/make/${encodeURIComponent(
      make,
    )}/modelyear/${year}?format=json`,
  );

  return dedupeOptions(
    payload.Results.map((result) => ({
      label: result.Model_Name,
      value: result.Model_Name,
    })).filter((item) => item.value),
  ).sort((left, right) => left.label.localeCompare(right.label));
};

const fetchEpaModels = async (year: number, make: string) => {
  const xmlText = await fetchText(
    `${EPA_BASE_URL}/menu/model?year=${year}&make=${encodeURIComponent(make)}`,
  );

  return dedupeOptions(
    parseXmlItems(xmlText, "menuItem")
      .map((item) => ({
        label: item.text,
        value: item.value,
      }))
      .filter((item) => item.value),
  ).sort((left, right) => left.label.localeCompare(right.label));
};

const fetchEpaOptionsForModel = async (
  year: number,
  make: string,
  model: string,
) => {
  const xmlText = await fetchText(
    `${EPA_BASE_URL}/menu/options?year=${year}&make=${encodeURIComponent(
      make,
    )}&model=${encodeURIComponent(model)}`,
  );

  return parseXmlItems(xmlText, "menuItem")
    .map((item) => ({
      label: item.text,
      value: item.value,
    }))
    .filter((item) => item.value);
};

export const findMatchingEpaModels = (
  selectedModel: string,
  epaModels: VehicleLookupOption[],
) => {
  const normalizedSelectedModel = normalizeVehicleText(selectedModel);

  const startsWithMatches = epaModels.filter((model) =>
    normalizeVehicleText(model.value).startsWith(normalizedSelectedModel),
  );
  if (startsWithMatches.length > 0) {
    return startsWithMatches;
  }

  return epaModels.filter((model) =>
    normalizeVehicleText(model.value).includes(normalizedSelectedModel),
  );
};

export const getVehicleLookupYears = () =>
  Array.from(
    { length: CURRENT_YEAR - MIN_MODEL_YEAR + 1 },
    (_, index) => CURRENT_YEAR - index,
  );

export const fetchVehicleMakes = (year: number) => {
  if (!makeCache.has(year)) {
    makeCache.set(
      year,
      Promise.all([fetchEpaMakes(year), fetchNhtsaAllMakes()]).then(
        ([epaMakes, nhtsaMakes]) => {
          const nhtsaMap = new Map(
            nhtsaMakes.map((makeName) => [
              normalizeVehicleText(makeName),
              makeName,
            ]),
          );

          return epaMakes.map((epaMake) => ({
            label:
              nhtsaMap.get(normalizeVehicleText(epaMake.value)) ?? epaMake.label,
            value: epaMake.value,
          }));
        },
      ),
    );
  }

  return makeCache.get(year)!;
};

export const fetchVehicleModels = (year: number, make: string) => {
  const cacheKey = `${year}:${make}`;
  if (!modelCache.has(cacheKey)) {
    modelCache.set(cacheKey, fetchNhtsaModelsForMakeYear(year, make));
  }

  return modelCache.get(cacheKey)!;
};

export const fetchVehicleTrimOptions = async (
  year: number,
  make: string,
  model: string,
) => {
  const cacheKey = `${year}:${make}:${model}`;
  if (!trimCache.has(cacheKey)) {
    trimCache.set(
      cacheKey,
      (async () => {
        const epaModels = await fetchEpaModels(year, make);
        const matchingEpaModels = findMatchingEpaModels(model, epaModels);
        const trimGroups = await Promise.all(
          matchingEpaModels.map(async (epaModel) => {
            const epaOptions = await fetchEpaOptionsForModel(
              year,
              make,
              epaModel.value,
            );

            return epaOptions.map((option) => ({
              label: trimLabelNeedsOptionText(model, epaModel.value, option.label)
                ? `${epaModel.label} - ${option.label}`
                : epaModel.label,
              value: `${epaModel.value}::${option.value}`,
              epaModelValue: epaModel.value,
              vehicleId: option.value,
            }));
          }),
        );

        return trimGroups
          .flat()
          .filter((option) => option.vehicleId)
          .sort((left, right) => left.label.localeCompare(right.label));
      })(),
    );
  }

  return trimCache.get(cacheKey)!;
};

export const fetchVehicleLookupDetails = (trimValue: string) => {
  if (!vehicleDetailsCache.has(trimValue)) {
    vehicleDetailsCache.set(
      trimValue,
      (async () => {
        const vehicleId = trimValue.split("::").pop() ?? trimValue;
        const xmlText = await fetchText(`${EPA_BASE_URL}/${vehicleId}`);
        const [vehicleRecord] = parseXmlItems(xmlText, "vehicle");

        if (!isPlainObject(vehicleRecord)) {
          throw new Error("Vehicle details unavailable");
        }

        const fuelType = mapEpaFuelType(vehicleRecord.fuelType1 || vehicleRecord.fuelType);
        const efficiency = getEfficiencyInfo(vehicleRecord, fuelType);
        const purchasePrice = toNumberOrNull(vehicleRecord.msrp);
        const vehicleClass =
          typeof vehicleRecord.VClass === "string" && vehicleRecord.VClass.trim().length > 0
            ? vehicleRecord.VClass.trim()
            : null;
        const vehicleClassBucket = mapVehicleClassToBucket(vehicleClass);

        return {
          vehicleId,
          year: Number(vehicleRecord.year),
          make: vehicleRecord.make,
          model: vehicleRecord.baseModel || vehicleRecord.model,
          trim: vehicleRecord.model,
          title: `${vehicleRecord.year} ${vehicleRecord.make} ${vehicleRecord.model}`,
          fuelType,
          defaultPurchasePrice: purchasePrice,
          efficiency,
          lookupSummary: {
            vehicleClass,
            vehicleClassBucket,
            fuelType,
            annualFuelCost: efficiency.annualFuelCost,
            city: efficiency.city,
            combined: efficiency.combined,
            highway: efficiency.highway,
            unitLabel: efficiency.unitLabel,
            purchasePrice,
          },
          values: {
            ...buildVehicleValuesFromDetail(fuelType, efficiency.combined),
            purchasePrice: purchasePrice ?? defaultValues.purchasePrice,
          },
        } satisfies SelectedVehicleLookupDetails;
      })(),
    );
  }

  return vehicleDetailsCache.get(trimValue)!;
};

export const buildVehicleDetailsSummary = (
  details: SelectedVehicleLookupDetails | null,
) => {
  if (!details) {
    return null;
  }

  return details.lookupSummary;
};
