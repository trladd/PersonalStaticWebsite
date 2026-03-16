import { defaultValues } from "../../config/constants";
import { calculateCarCost } from "../calculations";

describe("calculateCarCost", () => {
  it("doubles one-way trip distance but leaves round trip as entered", () => {
    const values = {
      ...defaultValues,
      tripDistance: 50,
    };

    const oneWay = calculateCarCost(values, "year", "oneWay");
    const roundTrip = calculateCarCost(values, "year", "roundTrip");

    expect(oneWay.selectedTripDistance).toBe(100);
    expect(roundTrip.selectedTripDistance).toBe(50);
  });

  it("calculates annual mileage from recurring type and time-based maintenance", () => {
    const values = {
      ...defaultValues,
      recurringMiles: 1000,
      miscMaintenanceCost: 600,
      miscMaintenanceBasis: "year" as const,
      miscMaintenanceInterval: 1,
    };

    const result = calculateCarCost(values, "month", "roundTrip");

    expect(result.annualMileage).toBe(12000);
    expect(result.miscCostPerMile).toBeCloseTo(0.05, 5);
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

    const result = calculateCarCost(values, "year", "roundTrip");

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

    const result = calculateCarCost(values, "year", "roundTrip");

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

    const result = calculateCarCost(values, "year", "roundTrip");

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

    const result = calculateCarCost(values, "year", "roundTrip");

    expect(result.annualFixedCosts).toBe(0);
    expect(result.fixedCostPerMile).toBe(0);
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

    const result = calculateCarCost(values, "year", "roundTrip");

    expect(result.depreciationCostPerMile).toBe(0);
    expect(result.depreciationTotal).toBe(0);
    expect(result.financeCostPerMile).toBe(0);
    expect(result.totalInterestPaid).toBe(0);
    expect(result.netVehicleCostAtSale).toBe(0);
  });
});
