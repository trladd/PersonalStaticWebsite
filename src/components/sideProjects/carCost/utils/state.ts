import {
  CAR_COST_CUSTOM_KEY,
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
  PlannerValues,
  PartialTemplateValues,
  VehicleTemplate,
} from "../types";

export const getPlannerValues = (values: CarCostValues): PlannerValues => ({
  tripDistance: values.tripDistance,
  recurringMiles: values.recurringMiles,
});

export const applyPlannerValues = (
  baseValues: CarCostValues,
  plannerValues: PlannerValues,
): CarCostValues => ({
  ...baseValues,
  ...plannerValues,
});

export const getDraftFromVehicle = (
  vehicle: CustomVehicle | null,
): CustomVehicleDraft => ({
  year: vehicle ? String(vehicle.year || "") : "",
  make: vehicle?.make ?? "",
  model: vehicle?.model ?? "",
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
  values: normalizeCarCostValues(template.values),
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
        values: normalizeCarCostValues(parsedCustom.values),
      } as CustomVehicle;
    }

    localStorage.removeItem(CAR_COST_CUSTOM_KEY);
    return null;
  } catch (error) {
    localStorage.removeItem(CAR_COST_CUSTOM_KEY);
    return null;
  }
};
