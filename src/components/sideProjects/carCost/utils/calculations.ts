import { CarCostValues, RecurringType, TripType } from "../types";
import { isToggleEnabled } from "./formatters";

export type LoanPaydownPoint = {
  month: number;
  balance: number;
  interestPaid: number;
};

export type CarCostCalculations = {
  fuelCostPerMile: number;
  oilCostPerMile: number;
  tireCostPerMile: number;
  miscCostPerMile: number;
  depreciationCostPerMile: number;
  variableCostPerMile: number;
  annualMileage: number;
  ownershipYears: number;
  ownershipMiles: number;
  monthsOwned: number;
  annualFixedCosts: number;
  annualFinanceCost: number;
  depreciationTotal: number;
  financedAmount: number;
  effectiveMonthlyPayment: number;
  effectiveLoanTermMonths: number;
  totalLoanPaymentsMade: number;
  remainingLoanBalance: number;
  totalInterestPaid: number;
  payoffMonth: number | null;
  loanPaydownPoints: LoanPaydownPoint[];
  equityAtSale: number;
  netVehicleCostAtSale: number;
  fixedCostPerMile: number;
  financeCostPerMile: number;
  trueCostPerMile: number;
  selectedTripDistance: number;
  tripCost: number;
  recurringDrivingCosts: Record<"day" | "week" | "month" | "year", number>;
  recurringTrueCosts: Record<"day" | "week" | "month" | "year", number>;
  overallItems: {
    fuel: number;
    oil: number;
    tires: number;
    misc: number;
    depreciation: number;
    ownership: number;
    financing: number;
  };
  overallCost: number;
};

export const calculateCarCost = (
  values: CarCostValues,
  recurringType: RecurringType,
  tripType: TripType,
): CarCostCalculations => {
  const tripMultiplier = tripType === "oneWay" ? 2 : 1;
  const selectedTripDistance = values.tripDistance * tripMultiplier;
  const fuelCostPerMile =
    values.fuelEfficiency > 0 ? values.fuelUnitPrice / values.fuelEfficiency : 0;
  const oilCostPerMile =
    values.oilChangeInterval > 0 ? values.oilChangeCost / values.oilChangeInterval : 0;
  const tireCostPerMile =
    values.tireInterval > 0 ? values.tireCost / values.tireInterval : 0;

  const annualMileageByType: Record<RecurringType, number> = {
    day: values.recurringMiles * 365,
    week: values.recurringMiles * 52,
    month: values.recurringMiles * 12,
    year: values.recurringMiles,
    weekday: values.recurringMiles * 5 * 52,
  };

  const annualMileage = annualMileageByType[recurringType];
  const ownershipYears =
    values.depreciationBasis === "years"
      ? values.depreciationInterval
      : annualMileage > 0
        ? values.depreciationInterval / annualMileage
        : 0;
  const ownershipMiles =
    values.depreciationBasis === "miles"
      ? values.depreciationInterval
      : annualMileage * values.depreciationInterval;
  const depreciationValueChange = values.purchasePrice - values.resaleValue;
  const depreciationCostPerMile =
    isToggleEnabled(values.includeDepreciation) && ownershipMiles > 0
      ? depreciationValueChange / ownershipMiles
      : 0;
  const miscCostPerMile =
    values.miscMaintenanceInterval > 0
      ? values.miscMaintenanceBasis === "miles"
        ? values.miscMaintenanceCost / values.miscMaintenanceInterval
        : annualMileage > 0
          ? (values.miscMaintenanceCost *
              (values.miscMaintenanceBasis === "month"
                ? 12 / values.miscMaintenanceInterval
                : 1 / values.miscMaintenanceInterval)) /
            annualMileage
          : 0
      : 0;
  const variableCostPerMile =
    fuelCostPerMile +
    oilCostPerMile +
    tireCostPerMile +
    miscCostPerMile +
    depreciationCostPerMile;
  const annualFixedCosts = isToggleEnabled(values.includeAnnualOwnership)
    ? values.annualInsurance +
      values.annualRegistration +
      values.annualParking +
      values.annualInspection +
      values.annualRoadside
    : 0;
  const depreciationTotal = isToggleEnabled(values.includeDepreciation)
    ? depreciationValueChange
    : 0;
  const monthsOwned = Math.max(0, Math.round(ownershipYears * 12));
  const financedAmount = Math.max(values.purchasePrice - values.loanDownPayment, 0);
  const monthlyRate = values.loanApr / 100 / 12;
  const normalizedLoanTermMonths = Math.max(0, Math.round(values.loanTermMonths));
  const effectiveMonthlyPayment =
    values.loanPaymentMode === "months"
      ? financedAmount > 0 && normalizedLoanTermMonths > 0
        ? monthlyRate > 0
          ? (financedAmount * monthlyRate) /
            (1 - Math.pow(1 + monthlyRate, -normalizedLoanTermMonths))
          : financedAmount / normalizedLoanTermMonths
        : 0
      : values.loanMonthlyPayment;

  let remainingLoanBalance = financedAmount;
  let totalLoanPaymentsMade = 0;
  let totalInterestPaid = 0;
  let payoffMonth: number | null = financedAmount > 0 ? null : 0;
  const loanPaydownPoints: LoanPaydownPoint[] = [
    { month: 0, balance: financedAmount, interestPaid: 0 },
  ];

  if (isToggleEnabled(values.includeFinancing) && financedAmount > 0) {
    const simulationMonths =
      values.loanPaymentMode === "months"
        ? Math.max(monthsOwned, normalizedLoanTermMonths)
        : Math.max(monthsOwned, 1);

    for (let month = 1; month <= simulationMonths; month += 1) {
      const monthlyInterest = remainingLoanBalance * monthlyRate;
      const scheduledPayment = effectiveMonthlyPayment;
      const actualPayment = Math.min(
        scheduledPayment,
        remainingLoanBalance + monthlyInterest,
      );

      totalLoanPaymentsMade += actualPayment;
      totalInterestPaid += monthlyInterest;
      remainingLoanBalance = Math.max(
        remainingLoanBalance + monthlyInterest - actualPayment,
        0,
      );
      loanPaydownPoints.push({
        month,
        balance: remainingLoanBalance,
        interestPaid: totalInterestPaid,
      });

      if (remainingLoanBalance <= 0.01) {
        remainingLoanBalance = 0;
        payoffMonth = month;
        break;
      }

      if (scheduledPayment <= monthlyInterest) {
        payoffMonth = null;
      }
    }
  } else {
    remainingLoanBalance = 0;
  }

  if (
    isToggleEnabled(values.includeFinancing) &&
    financedAmount > 0 &&
    payoffMonth === null &&
    loanPaydownPoints[loanPaydownPoints.length - 1]?.balance === 0
  ) {
    payoffMonth = loanPaydownPoints[loanPaydownPoints.length - 1].month;
  }

  const annualFinanceCost =
    isToggleEnabled(values.includeFinancing) && ownershipYears > 0
      ? totalInterestPaid / ownershipYears
      : 0;
  const fixedCostPerMile = annualMileage > 0 ? annualFixedCosts / annualMileage : 0;
  const financeCostPerMile = ownershipMiles > 0 ? totalInterestPaid / ownershipMiles : 0;
  const trueCostPerMile =
    variableCostPerMile + fixedCostPerMile + financeCostPerMile;
  const tripCost = selectedTripDistance * trueCostPerMile;
  const recurringDrivingCosts = {
    day: (annualMileage * variableCostPerMile) / 365,
    week: (annualMileage * variableCostPerMile) / 52,
    month: (annualMileage * variableCostPerMile) / 12,
    year: annualMileage * variableCostPerMile,
  };
  const recurringTrueCosts = {
    day: recurringDrivingCosts.day + annualFixedCosts / 365 + annualFinanceCost / 365,
    week: recurringDrivingCosts.week + annualFixedCosts / 52 + annualFinanceCost / 52,
    month:
      recurringDrivingCosts.month + annualFixedCosts / 12 + annualFinanceCost / 12,
    year: recurringDrivingCosts.year + annualFixedCosts + annualFinanceCost,
  };
  const equityAtSale = values.resaleValue - remainingLoanBalance;
  const netVehicleCostAtSale = isToggleEnabled(values.includeFinancing)
    ? values.loanDownPayment + totalLoanPaymentsMade - equityAtSale
    : depreciationTotal;
  const overallItems = {
    fuel: fuelCostPerMile * ownershipMiles,
    oil: oilCostPerMile * ownershipMiles,
    tires: tireCostPerMile * ownershipMiles,
    misc: miscCostPerMile * ownershipMiles,
    depreciation: depreciationTotal,
    ownership: annualFixedCosts * ownershipYears,
    financing: Math.max(totalInterestPaid, 0),
  };
  const overallCost =
    overallItems.fuel +
    overallItems.oil +
    overallItems.tires +
    overallItems.misc +
    overallItems.depreciation +
    overallItems.ownership +
    overallItems.financing;

  return {
    fuelCostPerMile,
    oilCostPerMile,
    tireCostPerMile,
    miscCostPerMile,
    depreciationCostPerMile,
    variableCostPerMile,
    annualMileage,
    ownershipYears,
    ownershipMiles,
    monthsOwned,
    annualFixedCosts,
    annualFinanceCost,
    depreciationTotal,
    financedAmount,
    effectiveMonthlyPayment,
    effectiveLoanTermMonths:
      values.loanPaymentMode === "months"
        ? normalizedLoanTermMonths
        : (payoffMonth ?? monthsOwned),
    totalLoanPaymentsMade,
    remainingLoanBalance,
    totalInterestPaid,
    payoffMonth,
    loanPaydownPoints,
    equityAtSale,
    netVehicleCostAtSale,
    fixedCostPerMile,
    financeCostPerMile,
    trueCostPerMile,
    selectedTripDistance,
    tripCost,
    recurringDrivingCosts,
    recurringTrueCosts,
    overallItems,
    overallCost,
  };
};
