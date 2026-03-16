import { defaultValues } from "../../config/constants";
import {
  applyPlannerValues,
  getDraftFromVehicle,
  getPlannerValues,
  normalizeCarCostValues,
  normalizeVehicleTemplate,
  parseSavedCustomVehicle,
} from "../state";

describe("state utils", () => {
  it("gets and reapplies planner values without changing the rest", () => {
    const planner = getPlannerValues({
      ...defaultValues,
      tripDistance: 123,
      recurringMiles: 456,
    });

    expect(planner).toEqual({ tripDistance: 123, recurringMiles: 456 });

    const next = applyPlannerValues(defaultValues, planner);
    expect(next.tripDistance).toBe(123);
    expect(next.recurringMiles).toBe(456);
    expect(next.purchasePrice).toBe(defaultValues.purchasePrice);
  });

  it("normalizes template values and legacy fuel mileage", () => {
    const normalized = normalizeCarCostValues({
      fuelType: "premium",
      fuelMileage: 21,
      includeFinancing: 1,
    });

    expect(normalized.fuelType).toBe("premium");
    expect(normalized.fuelEfficiency).toBe(21);
    expect(normalized.includeFinancing).toBe(1);
    expect(normalized.loanApr).toBeGreaterThan(0);
  });

  it("normalizes a full vehicle template", () => {
    const template = normalizeVehicleTemplate({
      id: "sample",
      year: 2020,
      make: "Toyota",
      model: "Camry",
      title: "2020 Toyota Camry",
      values: {
        ...defaultValues,
        fuelType: "regular",
        fuelEfficiency: 32,
      },
    });

    expect(template.values.fuelEfficiency).toBe(32);
    expect(template.values.fuelType).toBe("regular");
    expect(template.values.oilChangeCost).toBe(defaultValues.oilChangeCost);
  });

  it("builds a draft from a custom vehicle", () => {
    const draft = getDraftFromVehicle({
      id: "custom",
      year: 2011,
      make: "Ford",
      model: "Mustang",
      title: "2011 Ford Mustang",
      values: {
        ...defaultValues,
        fuelType: "regular",
      },
    });

    expect(draft).toEqual({
      year: "2011",
      make: "Ford",
      model: "Mustang",
      fuelType: "regular",
    });
  });

  it("parses valid saved custom vehicle JSON", () => {
    const parsed = parseSavedCustomVehicle(
      JSON.stringify({
        id: "custom",
        year: 2018,
        make: "Subaru",
        model: "WRX",
        title: "2018 Subaru WRX",
        values: {
          fuelType: "premium",
          fuelEfficiency: 24,
        },
      }),
    );

    expect(parsed?.title).toBe("2018 Subaru WRX");
    expect(parsed?.values.fuelEfficiency).toBe(24);
    expect(parsed?.values.oilChangeCost).toBe(defaultValues.oilChangeCost);
  });

  it("cleans up invalid saved custom vehicle JSON", () => {
    const removeItemSpy = jest.spyOn(Storage.prototype, "removeItem");

    expect(parseSavedCustomVehicle("{bad-json")).toBeNull();
    expect(removeItemSpy).toHaveBeenCalled();

    removeItemSpy.mockRestore();
  });
});
