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
    const calculations = calculateCarCost(values, "year", "roundTrip");
    const modes = buildBreakdownModes(values, calculations);

    const tripMode = modes.find((mode) => mode.key === "trip");
    const overallMode = modes.find((mode) => mode.key === "overall");

    expect(tripMode?.items.some((item) => item.label === "Appreciation")).toBe(false);
    expect(tripMode?.items.some((item) => item.label === "Depreciation")).toBe(false);
    expect(overallMode?.description).toContain("ownership");
    expect(overallMode?.unitLabel).toBe("total ownership");
  });
});
