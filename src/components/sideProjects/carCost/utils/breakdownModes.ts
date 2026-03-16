import { BreakdownMode, CostBreakdownViewerMode } from "../CostBreakdownViewer";
import { CarCostValues } from "../types";
import { BreakdownItemDetail } from "../BreakdownItemDetailModal";
import { CarCostCalculations } from "./calculations";
import { formatCurrency, formatNumber, isToggleEnabled } from "./formatters";

type BreakdownItem = CostBreakdownViewerMode["items"][number];

const colors = {
  fuel: "#b85c38",
  oil: "#d47a4d",
  tires: "#8f633c",
  misc: "#d9a15d",
  depreciation: "#6f8f72",
  ownership: "#4f6d7a",
  financing: "#8a5f8f",
};

const recurringModeMeta: Record<
  "day" | "week" | "month" | "year" | "overall",
  { label: string; description: string; unitLabel: string }
> = {
  day: {
    label: "Day",
    description:
      "See how each category contributes to one day of driving using your recurring miles assumption.",
    unitLabel: "per day",
  },
  week: {
    label: "Week",
    description:
      "See how each category contributes to one week of driving based on your recurring miles setup.",
    unitLabel: "per week",
  },
  month: {
    label: "Month",
    description:
      "See how each category contributes to one month of driving using the annualized mileage assumption.",
    unitLabel: "per month",
  },
  year: {
    label: "Year",
    description:
      "See how each category contributes across a full year, including annual ownership costs.",
    unitLabel: "per year",
  },
  overall: {
    label: "Overall",
    description:
      "See how each category adds up across your full ownership horizon using annual miles and your depreciation timeline.",
    unitLabel: "total ownership",
  },
};

const buildRecurringMilesByPeriod = (annualMileage: number) => ({
  day: annualMileage / 365,
  week: annualMileage / 52,
  month: annualMileage / 12,
  year: annualMileage,
  weekday: annualMileage / 260,
});

const buildRecurringOwnershipByPeriod = (annualFixedCosts: number) => ({
  day: annualFixedCosts / 365,
  week: annualFixedCosts / 52,
  month: annualFixedCosts / 12,
  year: annualFixedCosts,
  weekday: annualFixedCosts / 260,
});

const buildRecurringFinanceByPeriod = (annualFinanceCost: number) => ({
  day: annualFinanceCost / 365,
  week: annualFinanceCost / 52,
  month: annualFinanceCost / 12,
  year: annualFinanceCost,
  weekday: annualFinanceCost / 260,
});

const getOwnershipFactor = (
  calculations: CarCostCalculations,
  modeKey: BreakdownMode,
  miles: number,
) => {
  switch (modeKey) {
    case "mile":
      return calculations.annualMileage > 0 ? 1 / calculations.annualMileage : 0;
    case "trip":
      return calculations.annualMileage > 0
        ? calculations.selectedTripDistance / calculations.annualMileage
        : 0;
    case "day":
      return 1 / 365;
    case "week":
      return 1 / 52;
    case "month":
      return 1 / 12;
    case "year":
      return 1;
    case "overall":
      return calculations.ownershipYears;
    default:
      return miles > 0 && calculations.annualMileage > 0
        ? miles / calculations.annualMileage
        : 0;
  }
};

const buildOwnershipSegments = (values: CarCostValues, factor: number) =>
  [
    {
      label: "Insurance",
      value: isToggleEnabled(values.includeAnnualOwnership)
        ? values.annualInsurance * factor
        : 0,
      color: "#4f6d7a",
    },
    {
      label: "Registration",
      value: isToggleEnabled(values.includeAnnualOwnership)
        ? values.annualRegistration * factor
        : 0,
      color: "#6a8793",
    },
    {
      label: "Parking",
      value: isToggleEnabled(values.includeAnnualOwnership)
        ? values.annualParking * factor
        : 0,
      color: "#8ea6af",
    },
    {
      label: "Inspection / emissions",
      value: isToggleEnabled(values.includeAnnualOwnership)
        ? values.annualInspection * factor
        : 0,
      color: "#9fb8c0",
    },
    {
      label: "Roadside assistance",
      value: isToggleEnabled(values.includeAnnualOwnership)
        ? values.annualRoadside * factor
        : 0,
      color: "#bfd2d8",
    },
  ].filter((segment) => segment.value > 0);

const buildServiceMetrics = ({
  costValue,
  serviceCost,
  serviceIntervalLabel,
  serviceIntervalValue,
  unitNoun,
  modeLabel,
}: {
  costValue: number;
  serviceCost: number;
  serviceIntervalLabel: string;
  serviceIntervalValue: number;
  unitNoun: string;
  modeLabel: string;
}) => {
  const equivalent = serviceCost > 0 ? costValue / serviceCost : 0;
  const whole = Math.floor(equivalent);
  const partialPercent =
    equivalent >= 1 ? (equivalent - whole) * 100 : equivalent * 100;

  return [
    {
      label: `Cost in this ${modeLabel.toLowerCase()} view`,
      value: formatCurrency(costValue),
    },
    {
      label: serviceIntervalLabel,
      value: `${formatNumber(serviceIntervalValue)} ${unitNoun}`,
    },
    {
      label: "Equivalent services used",
      value: formatNumber(equivalent, 2),
    },
    { label: "Completed full services", value: formatNumber(whole) },
    {
      label: equivalent >= 1 ? "Next service used" : "Single service used",
      value: `${formatNumber(partialPercent, 1)}%`,
    },
  ];
};

const buildModeItems = (
  values: CarCostValues,
  calculations: CarCostCalculations,
  recurringOwnershipByPeriod: ReturnType<typeof buildRecurringOwnershipByPeriod>,
  recurringFinanceByPeriod: ReturnType<typeof buildRecurringFinanceByPeriod>,
  modeKey: BreakdownMode,
  modeLabel: string,
  unitLabel: string,
  miles: number,
): BreakdownItem[] => {
  const vehicleValueLabel =
    calculations.depreciationTotal < 0 ? "Appreciation" : "Depreciation";
  const fuelValue =
    modeKey === "overall"
      ? calculations.overallItems.fuel
      : calculations.fuelCostPerMile * miles;
  const oilValue =
    modeKey === "overall"
      ? calculations.overallItems.oil
      : calculations.oilCostPerMile * miles;
  const tireValue =
    modeKey === "overall"
      ? calculations.overallItems.tires
      : calculations.tireCostPerMile * miles;
  const miscValue =
    modeKey === "overall"
      ? calculations.overallItems.misc
      : calculations.miscCostPerMile * miles;
  const depreciationValue =
    modeKey === "overall"
      ? calculations.overallItems.depreciation
      : modeKey === "trip"
        ? Math.max(calculations.depreciationCostPerMile, 0) * miles
        : calculations.depreciationCostPerMile * miles;
  const ownershipValue =
    modeKey === "overall"
      ? calculations.overallItems.ownership
      : modeKey === "trip"
        ? calculations.fixedCostPerMile * miles
        : modeKey === "mile"
          ? calculations.fixedCostPerMile
          : recurringOwnershipByPeriod[modeKey as "day" | "week" | "month" | "year"];
  const financingValue =
    modeKey === "overall"
      ? calculations.overallItems.financing
      : modeKey === "trip"
        ? calculations.financeCostPerMile * miles
        : modeKey === "mile"
          ? calculations.financeCostPerMile
          : recurringFinanceByPeriod[modeKey as "day" | "week" | "month" | "year"];

  const ownershipFactor = getOwnershipFactor(calculations, modeKey, miles);
  const ownershipSegments = buildOwnershipSegments(values, ownershipFactor);

  const depreciationDetail: BreakdownItemDetail = {
    title: `${vehicleValueLabel} for ${modeLabel.toLowerCase()}`,
    subtitle:
      "Shows the vehicle's expected value change over your ownership horizon, with financing shown alongside it for context.",
    metrics: [
      {
        label: `${vehicleValueLabel} in this ${modeLabel.toLowerCase()} view`,
        value: formatCurrency(depreciationValue),
      },
      { label: "Purchase price", value: formatCurrency(values.purchasePrice) },
      { label: "Expected resale value", value: formatCurrency(values.resaleValue) },
      {
        label:
          values.depreciationBasis === "miles"
            ? "Ownership miles assumed"
            : "Ownership years assumed",
        value:
          values.depreciationBasis === "miles"
            ? `${formatNumber(values.depreciationInterval)} miles`
            : `${formatNumber(values.depreciationInterval, 1)} years`,
      },
    ],
    pieTitle: "Vehicle cost context",
    pieSegments: [
      {
        label: vehicleValueLabel,
        value: Math.abs(depreciationValue),
        color: colors.depreciation,
      },
    ].filter((segment) => segment.value > 0),
    steps: [
      `Expected value change = ${formatCurrency(values.purchasePrice)} - ${formatCurrency(
        values.resaleValue,
      )} = ${formatCurrency(calculations.depreciationTotal)}.`,
      `That total is spread across your selected ownership horizon and allocated into this ${modeLabel.toLowerCase()} view.`,
    ],
  };

  return [
    {
      label: "Fuel",
      value: fuelValue,
      color: colors.fuel,
      detail: {
        title: `Fuel detail for ${modeLabel.toLowerCase()}`,
        subtitle:
          values.fuelType === "electric"
            ? `Energy usage for ${unitLabel}.`
            : `Fuel usage for ${unitLabel}.`,
        metrics: [
          {
            label: `Cost in this ${modeLabel.toLowerCase()} view`,
            value: formatCurrency(fuelValue),
          },
          {
            label:
              values.fuelType === "electric"
                ? "Estimated kWh used"
                : "Estimated gallons used",
            value: formatNumber(
              values.fuelUnitPrice > 0 ? fuelValue / values.fuelUnitPrice : 0,
              2,
            ),
          },
          {
            label:
              values.fuelType === "electric" ? "Electricity rate" : "Fuel price",
            value: `${formatCurrency(values.fuelUnitPrice)} per ${
              values.fuelType === "electric" ? "kWh" : "gallon"
            }`,
          },
          {
            label: values.fuelType === "electric" ? "Efficiency" : "Fuel mileage",
            value: `${formatNumber(values.fuelEfficiency, 1)} ${
              values.fuelType === "electric" ? "mi/kWh" : "mpg"
            }`,
          },
        ],
        steps: [
          values.fuelType === "electric"
            ? "The calculator estimates total energy used, then multiplies by your electricity cost per kWh."
            : "The calculator estimates total gallons consumed, then multiplies by your selected fuel price.",
          `This ${modeLabel.toLowerCase()} view uses ${formatNumber(miles, 2)} miles of driving.`,
        ],
      },
    },
    {
      label: "Oil changes",
      value: oilValue,
      color: colors.oil,
      detail: {
        title: `Oil change detail for ${modeLabel.toLowerCase()}`,
        subtitle: `How much of your oil change cycle this ${unitLabel} uses up.`,
        metrics: buildServiceMetrics({
          costValue: oilValue,
          serviceCost: values.oilChangeCost,
          serviceIntervalLabel: "Oil change interval",
          serviceIntervalValue: values.oilChangeInterval,
          unitNoun: "miles",
          modeLabel,
        }).concat([{ label: "Oil change cost", value: formatCurrency(values.oilChangeCost) }]),
        steps: [
          `Equivalent oil changes = ${formatCurrency(oilValue)} / ${formatCurrency(
            values.oilChangeCost,
          )} = ${formatNumber(
            values.oilChangeCost > 0 ? oilValue / values.oilChangeCost : 0,
            2,
          )}.`,
          `That tells you what share of one oil change, or how many full oil changes, this ${modeLabel.toLowerCase()} uses.`,
        ],
      },
    },
    {
      label: "Tires",
      value: tireValue,
      color: colors.tires,
      detail: {
        title: `Tire detail for ${modeLabel.toLowerCase()}`,
        subtitle: `How much of a tire set this ${unitLabel} uses up.`,
        metrics: buildServiceMetrics({
          costValue: tireValue,
          serviceCost: values.tireCost,
          serviceIntervalLabel: "Tire interval",
          serviceIntervalValue: values.tireInterval,
          unitNoun: "miles",
          modeLabel,
        }).concat([{ label: "Tire set cost", value: formatCurrency(values.tireCost) }]),
        steps: [
          `Equivalent tire sets = ${formatCurrency(tireValue)} / ${formatCurrency(
            values.tireCost,
          )}.`,
          "This tells you the percentage of one set used, or how many full sets would be consumed over this view.",
        ],
      },
    },
    {
      label: "Misc. maintenance",
      value: miscValue,
      color: colors.misc,
      detail: {
        title: `Misc. maintenance detail for ${modeLabel.toLowerCase()}`,
        subtitle: `How the miscellaneous maintenance allowance contributes to this ${modeLabel.toLowerCase()}.`,
        metrics: buildServiceMetrics({
          costValue: miscValue,
          serviceCost: values.miscMaintenanceCost,
          serviceIntervalLabel: "Maintenance interval",
          serviceIntervalValue: values.miscMaintenanceInterval,
          unitNoun:
            values.miscMaintenanceBasis === "miles"
              ? "miles"
              : values.miscMaintenanceBasis === "month"
                ? "months"
                : "years",
          modeLabel,
        }).concat([
          {
            label: "Maintenance event cost",
            value: formatCurrency(values.miscMaintenanceCost),
          },
          {
            label: "Basis",
            value:
              values.miscMaintenanceBasis === "miles"
                ? "Mileage-based"
                : values.miscMaintenanceBasis === "month"
                  ? "Month-based"
                  : "Year-based",
          },
        ]),
        steps: [
          `Equivalent maintenance events = ${formatCurrency(miscValue)} / ${formatCurrency(
            values.miscMaintenanceCost,
          )}.`,
          "The same allowance can be spread by miles, months, or years depending on how you track maintenance.",
        ],
      },
    },
    {
      label: vehicleValueLabel,
      value: depreciationValue,
      color: colors.depreciation,
      detail: depreciationDetail,
    },
    {
      label: "Ownership overhead",
      value: ownershipValue,
      color: colors.ownership,
      detail: {
        title: `Ownership overhead for ${modeLabel.toLowerCase()}`,
        subtitle: `Annual fixed ownership costs scaled into ${unitLabel}.`,
        metrics: [
          {
            label: `Overhead in this ${modeLabel.toLowerCase()} view`,
            value: formatCurrency(ownershipValue),
          },
          {
            label: "Annual fixed ownership total",
            value: formatCurrency(calculations.annualFixedCosts),
          },
          {
            label: "Annual miles assumed",
            value: formatNumber(calculations.annualMileage),
          },
        ],
        pieTitle: "Ownership overhead breakdown",
        pieSegments: ownershipSegments,
        steps: [
          `The calculator scales insurance, registration, parking, inspection, and roadside costs from annual totals into this ${modeLabel.toLowerCase()} view.`,
        ],
      },
    },
    {
      label: "Financing",
      value: financingValue,
      color: colors.financing,
      detail: {
        title: `Financing detail for ${modeLabel.toLowerCase()}`,
        subtitle:
          "Interest cost is calculated from the amortized loan schedule, not by multiplying APR directly across the full purchase price forever.",
        metrics: [
          {
            label: `Interest in this ${modeLabel.toLowerCase()} view`,
            value: formatCurrency(financingValue),
          },
          {
            label: "Amount financed",
            value: formatCurrency(calculations.financedAmount),
          },
          {
            label: "Down payment",
            value: formatCurrency(values.loanDownPayment),
          },
          {
            label: "Monthly payment",
            value: formatCurrency(calculations.effectiveMonthlyPayment),
          },
          {
            label: "Loan term",
            value: `${formatNumber(calculations.effectiveLoanTermMonths)} months`,
          },
          {
            label: "Total interest while owned",
            value: formatCurrency(calculations.totalInterestPaid),
          },
          {
            label: "Payments made while owned",
            value: formatCurrency(calculations.totalLoanPaymentsMade),
          },
        ],
        steps: [
          `Amount financed = purchase price (${formatCurrency(values.purchasePrice)}) - down payment (${formatCurrency(
            values.loanDownPayment,
          )}) = ${formatCurrency(calculations.financedAmount)}.`,
          values.loanPaymentMode === "months"
            ? `The loan uses ${formatNumber(values.loanApr, 2)}% APR across ${formatNumber(
                calculations.effectiveLoanTermMonths,
              )} months, which computes to about ${formatCurrency(
                calculations.effectiveMonthlyPayment,
              )} per month.`
            : `The loan is amortized month by month using ${formatNumber(
                values.loanApr,
                2,
              )}% APR and a ${formatCurrency(
                calculations.effectiveMonthlyPayment,
              )} monthly payment.`,
          "Only interest paid during the ownership window is counted here as financing cost.",
        ],
        note:
          calculations.payoffMonth !== null
            ? `At this payment level, the loan is paid off in month ${formatNumber(
                calculations.payoffMonth,
              )}.`
            : "At the current payment and APR, the loan is not fully paid off within the ownership window.",
      },
    },
  ].filter((item) => item.value > 0);
};

export const buildBreakdownModes = (
  values: CarCostValues,
  calculations: CarCostCalculations,
): CostBreakdownViewerMode[] => {
  const recurringMilesByPeriod = buildRecurringMilesByPeriod(
    calculations.annualMileage,
  );
  const recurringOwnershipByPeriod = buildRecurringOwnershipByPeriod(
    calculations.annualFixedCosts,
  );
  const recurringFinanceByPeriod = buildRecurringFinanceByPeriod(
    calculations.annualFinanceCost,
  );

  const recurringModes = (["day", "week", "month", "year"] as const).map(
    (key) => {
      const miles = recurringMilesByPeriod[key];

      return {
        key,
        label: recurringModeMeta[key].label,
        description: recurringModeMeta[key].description,
        unitLabel: recurringModeMeta[key].unitLabel,
        total: calculations.recurringTrueCosts[key],
        items: buildModeItems(
          values,
          calculations,
          recurringOwnershipByPeriod,
          recurringFinanceByPeriod,
          key,
          recurringModeMeta[key].label,
          recurringModeMeta[key].unitLabel,
          miles,
        ),
      };
    },
  );

  return [
    {
      key: "mile",
      label: "Per mile",
      description:
        "This is the baseline view of how much each category contributes to every mile driven.",
      unitLabel: "per mile",
      total: calculations.trueCostPerMile,
      items: buildModeItems(
        values,
        calculations,
        recurringOwnershipByPeriod,
        recurringFinanceByPeriod,
        "mile",
        "Per mile",
        "per mile",
        1,
      ),
    },
    {
      key: "trip",
      label: "Trip",
      description: `This allocates the selected trip distance of ${formatNumber(
        calculations.selectedTripDistance,
      )} miles across fuel, maintenance, depreciation, and ownership overhead.`,
      unitLabel: `${formatNumber(calculations.selectedTripDistance)} mi trip`,
      total: calculations.tripCost,
      items: buildModeItems(
        values,
        calculations,
        recurringOwnershipByPeriod,
        recurringFinanceByPeriod,
        "trip",
        "Trip",
        `${formatNumber(calculations.selectedTripDistance)} mi trip`,
        calculations.selectedTripDistance,
      ),
    },
    ...recurringModes,
    {
      key: "overall",
      label: recurringModeMeta.overall.label,
      description: `This estimates total cost over about ${formatNumber(
        calculations.ownershipYears,
        1,
      )} years and ${formatNumber(
        calculations.ownershipMiles,
      )} miles of ownership at ${formatNumber(
        calculations.annualMileage,
      )} miles per year driven.`,
      unitLabel: recurringModeMeta.overall.unitLabel,
      total: calculations.overallCost,
      items: buildModeItems(
        values,
        calculations,
        recurringOwnershipByPeriod,
        recurringFinanceByPeriod,
        "overall",
        recurringModeMeta.overall.label,
        recurringModeMeta.overall.unitLabel,
        calculations.ownershipMiles,
      ),
    },
  ];
};
