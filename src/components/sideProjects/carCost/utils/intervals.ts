import { IntervalSetting, IntervalUnit, PartialTemplateValues } from "../types";

export const createIntervalSetting = (
  type: IntervalSetting["t"],
  amount: number,
  unit: IntervalUnit,
): IntervalSetting => ({
  t: type,
  v: {
    n: amount,
    u: unit,
  },
});

export const cloneIntervalSetting = (
  interval: IntervalSetting,
): IntervalSetting => ({
  t: interval.t,
  v: {
    n: interval.v.n,
    u: interval.v.u,
  },
});

export const normalizeIntervalSetting = ({
  rawInterval,
  fallback,
  legacyBasis,
  legacyInterval,
}: {
  rawInterval?: IntervalSetting;
  fallback: IntervalSetting;
  legacyBasis?: PartialTemplateValues["miscMaintenanceBasis"];
  legacyInterval?: number;
}): IntervalSetting => {
  if (
    rawInterval &&
    (rawInterval.t === "d" || rawInterval.t === "t") &&
    rawInterval.v &&
    Number.isFinite(rawInterval.v.n) &&
    typeof rawInterval.v.u === "string"
  ) {
    return cloneIntervalSetting(rawInterval);
  }

  if (Number.isFinite(legacyInterval) && legacyInterval! > 0) {
    if (legacyBasis === "month") {
      return createIntervalSetting("t", legacyInterval!, "month");
    }

    if (legacyBasis === "year") {
      return createIntervalSetting("t", legacyInterval!, "year");
    }

    return createIntervalSetting("d", legacyInterval!, "mile");
  }

  return cloneIntervalSetting(fallback);
};

export const getIntervalSelectionValue = (interval: IntervalSetting) => {
  if (interval.t === "d") {
    return "mile";
  }

  return interval.v.u === "year" ? "year" : "month";
};

export const updateIntervalSelection = (
  interval: IntervalSetting,
  selection: "mile" | "month" | "year",
): IntervalSetting => {
  if (selection === "mile") {
    return createIntervalSetting("d", interval.v.n || 1, "mile");
  }

  return createIntervalSetting("t", interval.v.n || 1, selection);
};

export const updateIntervalValue = (
  interval: IntervalSetting,
  value: number,
): IntervalSetting => ({
  t: interval.t,
  v: {
    n: value,
    u: interval.t === "d" ? "mile" : interval.v.u,
  },
});

export const getAnnualizedIntervalCost = (
  cost: number,
  interval: IntervalSetting,
  annualMileage: number,
) => {
  const normalizedAmount = interval.v.n;
  if (!Number.isFinite(cost) || cost <= 0 || !Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return 0;
  }

  if (interval.t === "d") {
    return annualMileage > 0 ? (annualMileage / normalizedAmount) * cost : 0;
  }

  if (interval.v.u === "month") {
    return (12 / normalizedAmount) * cost;
  }

  return (1 / normalizedAmount) * cost;
};

