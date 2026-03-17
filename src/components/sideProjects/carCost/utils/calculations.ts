import { CarCostValues, TripTireSet, TripType } from "../types";
import { isToggleEnabled } from "./formatters";
import { getAnnualMileageFromSetting } from "./drivingMileage";
import { getAnnualizedIntervalCost } from "./intervals";

export type LoanPaydownPoint = {
  month: number;
  balance: number;
  interestPaid: number;
};

export type CarCostCalculations = {
  fuelCostPerMile: number;
  tripFuelCostPerMile: number;
  tripFuelEfficiencyUsed: number;
  oilCostPerMile: number;
  oilEffectiveIntervalMiles: number;
  oilChangesUsedOverOwnership: number;
  oilRemainingLifePercentAtSale: number;
  tireCostPerMile: number;
  tripTireCostPerMile: number;
  primaryTireCostPerMile: number;
  winterTireCostPerMile: number;
  miscCostPerMile: number;
  miscAnnualCost: number;
  brakeAnnualCost: number;
  batteryAnnualCost: number;
  majorServiceAnnualCost: number;
  repairBufferAnnualCost: number;
  primaryTireAnnualCost: number;
  winterTireAnnualCost: number;
  primaryTireEffectiveMiles: number;
  winterTireEffectiveMiles: number;
  primaryTireSetsUsedOverOwnership: number;
  winterTireSetsUsedOverOwnership: number;
  primaryTireRemainingTreadPercentAtSale: number;
  winterTireRemainingTreadPercentAtSale: number;
  depreciationCostPerMile: number;
  variableCostPerMile: number;
  tripVariableCostPerMile: number;
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
  tripType: TripType,
  tripTireSet: TripTireSet,
): CarCostCalculations => {
  const includesVehicleCost = isToggleEnabled(values.includeVehicleCost);
  const tripMultiplier = tripType === "oneWay" ? 2 : 1;
  const selectedTripDistance = values.tripDistance * tripMultiplier;
  const fuelCostPerMile =
    values.fuelEfficiency > 0 ? values.fuelUnitPrice / values.fuelEfficiency : 0;
  const tripFuelEfficiencyUsed =
    isToggleEnabled(values.includeTripFuelOverride) && values.tripFuelEfficiency > 0
      ? values.tripFuelEfficiency
      : values.fuelEfficiency;
  const tripFuelCostPerMile =
    tripFuelEfficiencyUsed > 0
      ? values.fuelUnitPrice / tripFuelEfficiencyUsed
      : 0;

  const annualMileage = getAnnualMileageFromSetting(values.drivingMileage);
  const oilAgeLimitMiles =
    values.oilChangeMaxMonths > 0 && annualMileage > 0
      ? annualMileage * (values.oilChangeMaxMonths / 12)
      : Number.POSITIVE_INFINITY;
  const oilEffectiveIntervalMiles = Math.min(
    values.oilChangeInterval > 0 ? values.oilChangeInterval : Number.POSITIVE_INFINITY,
    oilAgeLimitMiles,
  );
  const oilCostPerMile =
    Number.isFinite(oilEffectiveIntervalMiles) &&
    oilEffectiveIntervalMiles > 0 &&
    values.oilChangeCost > 0
      ? values.oilChangeCost / oilEffectiveIntervalMiles
      : 0;
  const winterUsageShare = isToggleEnabled(values.includeWinterTires)
    ? Math.min(Math.max(values.winterTireMonths, 1), 11) / 12
    : 0;
  const primaryUsageShare = Math.max(0, 1 - winterUsageShare);
  const primaryAnnualMileage = annualMileage * primaryUsageShare;
  const winterAnnualMileage = annualMileage * winterUsageShare;
  const getTireCostPerMile = (
    tireCost: number,
    tireInterval: number,
    tireMaxAgeYears: number,
    annualTireMileage: number,
  ) => {
    const mileageLimit =
      tireInterval > 0 ? tireInterval : Number.POSITIVE_INFINITY;
    const ageLimitMiles =
      tireMaxAgeYears > 0 && annualTireMileage > 0
        ? annualTireMileage * tireMaxAgeYears
        : Number.POSITIVE_INFINITY;
    const effectiveMiles = Math.min(mileageLimit, ageLimitMiles);

    if (!Number.isFinite(effectiveMiles) || effectiveMiles <= 0 || tireCost <= 0) {
      return 0;
    }

    return tireCost / effectiveMiles;
  };
  const getEffectiveLifecycleMiles = (
    mileageLimit: number,
    annualDrivenMiles: number,
    maxAgeYears: number,
  ) => {
    const treadLifeMiles =
      mileageLimit > 0 ? mileageLimit : Number.POSITIVE_INFINITY;
    const ageLimitMiles =
      maxAgeYears > 0 && annualDrivenMiles > 0
        ? annualDrivenMiles * maxAgeYears
        : Number.POSITIVE_INFINITY;

    return Math.min(treadLifeMiles, ageLimitMiles);
  };
  const getLifecycleUsageMetrics = (
    ownershipMilesDriven: number,
    effectiveMiles: number,
  ) => {
    if (!Number.isFinite(effectiveMiles) || effectiveMiles <= 0 || ownershipMilesDriven <= 0) {
      return { setsUsed: 0, remainingPercent: 100 };
    }

    const setsUsed = ownershipMilesDriven / effectiveMiles;
    const usedFraction = setsUsed % 1;
    const remainingPercent =
      usedFraction === 0 ? 0 : Math.max(0, (1 - usedFraction) * 100);

    return { setsUsed, remainingPercent };
  };
  const primaryTireEffectiveMiles = getEffectiveLifecycleMiles(
    values.tireInterval,
    primaryAnnualMileage,
    values.tireMaxAgeYears,
  );
  const winterTireEffectiveMiles = isToggleEnabled(values.includeWinterTires)
    ? getEffectiveLifecycleMiles(
        values.winterTireInterval,
        winterAnnualMileage,
        values.winterTireMaxAgeYears,
      )
    : 0;
  const primaryTireCostPerMile = getTireCostPerMile(
    values.tireCost,
    values.tireInterval,
    values.tireMaxAgeYears,
    primaryAnnualMileage,
  );
  const winterTireCostPerMile = isToggleEnabled(values.includeWinterTires)
    ? getTireCostPerMile(
        values.winterTireCost,
        values.winterTireInterval,
        values.winterTireMaxAgeYears,
        winterAnnualMileage,
      )
    : 0;
  const primaryTireAnnualCost = primaryTireCostPerMile * primaryAnnualMileage;
  const winterTireAnnualCost = winterTireCostPerMile * winterAnnualMileage;
  const tireCostPerMile =
    annualMileage > 0
      ? (primaryTireAnnualCost + winterTireAnnualCost) / annualMileage
      : 0;
  const tripTireCostPerMile =
    isToggleEnabled(values.includeWinterTires) && tripTireSet === "winter"
      ? winterTireCostPerMile
      : primaryTireCostPerMile;
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
  const primaryTireUsageMetrics = getLifecycleUsageMetrics(
    primaryUsageShare * ownershipMiles,
    primaryTireEffectiveMiles,
  );
  const winterTireUsageMetrics = getLifecycleUsageMetrics(
    winterUsageShare * ownershipMiles,
    winterTireEffectiveMiles,
  );
  const oilUsageMetrics = getLifecycleUsageMetrics(
    ownershipMiles,
    oilEffectiveIntervalMiles,
  );
  const depreciationValueChange = values.purchasePrice - values.resaleValue;
  const depreciationCostPerMile =
    includesVehicleCost &&
    isToggleEnabled(values.includeDepreciation) &&
    ownershipMiles > 0
      ? depreciationValueChange / ownershipMiles
      : 0;
  const miscAnnualCost = getAnnualizedIntervalCost(
    values.miscMaintenanceCost,
    values.miscMaintenanceSchedule,
    annualMileage,
  );
  const brakeAnnualCost = isToggleEnabled(values.showAdvancedMaintenance)
    ? getAnnualizedIntervalCost(
        values.brakeServiceCost,
        values.brakeServiceSchedule,
        annualMileage,
      )
    : 0;
  const batteryAnnualCost = isToggleEnabled(values.showAdvancedMaintenance)
    ? getAnnualizedIntervalCost(
        values.batteryReplacementCost,
        values.batteryReplacementSchedule,
        annualMileage,
      )
    : 0;
  const majorServiceAnnualCost = isToggleEnabled(values.showAdvancedMaintenance)
    ? getAnnualizedIntervalCost(
        values.majorServiceCost,
        values.majorServiceSchedule,
        annualMileage,
      )
    : 0;
  const repairBufferAnnualCost = isToggleEnabled(values.showAdvancedMaintenance)
    ? getAnnualizedIntervalCost(
        values.repairBufferCost,
        values.repairBufferSchedule,
        annualMileage,
      )
    : 0;
  const miscCostPerMile =
    annualMileage > 0
      ? (miscAnnualCost +
          brakeAnnualCost +
          batteryAnnualCost +
          majorServiceAnnualCost +
          repairBufferAnnualCost) /
        annualMileage
      : 0;
  const variableCostPerMile =
    fuelCostPerMile +
    oilCostPerMile +
    tireCostPerMile +
    miscCostPerMile +
    depreciationCostPerMile;
  const tripVariableCostPerMile =
    tripFuelCostPerMile +
    oilCostPerMile +
    tripTireCostPerMile +
    miscCostPerMile +
    depreciationCostPerMile;
  const annualFixedCosts = isToggleEnabled(values.includeAnnualOwnership)
    ? values.annualInsurance +
      values.annualRegistration +
      values.annualParking +
      values.annualInspection +
      values.annualRoadside
    : 0;
  const depreciationTotal =
    includesVehicleCost && isToggleEnabled(values.includeDepreciation)
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

  if (includesVehicleCost && isToggleEnabled(values.includeFinancing) && financedAmount > 0) {
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
    includesVehicleCost &&
    isToggleEnabled(values.includeFinancing) &&
    financedAmount > 0 &&
    payoffMonth === null &&
    loanPaydownPoints[loanPaydownPoints.length - 1]?.balance === 0
  ) {
    payoffMonth = loanPaydownPoints[loanPaydownPoints.length - 1].month;
  }

  const annualFinanceCost =
    includesVehicleCost &&
    isToggleEnabled(values.includeFinancing) &&
    ownershipYears > 0
      ? totalInterestPaid / ownershipYears
      : 0;
  const fixedCostPerMile = annualMileage > 0 ? annualFixedCosts / annualMileage : 0;
  const financeCostPerMile =
    includesVehicleCost && ownershipMiles > 0 ? totalInterestPaid / ownershipMiles : 0;
  const trueCostPerMile =
    variableCostPerMile + fixedCostPerMile + financeCostPerMile;
  const tripCost = selectedTripDistance * tripVariableCostPerMile;
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
  const netVehicleCostAtSale =
    includesVehicleCost && isToggleEnabled(values.includeFinancing)
    ? values.loanDownPayment + totalLoanPaymentsMade - equityAtSale
    : includesVehicleCost
      ? depreciationTotal
      : 0;
  const overallItems = {
    fuel: fuelCostPerMile * ownershipMiles,
    oil: oilCostPerMile * ownershipMiles,
    tires: (primaryTireAnnualCost + winterTireAnnualCost) * ownershipYears,
    misc:
      (miscAnnualCost +
        brakeAnnualCost +
        batteryAnnualCost +
        majorServiceAnnualCost +
        repairBufferAnnualCost) *
      ownershipYears,
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
    tripFuelCostPerMile,
    tripFuelEfficiencyUsed,
    oilCostPerMile,
    oilEffectiveIntervalMiles,
    oilChangesUsedOverOwnership: oilUsageMetrics.setsUsed,
    oilRemainingLifePercentAtSale: oilUsageMetrics.remainingPercent,
    tireCostPerMile,
    tripTireCostPerMile,
    primaryTireCostPerMile,
    winterTireCostPerMile,
    miscCostPerMile,
    miscAnnualCost,
    brakeAnnualCost,
    batteryAnnualCost,
    majorServiceAnnualCost,
    repairBufferAnnualCost,
    primaryTireAnnualCost,
    winterTireAnnualCost,
    primaryTireEffectiveMiles,
    winterTireEffectiveMiles,
    primaryTireSetsUsedOverOwnership: primaryTireUsageMetrics.setsUsed,
    winterTireSetsUsedOverOwnership: winterTireUsageMetrics.setsUsed,
    primaryTireRemainingTreadPercentAtSale:
      primaryTireUsageMetrics.remainingPercent,
    winterTireRemainingTreadPercentAtSale:
      winterTireUsageMetrics.remainingPercent,
    depreciationCostPerMile,
    variableCostPerMile,
    tripVariableCostPerMile,
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
