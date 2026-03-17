import { defaultValues } from "../../config/constants";
import { calculateCarCost } from "../calculations";

describe("calculateCarCost", () => {
  it("doubles one-way trip distance but leaves round trip as entered", () => {
    const values = {
      ...defaultValues,
      tripDistance: 50,
    };

    const oneWay = calculateCarCost(values, "oneWay", "allSeason");
    const roundTrip = calculateCarCost(values, "roundTrip", "allSeason");

    expect(oneWay.selectedTripDistance).toBe(100);
    expect(roundTrip.selectedTripDistance).toBe(50);
  });

  it("calculates annual mileage from recurring type and time-based maintenance", () => {
    const values = {
      ...defaultValues,
      drivingMileage: { n: 1000, u: "mo" as const },
      miscMaintenanceCost: 600,
      miscMaintenanceSchedule: { t: "t" as const, v: { n: 1, u: "year" as const } },
    };

    const result = calculateCarCost(values, "roundTrip", "allSeason");

    expect(result.annualMileage).toBe(12000);
    expect(result.miscCostPerMile).toBeCloseTo(0.05, 5);
  });

  it("uses the earlier of oil mileage interval or oil max months", () => {
    const values = {
      ...defaultValues,
      drivingMileage: { n: 6000, u: "yr" as const },
      oilChangeCost: 90,
      oilChangeInterval: 10000,
      oilChangeMaxMonths: 6,
    };

    const result = calculateCarCost(values, "roundTrip", "allSeason");

    expect(result.annualMileage).toBe(6000);
    expect(result.oilEffectiveIntervalMiles).toBe(3000);
    expect(result.oilCostPerMile).toBeCloseTo(0.03, 5);
  });

  it("builds financing math from loan term mode", () => {
    const values = {
      ...defaultValues,
      includeFinancing: 1,
      purchasePrice: 37000,
      loanDownPayment: 7000,
      loanApr: 4.5,
      loanTermMonths: 72,
      loanPaymentMode: "months" as const,
      depreciationBasis: "years" as const,
      depreciationInterval: 3,
    };

    const result = calculateCarCost(values, "roundTrip", "allSeason");

    expect(result.financedAmount).toBe(30000);
    expect(result.effectiveMonthlyPayment).toBeGreaterThan(0);
    expect(result.totalInterestPaid).toBeGreaterThan(0);
    expect(result.loanPaydownPoints[0]).toEqual({
      month: 0,
      balance: 30000,
      interestPaid: 0,
    });
  });

  it("uses entered monthly payment mode and derives an effective term", () => {
    const values = {
      ...defaultValues,
      includeFinancing: 1,
      purchasePrice: 32000,
      loanDownPayment: 2000,
      loanApr: 5,
      loanPaymentMode: "payment" as const,
      loanMonthlyPayment: 600,
      depreciationBasis: "years" as const,
      depreciationInterval: 5,
    };

    const result = calculateCarCost(values, "roundTrip", "allSeason");

    expect(result.effectiveMonthlyPayment).toBe(600);
    expect(result.effectiveLoanTermMonths).toBeGreaterThan(0);
    expect(result.payoffMonth).toBeGreaterThan(0);
  });

  it("treats resale above purchase as appreciation", () => {
    const values = {
      ...defaultValues,
      purchasePrice: 15000,
      resaleValue: 18000,
      depreciationBasis: "miles" as const,
      depreciationInterval: 60000,
    };

    const result = calculateCarCost(values, "roundTrip", "allSeason");

    expect(result.depreciationTotal).toBe(-3000);
    expect(result.depreciationCostPerMile).toBeCloseTo(-0.05, 5);
    expect(result.overallItems.depreciation).toBe(-3000);
  });

  it("removes annual ownership costs when the toggle is off", () => {
    const values = {
      ...defaultValues,
      includeAnnualOwnership: 0,
      annualInsurance: 2500,
      annualRegistration: 400,
    };

    const result = calculateCarCost(values, "roundTrip", "allSeason");

    expect(result.annualFixedCosts).toBe(0);
    expect(result.fixedCostPerMile).toBe(0);
  });

  it("excludes fixed annual ownership and financing overhead from trip cost", () => {
    const values = {
      ...defaultValues,
      tripDistance: 100,
      annualInsurance: 3650,
      annualRegistration: 365,
      drivingMileage: { n: 12000, u: "yr" as const },
      includeAnnualOwnership: 1,
      includeFinancing: 1,
      purchasePrice: 32000,
      loanDownPayment: 2000,
      loanApr: 5,
      loanTermMonths: 72,
    };

    const result = calculateCarCost(values, "roundTrip", "allSeason");

    expect(result.fixedCostPerMile).toBeGreaterThan(0);
    expect(result.financeCostPerMile).toBeGreaterThan(0);
    expect(result.tripCost).toBeCloseTo(
      result.selectedTripDistance * result.tripVariableCostPerMile,
      5,
    );
  });

  it("removes vehicle cost effects when the parent vehicle-cost toggle is off", () => {
    const values = {
      ...defaultValues,
      includeVehicleCost: 0,
      includeDepreciation: 1,
      includeFinancing: 1,
      purchasePrice: 37000,
      resaleValue: 18000,
      loanDownPayment: 5000,
      loanApr: 6,
      loanTermMonths: 72,
    };

    const result = calculateCarCost(values, "roundTrip", "allSeason");

    expect(result.depreciationCostPerMile).toBe(0);
    expect(result.depreciationTotal).toBe(0);
    expect(result.financeCostPerMile).toBe(0);
    expect(result.totalInterestPaid).toBe(0);
    expect(result.netVehicleCostAtSale).toBe(0);
  });

  it("uses winter tires for trip estimates when selected and blends both sets for yearly cost", () => {
    const values = {
      ...defaultValues,
      drivingMileage: { n: 12000, u: "yr" as const },
      includeWinterTires: 1,
      tireCost: 900,
      tireInterval: 50000,
      tireMaxAgeYears: 6,
      winterTireCost: 1000,
      winterTireInterval: 25000,
      winterTireMaxAgeYears: 6,
      winterTireMonths: 4,
      tripDistance: 100,
    };

    const allSeasonTrip = calculateCarCost(values, "roundTrip", "allSeason");
    const winterTrip = calculateCarCost(values, "roundTrip", "winter");

    expect(allSeasonTrip.tripTireCostPerMile).not.toBe(winterTrip.tripTireCostPerMile);
    expect(winterTrip.tireCostPerMile).toBeGreaterThan(0);
  });

  it("uses the trip fuel override only for trip calculations", () => {
    const values = {
      ...defaultValues,
      fuelEfficiency: 25,
      fuelUnitPrice: 3,
      includeTripFuelOverride: 1,
      tripFuelEfficiency: 35,
      tripDistance: 100,
    };

    const result = calculateCarCost(values, "roundTrip", "allSeason");

    expect(result.fuelCostPerMile).toBeCloseTo(0.12, 5);
    expect(result.tripFuelCostPerMile).toBeCloseTo(3 / 35, 5);
    expect(result.tripFuelEfficiencyUsed).toBe(35);
    expect(result.tripCost).toBeCloseTo(
      result.selectedTripDistance * result.tripVariableCostPerMile,
      5,
    );
  });
});
