import { CarCostValues, FuelType, IntervalSetting } from "../types";
import { createIntervalSetting } from "../utils/intervals";
import { DrivingMileageSetting } from "../types";

export const DEFAULT_DRIVING_MILEAGE: DrivingMileageSetting = {
  n: 12000,
  u: "yr",
};

export const DEFAULT_MISC_MAINTENANCE_SCHEDULE: IntervalSetting =
  createIntervalSetting("d", 15000, "mile");
export const DEFAULT_BRAKE_SERVICE_SCHEDULE: IntervalSetting =
  createIntervalSetting("d", 50000, "mile");
export const DEFAULT_BATTERY_REPLACEMENT_SCHEDULE: IntervalSetting =
  createIntervalSetting("t", 4, "year");
export const DEFAULT_MAJOR_SERVICE_SCHEDULE: IntervalSetting =
  createIntervalSetting("d", 60000, "mile");
export const DEFAULT_REPAIR_BUFFER_SCHEDULE: IntervalSetting =
  createIntervalSetting("t", 1, "year");
export const INTERVAL_MEASURE_OPTIONS = [
  { label: "Miles", value: "mile" },
  { label: "Months", value: "month" },
  { label: "Years", value: "year" },
] as const;

export const defaultValues: CarCostValues = {
  fuelType: "regular",
  fuelEfficiency: 25,
  fuelUnitPrice: 3.49,
  includeTripFuelOverride: 0,
  tripFuelEfficiency: 0,
  oilChangeCost: 75,
  oilChangeInterval: 7500,
  oilChangeMaxMonths: 6,
  tireCost: 900,
  tireInterval: 50000,
  tireMaxAgeYears: 6,
  includeWinterTires: 0,
  winterTireCost: 900,
  winterTireInterval: 30000,
  winterTireMaxAgeYears: 6,
  winterTireMonths: 4,
  miscMaintenanceCost: 600,
  miscMaintenanceSchedule: DEFAULT_MISC_MAINTENANCE_SCHEDULE,
  showAdvancedMaintenance: 0,
  brakeServiceCost: 600,
  brakeServiceSchedule: DEFAULT_BRAKE_SERVICE_SCHEDULE,
  batteryReplacementCost: 200,
  batteryReplacementSchedule: DEFAULT_BATTERY_REPLACEMENT_SCHEDULE,
  majorServiceCost: 0,
  majorServiceSchedule: DEFAULT_MAJOR_SERVICE_SCHEDULE,
  repairBufferCost: 0,
  repairBufferSchedule: DEFAULT_REPAIR_BUFFER_SCHEDULE,
  depreciationBasis: "miles",
  purchasePrice: 0,
  resaleValue: 0,
  depreciationInterval: 100000,
  tripDistance: 250,
  drivingMileage: DEFAULT_DRIVING_MILEAGE,
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

export const CAR_COST_FIELD_TOOLTIPS = {
  oilChangeMaxMonths:
    "Oil still degrades with time, even if you barely drive. The calculator uses whichever comes first: your mileage interval or this time limit.",
  tireMaxAgeYears:
    "Tires age even when the tread is still usable. Sun, heat, and time can force replacement before mileage does, so the calculator uses the earlier of tread life or max age.",
  includeWinterTires:
    "If you swap to a winter set for part of the year, the calculator can split usage between both sets and estimate replacement timing for each.",
  winterTireMaxAgeYears:
    "Winter tires often age out before they wear out because they may only be used for part of the year. This keeps that replacement timing realistic.",
  winterTireMonths:
    "This controls how much yearly mileage gets assigned to the winter set versus the primary set in recurring and ownership views.",
  miscMaintenanceCost:
    "Use this for recurring maintenance that does not fit cleanly into oil, tires, or major service. Common examples are filters, small fluids, alignments, and general upkeep.",
  miscMaintenanceSchedule:
    "Some maintenance is tracked by miles, while other upkeep is more naturally thought of by months or years. This lets you match how you actually maintain the vehicle.",
  showAdvancedMaintenance:
    "Turn this on if you want to model additional long-term upkeep like brakes, battery, major fluid services, and a repair reserve.",
  brakeServiceCost:
    "A healthy brake job often includes pads, and sometimes rotors, hardware, sensors, or brake fluid service. This lets you model that as part of long-term upkeep.",
  brakeServiceSchedule:
    "Set how often you expect a full brake service to come due so that cost can be spread across ownership realistically.",
  batteryReplacementCost:
    "12V batteries are usually more time-based than mileage-based, so this helps capture a maintenance item many owners forget to budget for.",
  batteryReplacementSchedule:
    "Use the cadence you normally expect for a battery replacement so the calculator can annualize it.",
  majorServiceCost:
    "Major service is a good place to capture bigger maintenance events like transmission fluid, differential fluid, brake fluid, coolant, spark plugs, or other milestone services.",
  majorServiceSchedule:
    "Set the miles or time between those bigger service milestones so their cost is spread across ownership instead of hitting all at once.",
  repairBufferCost:
    "A repair buffer is a reserve for irregular repairs like sensors, wheel bearings, suspension parts, AC work, leaks, or electrical issues.",
  repairBufferSchedule:
    "This spreads that repair reserve across your ownership horizon so unexpected repairs are represented in a steady, usable way.",
  annualParking:
    "Parking is usually a fixed ownership cost rather than a trip cost. It matters most for dense urban living, garages, and permit parking situations.",
  tripFuelEfficiency:
    "Use this only if you want this trip to assume different fuel economy than your usual driving. This can be useful when a route is much more highway-heavy than normal.",
} as const;

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
export const CAR_COST_STATE_VERSION = 5;
export const STALE_STATE_MS = 60 * 60 * 1000;
export const CAR_COST_STARTUP_BANNER_MESSAGE =
  "Large changes are currently underway in this calculator. It will be moving to a new home soon, so you may see temporary instability while work is in progress.";
export const CAR_COST_FUTURE_HOME_URL = "https://www.truecosttodrive.com";
