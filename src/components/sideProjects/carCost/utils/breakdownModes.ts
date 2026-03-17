import { BreakdownMode, CostBreakdownViewerMode } from "../components/CostBreakdownViewer";
import { CarCostValues, VehicleLookupSummary } from "../types";
import { BreakdownItemDetail } from "../components/BreakdownItemDetailModal";
import { CarCostCalculations } from "./calculations";
import { formatCurrency, formatNumber, isToggleEnabled } from "./formatters";
import { buildFuelDetailSections } from "./fuelInsights";

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

const getOilReplacementTrigger = (
  values: CarCostValues,
  calculations: CarCostCalculations,
) => {
  const timeLimitedMiles =
    values.oilChangeMaxMonths > 0
      ? calculations.annualMileage * (values.oilChangeMaxMonths / 12)
      : Number.POSITIVE_INFINITY;

  return timeLimitedMiles < values.oilChangeInterval ? "Time" : "Mileage";
};

const getTireReplacementTrigger = (
  treadLifeMiles: number,
  maxAgeYears: number,
  annualDrivenMiles: number,
) => {
  const ageLimitedMiles =
    maxAgeYears > 0 && annualDrivenMiles > 0
      ? annualDrivenMiles * maxAgeYears
      : Number.POSITIVE_INFINITY;

  return ageLimitedMiles < treadLifeMiles ? "Age" : "Tread";
};

const getAnnualMileageThresholdForTreadLimit = (
  treadLifeMiles: number,
  maxAgeYears: number,
  usageShare: number,
) => {
  if (treadLifeMiles <= 0 || maxAgeYears <= 0 || usageShare <= 0) {
    return null;
  }

  const threshold = treadLifeMiles / (maxAgeYears * usageShare);
  return Number.isFinite(threshold) && threshold > 0 ? threshold : null;
};

const buildAgeLimitedTireCallout = ({
  setLabel,
  trigger,
  treadLifeMiles,
  maxAgeYears,
  annualMileage,
  usageShare,
  mentionCalendarParity = false,
}: {
  setLabel: string;
  trigger: "Age" | "Tread";
  treadLifeMiles: number;
  maxAgeYears: number;
  annualMileage: number;
  usageShare: number;
  mentionCalendarParity?: boolean;
}) => {
  if (trigger !== "Age") {
    return undefined;
  }

  const threshold = getAnnualMileageThresholdForTreadLimit(
    treadLifeMiles,
    maxAgeYears,
    usageShare,
  );

  if (!threshold || threshold <= annualMileage) {
    return undefined;
  }

  const additionalMileage = threshold - annualMileage;
  const shareNote =
    usageShare > 0 && usageShare < 1
      ? ` At your current seasonal split, that assumes about ${formatNumber(
          threshold * usageShare,
        )} miles per year on this set.`
      : "";
  const calendarNote = mentionCalendarParity
    ? " Because the limit is calendar age, this set can show a similar replacement count to your primary tires even though it sees fewer miles."
    : "";

  return {
    title: `${setLabel} are aging out first`,
    body: `You could drive about ${formatNumber(
      additionalMileage,
    )} more miles per year overall before tread would overtake age as the replacement limit for this set.${shareNote}${calendarNote}`,
    tone: "success" as const,
  };
};

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
  vehicleLookupSummary: VehicleLookupSummary | null | undefined,
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
      : modeKey === "trip"
        ? calculations.tripTireCostPerMile * miles
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
        ? 0
        : modeKey === "mile"
          ? calculations.fixedCostPerMile
          : recurringOwnershipByPeriod[modeKey as "day" | "week" | "month" | "year"];
  const financingValue =
    modeKey === "overall"
      ? calculations.overallItems.financing
      : modeKey === "trip"
        ? 0
        : modeKey === "mile"
          ? calculations.financeCostPerMile
          : recurringFinanceByPeriod[modeKey as "day" | "week" | "month" | "year"];

  const ownershipFactor = getOwnershipFactor(calculations, modeKey, miles);
  const ownershipSegments = buildOwnershipSegments(values, ownershipFactor);
  const winterUsageShare = isToggleEnabled(values.includeWinterTires)
    ? Math.min(Math.max(values.winterTireMonths, 1), 11) / 12
    : 0;
  const primaryUsageShare = Math.max(0, 1 - winterUsageShare);
  const primaryAnnualSetMiles = calculations.annualMileage * primaryUsageShare;
  const winterAnnualSetMiles = calculations.annualMileage * winterUsageShare;
  const primaryTireTrigger = getTireReplacementTrigger(
    values.tireInterval,
    values.tireMaxAgeYears,
    primaryAnnualSetMiles,
  );
  const winterTireTrigger = getTireReplacementTrigger(
    values.winterTireInterval,
    values.winterTireMaxAgeYears,
    winterAnnualSetMiles,
  );

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
        sections: buildFuelDetailSections({
          fuelValue,
          modeLabel,
          miles,
          fuelUnitPrice: values.fuelUnitPrice,
          fuelEfficiencyUsed:
            modeKey === "trip"
              ? calculations.tripFuelEfficiencyUsed
              : values.fuelEfficiency,
          vehicleLookupSummary,
          isTripOverrideActive:
            modeKey === "trip" && isToggleEnabled(values.includeTripFuelOverride),
        }),
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
          serviceIntervalLabel: "Effective oil interval",
          serviceIntervalValue: calculations.oilEffectiveIntervalMiles,
          unitNoun: "miles",
          modeLabel,
        }).concat([
          { label: "Oil change cost", value: formatCurrency(values.oilChangeCost) },
          {
            label: "Mileage-based interval",
            value: `${formatNumber(values.oilChangeInterval)} miles`,
          },
          {
            label: "Max time",
            value: `${formatNumber(values.oilChangeMaxMonths)} months`,
          },
          {
            label: "Replacement trigger",
            value: getOilReplacementTrigger(values, calculations),
          },
          {
            label: "Oil changes over ownership",
            value: formatNumber(calculations.oilChangesUsedOverOwnership, 2),
          },
          {
            label: "Oil life remaining at sale",
            value: `${formatNumber(calculations.oilRemainingLifePercentAtSale, 1)}%`,
          },
        ]),
        steps: [
          `Equivalent oil changes = ${formatCurrency(oilValue)} / ${formatCurrency(
            values.oilChangeCost,
          )} = ${formatNumber(
            values.oilChangeCost > 0 ? oilValue / values.oilChangeCost : 0,
            2,
          )}.`,
          `The calculator uses whichever comes first: ${formatNumber(
            values.oilChangeInterval,
          )} miles or about ${formatNumber(values.oilChangeMaxMonths)} months, which works out to roughly ${formatNumber(
            calculations.oilEffectiveIntervalMiles,
          )} miles at your current annual driving pace.`,
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
        subtitle:
          "Shows which tire set is limiting cost, whether age or tread is causing replacement, and how much usable life remains at sale.",
        sections: [
          {
            title: "Overview",
            eyebrow: "At a glance",
            fullWidth: true,
            rows: [
              {
                label: `Cost in this ${modeLabel.toLowerCase()} view`,
                value: formatCurrency(tireValue),
              },
              {
                label: "Primary tire usage",
                value: `${formatNumber(primaryAnnualSetMiles)} miles / year`,
                hint: isToggleEnabled(values.includeWinterTires)
                  ? `${formatNumber(primaryUsageShare * 100, 1)}% of your annual driving is assigned to the primary set.`
                  : "All annual miles are assigned to the primary set.",
              },
              ...(isToggleEnabled(values.includeWinterTires)
                ? [
                    {
                      label: "Winter tire usage",
                      value: `${formatNumber(winterAnnualSetMiles)} miles / year`,
                      hint: `${formatNumber(values.winterTireMonths)} months of winter usage assigns ${formatNumber(
                        winterUsageShare * 100,
                        1,
                      )}% of yearly driving to the winter set.`,
                    },
                  ]
                : []),
            ],
          },
          {
            title: "Primary tires",
            eyebrow: "All-season or summer set",
            rows: [
              {
                label: "Replacement trigger",
                value: primaryTireTrigger,
                hint:
                  primaryTireTrigger === "Age"
                    ? "Calendar age will force replacement before the tread is fully consumed."
                    : "Tread wear will consume this set before age does.",
              },
              {
                label: "Effective life",
                value: `${formatNumber(calculations.primaryTireEffectiveMiles)} miles`,
                hint: `Compared against ${formatNumber(values.tireInterval)} miles of tread life and a ${formatNumber(
                  values.tireMaxAgeYears,
                )}-year age cap.`,
              },
              {
                label: "Sets used over ownership",
                value: formatNumber(calculations.primaryTireSetsUsedOverOwnership, 2),
              },
              {
                label: "Remaining tread at sale",
                value: `${formatNumber(
                  calculations.primaryTireRemainingTreadPercentAtSale,
                  1,
                )}%`,
              },
            ],
            callout: buildAgeLimitedTireCallout({
              setLabel: "Primary tires",
              trigger: primaryTireTrigger,
              treadLifeMiles: values.tireInterval,
              maxAgeYears: values.tireMaxAgeYears,
              annualMileage: calculations.annualMileage,
              usageShare: primaryUsageShare,
            }),
          },
          ...(isToggleEnabled(values.includeWinterTires)
            ? [
                {
                  title: "Winter tires",
                  eyebrow: "Seasonal set",
                  rows: [
                    {
                      label: "Replacement trigger",
                      value: winterTireTrigger,
                      hint:
                        winterTireTrigger === "Age"
                          ? "Calendar age is forcing winter-tire replacement before the tread is worn out."
                          : "Winter tread wear will consume this set before age does.",
                    },
                    {
                      label: "Effective life",
                      value: `${formatNumber(calculations.winterTireEffectiveMiles)} miles`,
                      hint: `Compared against ${formatNumber(
                        values.winterTireInterval,
                      )} miles of winter tread life and a ${formatNumber(
                        values.winterTireMaxAgeYears,
                      )}-year age cap.`,
                    },
                    {
                      label: "Sets used over ownership",
                      value: formatNumber(
                        calculations.winterTireSetsUsedOverOwnership,
                        2,
                      ),
                    },
                    {
                      label: "Remaining tread at sale",
                      value: `${formatNumber(
                        calculations.winterTireRemainingTreadPercentAtSale,
                        1,
                      )}%`,
                    },
                  ],
                  callout: buildAgeLimitedTireCallout({
                    setLabel: "Winter tires",
                    trigger: winterTireTrigger,
                    treadLifeMiles: values.winterTireInterval,
                    maxAgeYears: values.winterTireMaxAgeYears,
                    annualMileage: calculations.annualMileage,
                    usageShare: winterUsageShare,
                    mentionCalendarParity:
                      primaryTireTrigger === "Age" && winterTireTrigger === "Age",
                  }),
                },
              ]
            : []),
        ],
        steps: [
          "Each tire set is replaced by whichever comes first: tread wear or maximum age.",
          isToggleEnabled(values.includeWinterTires)
            ? "Recurring and ownership views split mileage between the primary and winter sets using your winter-month setting, then evaluate each set on its own tread life and max age."
            : "This shows how many primary tire sets you are likely to consume over ownership and how much tread is likely to remain when you sell.",
        ],
      },
    },
    {
      label: "Additional maintenance",
      value: miscValue,
      color: colors.misc,
      detail: {
        title: `Additional maintenance detail for ${modeLabel.toLowerCase()}`,
        subtitle:
          "Breaks long-term upkeep into routine additional maintenance and any advanced categories you turned on.",
        sections: [
          {
            title: "Additional maintenance",
            eyebrow: "Base upkeep",
            rows: [
              {
                label: "Cost in this view",
                value: formatCurrency(miscValue),
              },
              {
                label: "Maintenance event cost",
                value: formatCurrency(values.miscMaintenanceCost),
              },
              {
                label: "Cadence",
                value: `${formatNumber(values.miscMaintenanceSchedule.v.n)} ${
                  values.miscMaintenanceSchedule.t === "d"
                    ? "miles"
                    : values.miscMaintenanceSchedule.v.u === "month"
                      ? "months"
                      : "years"
                }`,
              },
              {
                label: "Annualized base upkeep",
                value: formatCurrency(calculations.miscAnnualCost),
              },
            ],
          },
          ...(isToggleEnabled(values.showAdvancedMaintenance)
            ? [
                {
                  title: "Advanced maintenance",
                  eyebrow: "Longer-cycle service",
                  fullWidth: true,
                  rows: [
                    {
                      label: "Brakes annualized",
                      value: formatCurrency(calculations.brakeAnnualCost),
                      hint:
                        "Brake service can include pads, rotors, hardware, wear sensors, and sometimes brake fluid.",
                    },
                    {
                      label: "Battery annualized",
                      value: formatCurrency(calculations.batteryAnnualCost),
                    },
                    {
                      label: "Major service annualized",
                      value: formatCurrency(calculations.majorServiceAnnualCost),
                      hint:
                        "Major service is a good place for transmission fluid, differential fluid, coolant, brake fluid, spark plugs, or other milestone maintenance.",
                    },
                    {
                      label: "Repair buffer annualized",
                      value: formatCurrency(calculations.repairBufferAnnualCost),
                      hint:
                        "This reserve helps represent irregular repair items like sensors, AC work, bearings, leaks, and suspension parts.",
                    },
                  ],
                },
              ]
            : []),
        ],
        pieTitle: "Maintenance category mix",
        pieSegments: [
          { label: "Additional maintenance", value: calculations.miscAnnualCost, color: colors.misc },
          { label: "Brakes", value: calculations.brakeAnnualCost, color: "#c98b4a" },
          { label: "Battery", value: calculations.batteryAnnualCost, color: "#d7a76b" },
          { label: "Major service", value: calculations.majorServiceAnnualCost, color: "#8f633c" },
          { label: "Repair buffer", value: calculations.repairBufferAnnualCost, color: "#b56f53" },
        ].filter((segment) => segment.value > 0),
        steps: [
          "Additional maintenance is for recurring upkeep that does not belong in oil or tires, such as filters, small fluids, alignments, and similar routine items.",
          isToggleEnabled(values.showAdvancedMaintenance)
            ? "Advanced maintenance adds brakes, battery replacements, major milestone services, and a repair reserve so longer-cycle work is represented instead of surprising you later."
            : "Turn on advanced maintenance to also include brakes, battery, major service, and a repair buffer here.",
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
  vehicleLookupSummary?: VehicleLookupSummary | null,
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
        vehicleLookupSummary,
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
        vehicleLookupSummary,
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
      )} miles across fuel, maintenance, tire wear, and depreciation.`,
      unitLabel: `${formatNumber(calculations.selectedTripDistance)} mi trip`,
      total: calculations.tripCost,
      items: buildModeItems(
        values,
        calculations,
        vehicleLookupSummary,
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
        vehicleLookupSummary,
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
