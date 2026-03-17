import { defaultValues } from "../../config/constants";
import { calculateCarCost } from "../calculations";
import { buildBreakdownModes } from "../breakdownModes";

describe("buildBreakdownModes", () => {
  it("includes appreciation in non-trip modes but keeps trip totals depreciation-only", () => {
    const values = {
      ...defaultValues,
      purchasePrice: 15000,
      resaleValue: 18000,
      depreciationBasis: "miles" as const,
      depreciationInterval: 60000,
    };
    const calculations = calculateCarCost(
      values,
      "year",
      "roundTrip",
      "allSeason",
    );
    const modes = buildBreakdownModes(values, calculations);

    const tripMode = modes.find((mode) => mode.key === "trip");
    const overallMode = modes.find((mode) => mode.key === "overall");

    expect(tripMode?.items.some((item) => item.label === "Appreciation")).toBe(false);
    expect(tripMode?.items.some((item) => item.label === "Depreciation")).toBe(false);
    expect(overallMode?.description).toContain("ownership");
    expect(overallMode?.unitLabel).toBe("total ownership");
  });

  it("explains age-limited tire replacement separately for primary and winter sets", () => {
    const values = {
      ...defaultValues,
      includeWinterTires: 1 as const,
      winterTireMonths: 4,
      recurringMiles: 12000,
      recurringType: "year" as const,
      tireInterval: 50000,
      tireMaxAgeYears: 6,
      winterTireInterval: 30000,
      winterTireMaxAgeYears: 6,
      depreciationBasis: "miles" as const,
      depreciationInterval: 100000,
    };
    const calculations = calculateCarCost(
      values,
      "year",
      "roundTrip",
      "allSeason",
    );
    const modes = buildBreakdownModes(values, calculations);
    const overallMode = modes.find((mode) => mode.key === "overall");
    const tireItem = overallMode?.items.find((item) => item.label === "Tires");

    expect(tireItem?.detail?.sections?.map((section) => section.title)).toEqual(
      expect.arrayContaining(["Overview", "Primary tires", "Winter tires"]),
    );
    expect(
      tireItem?.detail?.sections?.find((section) => section.title === "Primary tires")
        ?.callout?.body,
    ).toContain("more miles per year overall");
    expect(
      tireItem?.detail?.sections?.find((section) => section.title === "Winter tires")
        ?.callout?.body,
    ).toContain("similar replacement count");
  });
});
