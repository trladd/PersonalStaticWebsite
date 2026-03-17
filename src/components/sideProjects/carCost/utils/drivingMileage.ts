import { DrivingMileageSetting, DrivingMileageUnit } from "../types";
import { BreakdownMode } from "../components/CostBreakdownViewer";

export const DRIVING_MILEAGE_OPTIONS: Array<{
  label: string;
  value: DrivingMileageUnit;
}> = [
  { label: "Miles per day", value: "dy" },
  { label: "Miles per week", value: "wk" },
  { label: "Miles per weekday", value: "wd" },
  { label: "Miles per weekend day", value: "we" },
  { label: "Miles per month", value: "mo" },
  { label: "Miles per year", value: "yr" },
];

const ANNUAL_FACTORS: Record<DrivingMileageUnit, number> = {
  dy: 365,
  wk: 52,
  wd: 260,
  we: 104,
  mo: 12,
  yr: 1,
};

const roundMileageValue = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const rounded = Math.round(value * 100) / 100;
  return rounded === 0 ? 0 : rounded;
};

export const getAnnualMileageFromSetting = (setting: DrivingMileageSetting) =>
  setting.n * ANNUAL_FACTORS[setting.u];

export const convertDrivingMileageUnit = (
  setting: DrivingMileageSetting,
  nextUnit: DrivingMileageUnit,
): DrivingMileageSetting => {
  const annualMileage = getAnnualMileageFromSetting(setting);
  const nextValue = annualMileage / ANNUAL_FACTORS[nextUnit];

  return {
    n: roundMileageValue(nextValue),
    u: nextUnit,
  };
};

export const normalizeDrivingMileageSetting = (
  rawSetting?: Partial<DrivingMileageSetting> | null,
  legacyMiles?: number,
  legacyUnit?: string,
): DrivingMileageSetting => {
  if (
    rawSetting &&
    typeof rawSetting.n === "number" &&
    typeof rawSetting.u === "string" &&
    rawSetting.u in ANNUAL_FACTORS
  ) {
    return {
      n: rawSetting.n,
      u: rawSetting.u as DrivingMileageUnit,
    };
  }

  if (typeof legacyMiles === "number" && typeof legacyUnit === "string") {
    const legacyMap: Record<string, DrivingMileageUnit> = {
      day: "dy",
      week: "wk",
      weekday: "wd",
      month: "mo",
      year: "yr",
    };

    if (legacyMap[legacyUnit]) {
      return {
        n: legacyMiles,
        u: legacyMap[legacyUnit],
      };
    }
  }

  return { n: 12000, u: "yr" };
};

export const getRecurringBreakdownModeFromDrivingMileage = (
  unit: DrivingMileageUnit,
): BreakdownMode => {
  switch (unit) {
    case "wk":
      return "week";
    case "mo":
      return "month";
    case "yr":
      return "year";
    case "dy":
    case "wd":
    case "we":
    default:
      return "day";
  }
};
