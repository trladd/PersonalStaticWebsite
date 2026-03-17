import { VehicleLookupSummary } from "../types";
import { formatCurrency, formatNumber } from "./formatters";

export type FuelUsagePattern = {
  label: "Mostly city" | "Mixed" | "Some highway" | "Mostly highway";
  detail: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const inferFuelUsagePattern = (
  fuelEfficiencyUsed: number,
  vehicleLookupSummary?: VehicleLookupSummary | null,
): FuelUsagePattern | null => {
  if (
    !vehicleLookupSummary ||
    vehicleLookupSummary.city === null ||
    vehicleLookupSummary.highway === null ||
    vehicleLookupSummary.combined === null
  ) {
    return null;
  }

  const { city, combined, highway, unitLabel } = vehicleLookupSummary;
  const span = highway - city;

  if (span <= 0) {
    return null;
  }

  const ratio = clamp((fuelEfficiencyUsed - city) / span, 0, 1);

  if (ratio >= 0.78) {
    return {
      label: "Mostly highway",
      detail: `The ${formatNumber(
        fuelEfficiencyUsed,
        1,
      )} ${unitLabel} you are using sits much closer to the highway rating than the combined rating.`,
    };
  }

  if (ratio >= 0.55) {
    return {
      label: "Some highway",
      detail: `The ${formatNumber(
        fuelEfficiencyUsed,
        1,
      )} ${unitLabel} assumption is a bit better than the combined rating, so it looks like some highway-biased driving.`,
    };
  }

  if (ratio >= 0.28) {
    return {
      label: "Mixed",
      detail: `The ${formatNumber(
        fuelEfficiencyUsed,
        1,
      )} ${unitLabel} assumption sits near the combined rating of ${formatNumber(
        combined,
        1,
      )}, which suggests mixed driving.`,
    };
  }

  return {
    label: "Mostly city",
    detail: `The ${formatNumber(
      fuelEfficiencyUsed,
      1,
    )} ${unitLabel} assumption is much closer to the city rating, so it looks more city-heavy than mixed driving.`,
  };
};

export const buildTripFuelEconomyTip = ({
  fuelEfficiencyUsed,
  tripDistance,
  vehicleLookupSummary,
}: {
  fuelEfficiencyUsed: number;
  tripDistance: number;
  vehicleLookupSummary?: VehicleLookupSummary | null;
}) => {
  if (
    tripDistance <= 50 ||
    !vehicleLookupSummary ||
    vehicleLookupSummary.combined === null ||
    vehicleLookupSummary.highway === null
  ) {
    return null;
  }

  const cautionThreshold =
    vehicleLookupSummary.combined +
    (vehicleLookupSummary.highway - vehicleLookupSummary.combined) / 2;

  if (fuelEfficiencyUsed > cautionThreshold) {
    return null;
  }

  return `This trip is long enough that it may include more sustained driving than your usual pattern. If the route is highway-heavy, you may want to try a trip fuel economy closer to the highway rating of ${formatNumber(
    vehicleLookupSummary.highway,
    1,
  )} ${vehicleLookupSummary.unitLabel}.`;
};

export const buildMainFuelEconomyWarning = ({
  fuelEfficiencyUsed,
  vehicleLookupSummary,
}: {
  fuelEfficiencyUsed: number;
  vehicleLookupSummary?: VehicleLookupSummary | null;
}) => {
  if (
    !vehicleLookupSummary ||
    vehicleLookupSummary.city === null ||
    vehicleLookupSummary.highway === null
  ) {
    return null;
  }

  if (fuelEfficiencyUsed > vehicleLookupSummary.highway) {
    return `This is above the selected vehicle's highway rating of ${formatNumber(
      vehicleLookupSummary.highway,
      1,
    )} ${vehicleLookupSummary.unitLabel}. That can happen with driving habits, light-load steady cruising, or modifications, but it is worth double-checking.`;
  }

  if (fuelEfficiencyUsed < vehicleLookupSummary.city) {
    return `This is below the selected vehicle's city rating of ${formatNumber(
      vehicleLookupSummary.city,
      1,
    )} ${vehicleLookupSummary.unitLabel}. That can happen with heavy idle time, towing, short trips, or modifications, but it is worth double-checking.`;
  }

  return null;
};

export const buildFuelDetailSections = ({
  fuelValue,
  modeLabel,
  miles,
  fuelUnitPrice,
  fuelEfficiencyUsed,
  vehicleLookupSummary,
  isTripOverrideActive,
}: {
  fuelValue: number;
  modeLabel: string;
  miles: number;
  fuelUnitPrice: number;
  fuelEfficiencyUsed: number;
  vehicleLookupSummary?: VehicleLookupSummary | null;
  isTripOverrideActive?: boolean;
}) => {
  const usagePattern = inferFuelUsagePattern(
    fuelEfficiencyUsed,
    vehicleLookupSummary,
  );
  const fuelUsed =
    fuelUnitPrice > 0 ? fuelValue / fuelUnitPrice : 0;
  const unitNoun =
    vehicleLookupSummary?.unitLabel === "mi/kWh" ? "kWh" : "gallons";
  const economyUnit = vehicleLookupSummary?.unitLabel ?? "MPG";

  return [
    {
      title: "Fuel use",
      eyebrow: "This view",
      rows: [
        {
          label: `Cost in this ${modeLabel.toLowerCase()} view`,
          value: formatCurrency(fuelValue),
        },
        {
          label: `Estimated ${unitNoun} used`,
          value: formatNumber(fuelUsed, 2),
        },
        {
          label: "Fuel price used",
          value: `${formatCurrency(fuelUnitPrice)} per ${
            unitNoun === "kWh" ? "kWh" : "gallon"
          }`,
        },
        {
          label: "Fuel economy used",
          value: `${formatNumber(fuelEfficiencyUsed, 1)} ${economyUnit}`,
          hint: isTripOverrideActive
            ? "This view is using your trip-specific fuel economy override instead of the normal vehicle setting."
            : `Applied across ${formatNumber(miles, 2)} miles in this view.`,
        },
      ],
    },
    ...(vehicleLookupSummary
      ? [
          {
            title: "Vehicle fuel data",
            eyebrow: "Lookup details",
            rows: [
              {
                label: "City rating",
                value:
                  vehicleLookupSummary.city !== null
                    ? `${formatNumber(vehicleLookupSummary.city, 1)} ${vehicleLookupSummary.unitLabel}`
                    : "Unavailable",
              },
              {
                label: "Combined rating",
                value:
                  vehicleLookupSummary.combined !== null
                    ? `${formatNumber(vehicleLookupSummary.combined, 1)} ${vehicleLookupSummary.unitLabel}`
                    : "Unavailable",
              },
              {
                label: "Highway rating",
                value:
                  vehicleLookupSummary.highway !== null
                    ? `${formatNumber(vehicleLookupSummary.highway, 1)} ${vehicleLookupSummary.unitLabel}`
                    : "Unavailable",
              },
              {
                label: "EPA annual fuel cost",
                value:
                  vehicleLookupSummary.annualFuelCost !== null
                    ? formatCurrency(vehicleLookupSummary.annualFuelCost)
                    : "Unavailable",
              },
            ],
          },
          ...(usagePattern
            ? [
                {
                  title: "Usage pattern",
                  eyebrow: "Inferred from your MPG choice",
                  rows: [
                    {
                      label: "Assumed pattern",
                      value: usagePattern.label,
                      hint: usagePattern.detail,
                    },
                  ],
                  fullWidth: true,
                },
              ]
            : []),
        ]
      : []),
  ];
};
