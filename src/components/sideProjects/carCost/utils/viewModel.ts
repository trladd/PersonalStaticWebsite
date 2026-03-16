import { InsightCardData } from "../InsightsCard";
import { FUEL_TYPE_LABELS } from "../config/constants";
import { CarCostCalculations } from "./calculations";
import { formatCurrency, formatNumber } from "./formatters";
import {
  CarCostValues,
  CustomVehicle,
  InsightCategory,
  InsightDefinition,
  RecurringType,
  VehicleTemplate,
} from "../types";
import { BreakdownMode } from "../CostBreakdownViewer";

export const buildSummaryCards = (calculations: CarCostCalculations) =>
  [
    { label: "Fuel", value: calculations.fuelCostPerMile },
    { label: "Oil changes", value: calculations.oilCostPerMile },
    { label: "Tires", value: calculations.tireCostPerMile },
    { label: "Misc. maintenance", value: calculations.miscCostPerMile },
    { label: "Depreciation", value: calculations.depreciationCostPerMile },
    { label: "Ownership overhead", value: calculations.fixedCostPerMile },
    { label: "Financing", value: calculations.financeCostPerMile },
    {
      label: "True cost per mile",
      value: calculations.trueCostPerMile,
      highlight: true,
    },
  ].filter((card) => card.highlight || card.value > 0);

export const buildTemplateOptions = (
  savedCustomVehicle: CustomVehicle | null,
  typedTemplates: VehicleTemplate[],
) => [
  ...(savedCustomVehicle
    ? [{ id: "custom", title: `My vehicle: ${savedCustomVehicle.title}` }]
    : []),
  ...typedTemplates.map((template) => ({
    id: template.id,
    title: `${template.year} ${template.make} ${template.model}`,
  })),
];

export const getCurrentVehicleLabel = (
  selectedSource: "default" | "template" | "custom",
  savedCustomVehicle: CustomVehicle | null,
  typedTemplates: VehicleTemplate[],
  selectedTemplateId: string | null,
) =>
  selectedSource === "custom"
    ? (savedCustomVehicle?.title ?? "Your vehicle")
    : (() => {
        const matchingTemplate = typedTemplates.find(
          (template) => template.id === selectedTemplateId,
        );
        return matchingTemplate
          ? `${matchingTemplate.year} ${matchingTemplate.make} ${matchingTemplate.model}`
          : "Vehicle template";
      })();

export const getRecurringBreakdownMode = (recurringType: RecurringType): BreakdownMode =>
  recurringType === "weekday" ? "day" : recurringType;

export const buildFuelLabels = (values: CarCostValues) => {
  const fuelEfficiencyLabel =
    values.fuelType === "electric" ? "Efficiency (mi/kWh)" : "Fuel mileage (MPG)";
  const fuelPriceLabel =
    values.fuelType === "electric"
      ? "Electricity cost per kWh"
      : `${FUEL_TYPE_LABELS[values.fuelType]} cost per gallon`;
  const fuelPriceTooltip = `Fuel price was set from current ${FUEL_TYPE_LABELS[
    values.fuelType
  ].toLowerCase()} pricing at ${formatCurrency(values.fuelUnitPrice)} per ${
    values.fuelType === "electric" ? "kWh" : "gallon"
  }.`;

  return { fuelEfficiencyLabel, fuelPriceLabel, fuelPriceTooltip };
};

export const buildVehicleTooltips = (
  values: CarCostValues,
  calculations: CarCostCalculations,
) => ({
  depreciationIntervalTooltip:
    values.depreciationBasis === "miles"
      ? `Choose miles if you expect to get rid of the vehicle after about ${formatNumber(
          values.depreciationInterval,
        )} miles of ownership. Based on your annual miles, that implies about ${formatNumber(
          calculations.ownershipYears,
          1,
        )} years of ownership.`
      : `Choose years if you expect to keep the vehicle for about ${formatNumber(
          values.depreciationInterval,
          1,
        )} years. Based on your annual miles, that implies about ${formatNumber(
          calculations.ownershipMiles,
        )} miles of ownership.`,
  parkingTooltip:
    "Most people do not have this cost, but some do in dense urban settings. It is treated as part of annual ownership cost rather than a mileage-based expense.",
  resaleWarningTooltip:
    "Your expected resale value is higher than the purchase price, so this will be treated as appreciation instead of depreciation. Double-check this if you did not intend that. While SOME vehicles may appreciate in swings of the economy or where the vehicle is a collectible, this is rare.",
});

export const buildInsights = (
  calculations: CarCostCalculations,
  insightDefinitions: InsightDefinition[],
): InsightCardData[] =>
  insightDefinitions.map((item) => {
    const difference = calculations.trueCostPerMile - item.benchmark;
    const isAbove = difference > 0;

    return {
      ...item,
      isAbove,
      currentRate: calculations.trueCostPerMile,
      headline:
        difference === 0
          ? `Right in line with ${item.label.toLowerCase()}`
          : `${formatCurrency(Math.abs(difference))} per mile ${
              isAbove ? "above" : "below"
            } ${item.label.toLowerCase()}`,
    };
  });

export const filterModalInsights = (
  insights: InsightCardData[],
  breakdownInsightCategory: InsightCategory | null,
) =>
  breakdownInsightCategory
    ? insights.filter((insight) =>
        insight.associatedCategories.includes(breakdownInsightCategory),
      )
    : [];
