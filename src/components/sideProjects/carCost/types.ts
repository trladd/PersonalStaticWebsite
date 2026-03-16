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
  selectedSource: "default" | "template" | "custom";
  selectedTemplateId: string | null;
  values: CarCostValues;
  recurringType: RecurringType;
  tripType: TripType;
  updatedAt: string;
};

export type VehicleTemplate = {
  id: string;
  year: number;
  make: string;
  model: string;
  title: string;
  values: CarCostValues;
};

export type CustomVehicle = VehicleTemplate & { id: "custom" };

export type CustomVehicleDraft = {
  year: string;
  make: string;
  model: string;
  fuelType: FuelType;
};

export type CustomVehicleField = "year" | "make" | "model";

export type PlannerValues = Pick<CarCostValues, "tripDistance" | "recurringMiles">;

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
