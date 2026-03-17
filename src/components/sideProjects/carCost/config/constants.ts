import { CarCostValues, FuelType } from "../types";

export const defaultValues: CarCostValues = {
  fuelType: "regular",
  fuelEfficiency: 25,
  fuelUnitPrice: 3.49,
  oilChangeCost: 75,
  oilChangeInterval: 7500,
  tireCost: 900,
  tireInterval: 50000,
  miscMaintenanceCost: 600,
  miscMaintenanceBasis: "miles",
  miscMaintenanceInterval: 15000,
  depreciationBasis: "miles",
  purchasePrice: 32000,
  resaleValue: 18000,
  depreciationInterval: 100000,
  tripDistance: 250,
  recurringMiles: 12000,
  annualInsurance: 2100,
  annualRegistration: 175,
  annualParking: 0,
  annualInspection: 0,
  annualRoadside: 100,
  loanDownPayment: 4000,
  loanApr: 6.56,
  loanTermMonths: 72,
  loanMonthlyPayment: 748,
  loanPaymentMode: "months",
  includeVehicleCost: 1,
  includeDepreciation: 1,
  includeAnnualOwnership: 1,
  includeFinancing: 0,
};

export const DEFAULT_FUEL_PRICES: Record<FuelType, number> = {
  cng: 2.96,
  diesel: 3.71,
  e85: 2.63,
  electric: 0.15,
  lpg: 3.42,
  midgrade: 3.5,
  premium: 3.86,
  regular: 2.92,
};

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  cng: "CNG",
  diesel: "Diesel",
  e85: "E85",
  electric: "Electric",
  lpg: "LPG",
  midgrade: "Midgrade",
  premium: "Premium",
  regular: "Regular",
};

export const DEFAULT_NEW_CAR_APR = 6.56;
export const DEFAULT_NEW_CAR_PAYMENT = 748;
export const DEFAULT_NEW_CAR_TERM_MONTHS = 72;

export const CAR_COST_STORAGE_KEY = "carCostState";
export const CAR_COST_CUSTOM_KEY = "carCostCustomVehicle";
export const CAR_COST_ADMIN_STORAGE_KEY = "carCostAdminState";
export const CAR_COST_STATE_VERSION = 1;
export const STALE_STATE_MS = 60 * 60 * 1000;
export const CAR_COST_STARTUP_BANNER_MESSAGE =
  "Large changes are currently underway in this calculator. You may see temporary instability while work is in progress.";
