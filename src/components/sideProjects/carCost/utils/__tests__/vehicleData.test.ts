import {
  findMatchingEpaModels,
  getEfficiencyInfo,
  mapEpaFuelType,
} from "../vehicleData";

describe("vehicleData helpers", () => {
  it("maps EPA fuel types into calculator fuel categories", () => {
    expect(mapEpaFuelType("Regular Gasoline")).toBe("regular");
    expect(mapEpaFuelType("Premium Gasoline")).toBe("premium");
    expect(mapEpaFuelType("Diesel")).toBe("diesel");
    expect(mapEpaFuelType("Electricity")).toBe("electric");
  });

  it("converts gas vehicle efficiency fields directly to MPG values", () => {
    const efficiency = getEfficiencyInfo(
      {
        city08: "22",
        comb08: "26",
        highway08: "33",
        fuelCost08: "1700",
      },
      "regular",
    );

    expect(efficiency).toEqual({
      city: 22,
      combined: 26,
      highway: 33,
      unitLabel: "MPG",
      annualFuelCost: 1700,
    });
  });

  it("converts EV kWh per 100 miles into miles per kWh", () => {
    const efficiency = getEfficiencyInfo(
      {
        cityE: "24.1353",
        combE: "25.4472",
        highwayE: "27.0506",
        fuelCost08: "550",
      },
      "electric",
    );

    expect(efficiency.unitLabel).toBe("mi/kWh");
    expect(efficiency.city).toBeCloseTo(4.14, 2);
    expect(efficiency.combined).toBeCloseTo(3.93, 2);
    expect(efficiency.highway).toBeCloseTo(3.70, 2);
    expect(efficiency.annualFuelCost).toBe(550);
  });

  it("matches EPA model variants against a broader selected model", () => {
    const matches = findMatchingEpaModels("Camry", [
      { label: "Camry", value: "Camry" },
      { label: "Camry AWD LE/SE", value: "Camry AWD LE/SE" },
      { label: "Camry Hybrid LE", value: "Camry Hybrid LE" },
      { label: "Corolla", value: "Corolla" },
    ]);

    expect(matches).toEqual([
      { label: "Camry", value: "Camry" },
      { label: "Camry AWD LE/SE", value: "Camry AWD LE/SE" },
      { label: "Camry Hybrid LE", value: "Camry Hybrid LE" },
    ]);
  });
});
