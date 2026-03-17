import { CAR_COST_STATE_VERSION, defaultValues } from "../../config/constants";
import {
  applySessionScopedValues,
  getDraftFromVehicle,
  getSessionScopedValues,
  migratePersistedCarCostState,
  normalizeCarCostValues,
  normalizeVehicleTemplate,
  parseCarCostAdminState,
  parseSavedCustomVehicle,
  stripSessionScopedValues,
} from "../state";

describe("state utils", () => {
  it("gets and reapplies session-scoped values without changing the rest", () => {
    const sessionValues = getSessionScopedValues({
      ...defaultValues,
      tripDistance: 123,
      drivingMileage: { n: 456, u: "yr" as const },
      includeVehicleCost: 0,
    });

    expect(sessionValues).toEqual({
      tripDistance: 123,
      includeTripFuelOverride: defaultValues.includeTripFuelOverride,
      tripFuelEfficiency: defaultValues.tripFuelEfficiency,
      drivingMileage: { n: 456, u: "yr" },
      includeVehicleCost: 0,
      includeAnnualOwnership: defaultValues.includeAnnualOwnership,
    });

    const next = applySessionScopedValues(defaultValues, sessionValues);
    expect(next.tripDistance).toBe(123);
    expect(next.includeTripFuelOverride).toBe(defaultValues.includeTripFuelOverride);
    expect(next.drivingMileage).toEqual({ n: 456, u: "yr" });
    expect(next.annualInsurance).toBe(defaultValues.annualInsurance);
    expect(next.includeVehicleCost).toBe(0);
    expect(next.purchasePrice).toBe(defaultValues.purchasePrice);
  });

  it("strips session-scoped values from template-like payloads", () => {
    const stripped = stripSessionScopedValues({
      tripDistance: 90,
      includeTripFuelOverride: 1,
      tripFuelEfficiency: 29,
      drivingMileage: { n: 12, u: "yr" as const },
      includeVehicleCost: 0,
      includeAnnualOwnership: 0,
      annualInsurance: 999,
      purchasePrice: 22000,
    });

    expect(stripped).toEqual({
      annualInsurance: 999,
      purchasePrice: 22000,
    });
  });

  it("normalizes template values and legacy fuel mileage", () => {
    const normalized = normalizeCarCostValues({
      fuelType: "premium",
      fuelMileage: 21,
      includeFinancing: 1,
    });

    expect(normalized.fuelType).toBe("premium");
    expect(normalized.fuelEfficiency).toBe(21);
    expect(normalized.includeVehicleCost).toBe(1);
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
        annualInsurance: 999,
        includeVehicleCost: 0,
      },
    });

    expect(template.values.fuelEfficiency).toBe(32);
    expect(template.values.fuelType).toBe("regular");
    expect(template.values.oilChangeCost).toBe(defaultValues.oilChangeCost);
    expect(template.values.annualInsurance).toBe(999);
    expect(template.values.includeVehicleCost).toBe(defaultValues.includeVehicleCost);
  });

  it("builds a draft from a custom vehicle", () => {
    const draft = getDraftFromVehicle({
      id: "custom",
      year: 2011,
      make: "Ford",
      model: "Mustang",
      trimSelectionValue: "Mustang::12345",
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
      trim: "Mustang::12345",
      fuelType: "regular",
      vehicleClassBucket: "",
      manualVehicleEntry: false,
    });
  });

  it("falls back to legacy trim tokens when no dedicated selection value exists", () => {
    const draft = getDraftFromVehicle({
      id: "custom",
      year: 2018,
      make: "Toyota",
      model: "Camry",
      trim: "Camry Hybrid LE::47243",
      title: "2018 Toyota Camry",
      values: {
        ...defaultValues,
        fuelType: "regular",
      },
    });

    expect(draft.trim).toBe("Camry Hybrid LE::47243");
  });

  it("preserves manual trim text for manual vehicle entries", () => {
    const draft = getDraftFromVehicle({
      id: "custom",
      year: 2024,
      make: "Ford",
      model: "F-550",
      trim: "6.7L Power Stroke / XL",
      title: "2024 Ford F-550",
      manualVehicleEntry: true,
      values: {
        ...defaultValues,
        fuelType: "diesel",
      },
    });

    expect(draft.trim).toBe("6.7L Power Stroke / XL");
    expect(draft.manualVehicleEntry).toBe(true);
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
          annualInsurance: 1,
        },
      }),
    );

    expect(parsed?.title).toBe("2018 Subaru WRX");
    expect(parsed?.values.fuelEfficiency).toBe(24);
    expect(parsed?.values.oilChangeCost).toBe(defaultValues.oilChangeCost);
    expect(parsed?.values.annualInsurance).toBe(1);
  });

  it("cleans up invalid saved custom vehicle JSON", () => {
    const removeItemSpy = jest.spyOn(Storage.prototype, "removeItem");

    expect(parseSavedCustomVehicle("{bad-json")).toBeNull();
    expect(removeItemSpy).toHaveBeenCalled();

    removeItemSpy.mockRestore();
  });

  it("resets legacy persisted state on breaking version changes with a notice", () => {
    const result = migratePersistedCarCostState(
      JSON.stringify({
        selectedSource: "template",
        selectedTemplateId: "camry",
        values: {
          fuelType: "regular",
          fuelEfficiency: 33,
        },
        tripType: "roundTrip",
        updatedAt: "2026-03-15T00:00:00.000Z",
      }),
    );

    expect(result.migratedState?.version).toBe(CAR_COST_STATE_VERSION);
    expect(result.migratedState?.selectedTemplateId).toBeNull();
    expect(result.migratedState?.values.fuelEfficiency).toBe(
      defaultValues.fuelEfficiency,
    );
    expect(result.startupNotice).toContain("breaking calculator changes");
    expect(result.discardSavedCustomVehicle).toBe(true);
  });

  it("resets future incompatible versions to defaults", () => {
    const result = migratePersistedCarCostState(
      JSON.stringify({
        version: 999,
        selectedSource: "template",
        selectedTemplateId: "future-car",
        values: {
          tripDistance: 321,
          drivingMileage: { n: 222, u: "yr" as const },
          annualInsurance: 1900,
          includeVehicleCost: 0,
          purchasePrice: 99999,
        },
        tripType: "roundTrip",
        updatedAt: "2026-03-15T00:00:00.000Z",
      }),
    );

    expect(result.migratedState?.version).toBe(CAR_COST_STATE_VERSION);
    expect(result.migratedState?.selectedSource).toBe("default");
    expect(result.migratedState?.values.tripDistance).toBe(
      defaultValues.tripDistance,
    );
    expect(result.migratedState?.values.annualInsurance).toBe(
      defaultValues.annualInsurance,
    );
    expect(result.migratedState?.values.purchasePrice).toBe(defaultValues.purchasePrice);
    expect(result.startupNotice).toContain("could not safely migrate");
    expect(result.discardSavedCustomVehicle).toBe(true);
  });

  it("parses admin analytics state from its dedicated storage object", () => {
    expect(
      parseCarCostAdminState(
        JSON.stringify({ disableAnalyticsLogging: true }),
        null,
      ),
    ).toEqual({ disableAnalyticsLogging: true });
  });

  it("falls back to a legacy embedded analytics flag if needed", () => {
    expect(
      parseCarCostAdminState(
        null,
        JSON.stringify({ disableAnalyticsLogging: true }),
      ),
    ).toEqual({ disableAnalyticsLogging: true });
  });
});
