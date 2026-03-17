import {
  CAR_COST_ADMIN_STORAGE_KEY,
  CAR_COST_CUSTOM_KEY,
  CAR_COST_STATE_VERSION,
  DEFAULT_DRIVING_MILEAGE,
  DEFAULT_BATTERY_REPLACEMENT_SCHEDULE,
  DEFAULT_BRAKE_SERVICE_SCHEDULE,
  DEFAULT_FUEL_PRICES,
  DEFAULT_MAJOR_SERVICE_SCHEDULE,
  DEFAULT_MISC_MAINTENANCE_SCHEDULE,
  DEFAULT_NEW_CAR_APR,
  DEFAULT_NEW_CAR_PAYMENT,
  DEFAULT_NEW_CAR_TERM_MONTHS,
  DEFAULT_REPAIR_BUFFER_SCHEDULE,
  defaultValues,
} from "../config/constants";
import {
  CarCostValues,
  CustomVehicle,
  CustomVehicleDraft,
  DrivingMileageSetting,
  PersistedCarCostAdminState,
  PersistedCarCostState,
  PersistedStateMigrationResult,
  PartialTemplateValues,
  SessionScopedCarCostValues,
  VehicleTemplate,
} from "../types";
import { normalizeDrivingMileageSetting } from "./drivingMileage";
import { normalizeIntervalSetting } from "./intervals";

const SESSION_SCOPED_VALUE_KEYS = [
  "tripDistance",
  "includeTripFuelOverride",
  "tripFuelEfficiency",
  "drivingMileage",
  "includeVehicleCost",
  "includeAnnualOwnership",
] as const;

export const getSessionScopedValues = (
  values: CarCostValues,
): SessionScopedCarCostValues => ({
  tripDistance: values.tripDistance,
  includeTripFuelOverride: values.includeTripFuelOverride,
  tripFuelEfficiency: values.tripFuelEfficiency,
  drivingMileage: values.drivingMileage,
  includeVehicleCost: values.includeVehicleCost,
  includeAnnualOwnership: values.includeAnnualOwnership,
});

export const applySessionScopedValues = (
  baseValues: CarCostValues,
  sessionValues: SessionScopedCarCostValues,
): CarCostValues => ({
  ...baseValues,
  ...sessionValues,
});

export const stripSessionScopedValues = (
  rawValues?: PartialTemplateValues,
): PartialTemplateValues => {
  if (!rawValues) {
    return {};
  }

  const strippedValues = { ...rawValues };
  SESSION_SCOPED_VALUE_KEYS.forEach((key) => {
    delete strippedValues[key];
  });

  return strippedValues;
};

export const getDraftFromVehicle = (
  vehicle: CustomVehicle | null,
): CustomVehicleDraft => ({
  year: vehicle ? String(vehicle.year || "") : "",
  make: vehicle?.make ?? "",
  model: vehicle?.model ?? "",
  trim: vehicle?.manualVehicleEntry
    ? vehicle?.trim ?? ""
    : vehicle?.trimSelectionValue ??
      (vehicle?.trim?.includes("::") ? vehicle.trim : "") ??
      "",
  fuelType: vehicle?.values.fuelType ?? "regular",
  vehicleClassBucket: vehicle?.vehicleClassBucket ?? "",
  manualVehicleEntry: vehicle?.manualVehicleEntry ?? false,
});

export const cleanupModalArtifacts = () => {
  document.body.style.overflow = "";
  document.body.style.width = "";

  if (document.querySelector(".modal.open")) {
    return;
  }

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.parentElement?.removeChild(overlay);
  });

  document.body.classList.remove("modal-open");
};

export const normalizeCarCostValues = (
  rawValues?: PartialTemplateValues,
): CarCostValues => ({
  ...defaultValues,
  ...rawValues,
  fuelType: rawValues?.fuelType ?? defaultValues.fuelType,
  fuelEfficiency:
    rawValues?.fuelEfficiency ??
    rawValues?.fuelMileage ??
    defaultValues.fuelEfficiency,
  drivingMileage: normalizeDrivingMileageSetting(
    rawValues?.drivingMileage as Partial<DrivingMileageSetting> | undefined,
    typeof rawValues?.recurringMiles === "number" ? rawValues.recurringMiles : undefined,
    typeof (rawValues as { recurringType?: string } | undefined)?.recurringType === "string"
      ? (rawValues as { recurringType?: string }).recurringType
      : undefined,
  ),
  miscMaintenanceSchedule: normalizeIntervalSetting({
    rawInterval: rawValues?.miscMaintenanceSchedule,
    fallback: DEFAULT_MISC_MAINTENANCE_SCHEDULE,
    legacyBasis: rawValues?.miscMaintenanceBasis,
    legacyInterval: rawValues?.miscMaintenanceInterval,
  }),
  brakeServiceSchedule: normalizeIntervalSetting({
    rawInterval: rawValues?.brakeServiceSchedule,
    fallback: DEFAULT_BRAKE_SERVICE_SCHEDULE,
  }),
  batteryReplacementSchedule: normalizeIntervalSetting({
    rawInterval: rawValues?.batteryReplacementSchedule,
    fallback: DEFAULT_BATTERY_REPLACEMENT_SCHEDULE,
  }),
  majorServiceSchedule: normalizeIntervalSetting({
    rawInterval: rawValues?.majorServiceSchedule,
    fallback: DEFAULT_MAJOR_SERVICE_SCHEDULE,
  }),
  repairBufferSchedule: normalizeIntervalSetting({
    rawInterval: rawValues?.repairBufferSchedule,
    fallback: DEFAULT_REPAIR_BUFFER_SCHEDULE,
  }),
  depreciationBasis:
    rawValues?.depreciationBasis ?? defaultValues.depreciationBasis,
  fuelUnitPrice:
    rawValues?.fuelUnitPrice ??
    DEFAULT_FUEL_PRICES[rawValues?.fuelType ?? defaultValues.fuelType],
  includeTripFuelOverride:
    rawValues?.includeTripFuelOverride ?? defaultValues.includeTripFuelOverride,
  tripFuelEfficiency:
    rawValues?.tripFuelEfficiency ?? defaultValues.tripFuelEfficiency,
  includeVehicleCost: rawValues?.includeVehicleCost ?? 1,
  includeDepreciation: rawValues?.includeDepreciation ?? 1,
  includeAnnualOwnership: rawValues?.includeAnnualOwnership ?? 1,
  showAdvancedMaintenance: rawValues?.showAdvancedMaintenance ?? 0,
  loanApr: rawValues?.loanApr ?? DEFAULT_NEW_CAR_APR,
  loanTermMonths: rawValues?.loanTermMonths ?? DEFAULT_NEW_CAR_TERM_MONTHS,
  loanDownPayment: rawValues?.loanDownPayment ?? defaultValues.loanDownPayment,
  loanMonthlyPayment: rawValues?.loanMonthlyPayment ?? DEFAULT_NEW_CAR_PAYMENT,
  loanPaymentMode: rawValues?.loanPaymentMode ?? defaultValues.loanPaymentMode,
  includeFinancing: rawValues?.includeFinancing ?? 0,
  oilChangeMaxMonths: rawValues?.oilChangeMaxMonths ?? defaultValues.oilChangeMaxMonths,
  tireMaxAgeYears: rawValues?.tireMaxAgeYears ?? defaultValues.tireMaxAgeYears,
  includeWinterTires:
    rawValues?.includeWinterTires ?? defaultValues.includeWinterTires,
  winterTireCost: rawValues?.winterTireCost ?? defaultValues.winterTireCost,
  winterTireInterval:
    rawValues?.winterTireInterval ?? defaultValues.winterTireInterval,
  winterTireMaxAgeYears:
    rawValues?.winterTireMaxAgeYears ?? defaultValues.winterTireMaxAgeYears,
  winterTireMonths:
    rawValues?.winterTireMonths ?? defaultValues.winterTireMonths,
});

export const normalizeVehicleTemplate = (
  template: VehicleTemplate & { values: PartialTemplateValues },
): VehicleTemplate => ({
  ...template,
  values: normalizeCarCostValues(stripSessionScopedValues(template.values)),
});

export const parseSavedCustomVehicle = (savedCustom: string | null) => {
  if (!savedCustom) {
    return null;
  }

  try {
    const parsedCustom = JSON.parse(savedCustom) as CustomVehicle;
    if (parsedCustom?.title && parsedCustom?.values) {
      return {
        ...parsedCustom,
        values: normalizeCarCostValues(
          stripSessionScopedValues(parsedCustom.values),
        ),
      } as CustomVehicle;
    }

    localStorage.removeItem(CAR_COST_CUSTOM_KEY);
    return null;
  } catch (error) {
    localStorage.removeItem(CAR_COST_CUSTOM_KEY);
    return null;
  }
};

const buildPersistedCarCostState = (
  rawState: Partial<PersistedCarCostState> & {
    values?: PartialTemplateValues;
  },
): PersistedCarCostState => ({
  version: CAR_COST_STATE_VERSION,
  isSharedSession: rawState.isSharedSession ?? false,
  selectedSource: rawState.selectedSource ?? "default",
  selectedTemplateId: rawState.selectedTemplateId ?? null,
  values: normalizeCarCostValues(rawState.values),
  tripType: rawState.tripType ?? "oneWay",
  tripTireSet: rawState.tripTireSet ?? "allSeason",
  updatedAt: rawState.updatedAt ?? new Date(0).toISOString(),
});

export const migratePersistedCarCostState = (
  savedState: string | null,
): PersistedStateMigrationResult => {
  if (!savedState) {
    return {
      migratedState: null,
      startupNotice: null,
      discardSavedCustomVehicle: false,
    };
  }

  try {
    const parsedState = JSON.parse(savedState) as Partial<PersistedCarCostState> & {
      values?: PartialTemplateValues;
      version?: number;
    };

    if (!parsedState?.values) {
      return {
        migratedState: null,
        startupNotice: null,
        discardSavedCustomVehicle: false,
      };
    }

    const parsedVersion =
      typeof parsedState.version === "number" ? parsedState.version : 0;

    if (parsedVersion === CAR_COST_STATE_VERSION) {
      return {
        migratedState: buildPersistedCarCostState(parsedState),
        startupNotice: null,
        discardSavedCustomVehicle: false,
      };
    }

    return {
      migratedState: {
        version: CAR_COST_STATE_VERSION,
        isSharedSession: false,
        selectedSource: "default",
        selectedTemplateId: null,
        values: {
          ...defaultValues,
          drivingMileage: DEFAULT_DRIVING_MILEAGE,
        },
        tripType: "oneWay",
        tripTireSet: "allSeason",
        updatedAt: new Date().toISOString(),
      },
      startupNotice:
        parsedVersion < CAR_COST_STATE_VERSION
          ? "We found saved car cost data from an older version of this page. This update includes breaking calculator changes, so some of your saved state was reset to current defaults."
          : "We found saved car cost data from a newer or incompatible version of this page. This update could not safely migrate that saved state, so the calculator was reset to current defaults.",
      discardSavedCustomVehicle: true,
    };
  } catch (error) {
    return {
      migratedState: null,
      startupNotice: null,
      discardSavedCustomVehicle: false,
    };
  }
};

export const parseCarCostAdminState = (
  savedAdminState: string | null,
  legacySavedState: string | null,
): PersistedCarCostAdminState => {
  if (savedAdminState) {
    try {
      const parsedAdmin = JSON.parse(savedAdminState) as Partial<PersistedCarCostAdminState>;
      return {
        disableAnalyticsLogging: parsedAdmin.disableAnalyticsLogging ?? false,
      };
    } catch (error) {
      localStorage.removeItem(CAR_COST_ADMIN_STORAGE_KEY);
    }
  }

  if (legacySavedState) {
    try {
      const parsedLegacyState = JSON.parse(legacySavedState) as {
        disableAnalyticsLogging?: boolean;
      };
      return {
        disableAnalyticsLogging: parsedLegacyState.disableAnalyticsLogging ?? false,
      };
    } catch (error) {
      return { disableAnalyticsLogging: false };
    }
  }

  return { disableAnalyticsLogging: false };
};
