import React from "react";

export type FuelType =
  | "regular"
  | "midgrade"
  | "premium"
  | "diesel"
  | "e85"
  | "cng"
  | "lpg"
  | "electric";

export type RecurringType = "day" | "week" | "month" | "year" | "weekday";
export type TripType = "oneWay" | "roundTrip";
export type InsightCategory =
  | "global"
  | "tripEstimate"
  | "recurringDrivingTotals";

export interface CarCostProps {
  navWrapperRef?: React.RefObject<HTMLDivElement>;
}

export type CarCostValues = {
  fuelType: FuelType;
  fuelEfficiency: number;
  fuelUnitPrice: number;
  oilChangeCost: number;
  oilChangeInterval: number;
  tireCost: number;
  tireInterval: number;
  miscMaintenanceCost: number;
  miscMaintenanceBasis: "miles" | "month" | "year";
  miscMaintenanceInterval: number;
  depreciationBasis: "miles" | "years";
  purchasePrice: number;
  resaleValue: number;
  depreciationInterval: number;
  tripDistance: number;
  recurringMiles: number;
  annualInsurance: number;
  annualRegistration: number;
  annualParking: number;
  annualInspection: number;
  annualRoadside: number;
  loanDownPayment: number;
  loanApr: number;
  loanTermMonths: number;
  loanMonthlyPayment: number;
  loanPaymentMode: "months" | "payment";
  includeVehicleCost: number;
  includeDepreciation: number;
  includeAnnualOwnership: number;
  includeFinancing: number;
};

export type PersistedCarCostState = {
  version: number;
  isSharedSession: boolean;
  selectedSource: "default" | "template" | "custom";
  selectedTemplateId: string | null;
  values: CarCostValues;
  recurringType: RecurringType;
  tripType: TripType;
  updatedAt: string;
};

export type PersistedStateMigrationResult = {
  migratedState: PersistedCarCostState | null;
  startupNotice: string | null;
};

export type PersistedCarCostAdminState = {
  disableAnalyticsLogging: boolean;
};

export type VehicleTemplate = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  trimSelectionValue?: string | null;
  title: string;
  values: CarCostValues;
};

export type CustomVehicle = VehicleTemplate & { id: "custom" };

export type CustomVehicleDraft = {
  year: string;
  make: string;
  model: string;
  trim: string;
  fuelType: FuelType;
};

export type CustomVehicleField = "year" | "make" | "model" | "trim";

export type VehicleLookupOption = {
  label: string;
  value: string;
};

export type VehicleEfficiencyInfo = {
  city: number | null;
  combined: number | null;
  highway: number | null;
  unitLabel: "MPG" | "mi/kWh";
  annualFuelCost: number | null;
};

export type VehicleLookupSummary = {
  fuelType: FuelType;
  annualFuelCost: number | null;
  city: number | null;
  combined: number | null;
  highway: number | null;
  unitLabel: "MPG" | "mi/kWh";
  purchasePrice: number | null;
};

export type SelectedVehicleLookupDetails = {
  vehicleId: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  title: string;
  fuelType: FuelType;
  defaultPurchasePrice: number | null;
  efficiency: VehicleEfficiencyInfo;
  values: PartialTemplateValues;
  lookupSummary: VehicleLookupSummary;
};

export type PlannerValues = Pick<CarCostValues, "tripDistance" | "recurringMiles">;

export type SessionScopedCarCostValues = Pick<
  CarCostValues,
  | "tripDistance"
  | "recurringMiles"
  | "annualInsurance"
  | "annualRegistration"
  | "annualParking"
  | "annualInspection"
  | "annualRoadside"
  | "includeVehicleCost"
  | "includeAnnualOwnership"
>;

export type InsightDefinition = {
  id: string;
  label: string;
  benchmark: number;
  context: string;
  tooltip: string;
  methodology: string;
  sourceLabel?: string;
  sourceUrl?: string;
  associatedCategories: InsightCategory[];
};

export type PartialTemplateValues = Partial<CarCostValues> & {
  fuelMileage?: number;
};
