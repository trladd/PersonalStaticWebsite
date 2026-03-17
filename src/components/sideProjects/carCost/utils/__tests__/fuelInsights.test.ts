import {
  buildMainFuelEconomyWarning,
  buildTripFuelEconomyTip,
  inferFuelUsagePattern,
} from "../fuelInsights";

describe("fuelInsights", () => {
  it("infers a mixed usage pattern near combined fuel economy", () => {
    const pattern = inferFuelUsagePattern(30, {
      fuelType: "regular",
      annualFuelCost: 1800,
      city: 27,
      combined: 30,
      highway: 35,
      unitLabel: "MPG",
      purchasePrice: null,
    });

    expect(pattern?.label).toBe("Mixed");
    expect(pattern?.detail).toContain("combined rating");
  });

  it("builds a trip fuel tip for longer trips below combined efficiency", () => {
    const tip = buildTripFuelEconomyTip({
      fuelEfficiencyUsed: 24,
      tripDistance: 180,
      vehicleLookupSummary: {
        fuelType: "regular",
        annualFuelCost: 1800,
        city: 22,
        combined: 30,
        highway: 38,
        unitLabel: "MPG",
        purchasePrice: null,
      },
    });

    expect(tip).toContain("highway rating");
  });

  it("keeps showing the trip tip until fuel economy is above the midpoint between combined and highway", () => {
    const summary = {
      fuelType: "regular" as const,
      annualFuelCost: 1800,
      city: 15,
      combined: 20,
      highway: 28,
      unitLabel: "MPG" as const,
      purchasePrice: null,
    };

    expect(
      buildTripFuelEconomyTip({
        fuelEfficiencyUsed: 24,
        tripDistance: 120,
        vehicleLookupSummary: summary,
      }),
    ).toContain("highway rating");

    expect(
      buildTripFuelEconomyTip({
        fuelEfficiencyUsed: 25,
        tripDistance: 120,
        vehicleLookupSummary: summary,
      }),
    ).toBeNull();
  });

  it("does not build a trip fuel tip for short trips", () => {
    const tip = buildTripFuelEconomyTip({
      fuelEfficiencyUsed: 24,
      tripDistance: 40,
      vehicleLookupSummary: {
        fuelType: "regular",
        annualFuelCost: 1800,
        city: 22,
        combined: 30,
        highway: 38,
        unitLabel: "MPG",
        purchasePrice: null,
      },
    });

    expect(tip).toBeNull();
  });

  it("warns when entered fuel economy is outside the selected vehicle's city-highway range", () => {
    const summary = {
      fuelType: "regular" as const,
      annualFuelCost: 1800,
      city: 22,
      combined: 30,
      highway: 38,
      unitLabel: "MPG" as const,
      purchasePrice: null,
    };

    expect(
      buildMainFuelEconomyWarning({
        fuelEfficiencyUsed: 40,
        vehicleLookupSummary: summary,
      }),
    ).toContain("above the selected vehicle's highway rating");

    expect(
      buildMainFuelEconomyWarning({
        fuelEfficiencyUsed: 20,
        vehicleLookupSummary: summary,
      }),
    ).toContain("below the selected vehicle's city rating");
  });
});
