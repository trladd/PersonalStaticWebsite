import {
  CAR_COST_ADMIN_STORAGE_KEY,
  CAR_COST_CUSTOM_KEY,
  CAR_COST_STATE_VERSION,
  DEFAULT_FUEL_PRICES,
  DEFAULT_NEW_CAR_APR,
  DEFAULT_NEW_CAR_PAYMENT,
  DEFAULT_NEW_CAR_TERM_MONTHS,
  defaultValues,
} from "../config/constants";
import {
  CarCostValues,
  CustomVehicle,
  CustomVehicleDraft,
  PersistedCarCostAdminState,
  PersistedCarCostState,
  PersistedStateMigrationResult,
  PartialTemplateValues,
  SessionScopedCarCostValues,
  VehicleTemplate,
} from "../types";

const SESSION_SCOPED_VALUE_KEYS = [
  "tripDistance",
  "recurringMiles",
  "annualInsurance",
  "annualRegistration",
  "annualParking",
  "annualInspection",
  "annualRoadside",
  "includeVehicleCost",
  "includeAnnualOwnership",
] as const;

export const getSessionScopedValues = (
  values: CarCostValues,
): SessionScopedCarCostValues => ({
  tripDistance: values.tripDistance,
  recurringMiles: values.recurringMiles,
  annualInsurance: values.annualInsurance,
  annualRegistration: values.annualRegistration,
  annualParking: values.annualParking,
  annualInspection: values.annualInspection,
  annualRoadside: values.annualRoadside,
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
  trim: vehicle?.trim ?? "",
  fuelType: vehicle?.values.fuelType ?? "regular",
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
  miscMaintenanceBasis:
    rawValues?.miscMaintenanceBasis ?? defaultValues.miscMaintenanceBasis,
  depreciationBasis:
    rawValues?.depreciationBasis ?? defaultValues.depreciationBasis,
  fuelUnitPrice:
    rawValues?.fuelUnitPrice ??
    DEFAULT_FUEL_PRICES[rawValues?.fuelType ?? defaultValues.fuelType],
  includeVehicleCost: rawValues?.includeVehicleCost ?? 1,
  includeDepreciation: rawValues?.includeDepreciation ?? 1,
  includeAnnualOwnership: rawValues?.includeAnnualOwnership ?? 1,
  loanApr: rawValues?.loanApr ?? DEFAULT_NEW_CAR_APR,
  loanTermMonths: rawValues?.loanTermMonths ?? DEFAULT_NEW_CAR_TERM_MONTHS,
  loanDownPayment: rawValues?.loanDownPayment ?? defaultValues.loanDownPayment,
  loanMonthlyPayment: rawValues?.loanMonthlyPayment ?? DEFAULT_NEW_CAR_PAYMENT,
  loanPaymentMode: rawValues?.loanPaymentMode ?? defaultValues.loanPaymentMode,
  includeFinancing: rawValues?.includeFinancing ?? 0,
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
  recurringType: rawState.recurringType ?? "year",
  tripType: rawState.tripType ?? "oneWay",
  updatedAt: rawState.updatedAt ?? new Date(0).toISOString(),
});

export const migratePersistedCarCostState = (
  savedState: string | null,
): PersistedStateMigrationResult => {
  if (!savedState) {
    return { migratedState: null, startupNotice: null };
  }

  try {
    const parsedState = JSON.parse(savedState) as Partial<PersistedCarCostState> & {
      values?: PartialTemplateValues;
      version?: number;
    };

    if (!parsedState?.values || !parsedState?.recurringType) {
      return { migratedState: null, startupNotice: null };
    }

    const parsedVersion =
      typeof parsedState.version === "number" ? parsedState.version : 0;

    if (parsedVersion === CAR_COST_STATE_VERSION) {
      return {
        migratedState: buildPersistedCarCostState(parsedState),
        startupNotice: null,
      };
    }

    if (parsedVersion < CAR_COST_STATE_VERSION) {
      return {
        migratedState: buildPersistedCarCostState(parsedState),
        startupNotice:
          "We found a saved car cost setup from an older version of this page. We migrated the parts that still fit the current calculator.",
      };
    }

    const partialValues = getSessionScopedValues(
      normalizeCarCostValues(parsedState.values),
    );

    return {
      migratedState: {
        version: CAR_COST_STATE_VERSION,
        isSharedSession: false,
        selectedSource: "default",
        selectedTemplateId: null,
        values: applySessionScopedValues(defaultValues, partialValues),
        recurringType: parsedState.recurringType ?? "year",
        tripType: parsedState.tripType ?? "oneWay",
        updatedAt: parsedState.updatedAt ?? new Date().toISOString(),
      },
      startupNotice:
        "We found saved car cost data from a newer or incompatible version of this page. We could only keep the session-level planning pieces and reset the rest to current defaults.",
    };
  } catch (error) {
    return { migratedState: null, startupNotice: null };
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
