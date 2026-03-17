import { defaultValues } from "../../config/constants";
import { calculateCarCost } from "../calculations";
import {
  buildFuelLabels,
  buildInsights,
  buildSummaryCards,
  buildTemplateOptions,
  buildVehicleTooltips,
  filterModalInsights,
  getCurrentVehicleLabel,
  getRecurringBreakdownMode,
} from "../viewModel";

describe("viewModel utils", () => {
  it("builds fuel labels based on fuel type", () => {
    const electric = buildFuelLabels({
      ...defaultValues,
      fuelType: "electric",
      fuelUnitPrice: 0.17,
    });
    const diesel = buildFuelLabels({
      ...defaultValues,
      fuelType: "diesel",
      fuelUnitPrice: 3.71,
    });

    expect(electric.fuelEfficiencyLabel).toContain("mi/kWh");
    expect(electric.fuelPriceLabel).toContain("kWh");
    expect(diesel.fuelPriceLabel).toContain("Diesel cost per gallon");
  });

  it("builds current vehicle labels and template options with custom vehicle first", () => {
    const customVehicle = {
      id: "custom" as const,
      year: 2011,
      make: "Ford",
      model: "Mustang",
      title: "2011 Ford Mustang",
      values: defaultValues,
    };
    const templates = [
      {
        id: "camry",
        year: 2025,
        make: "Toyota",
        model: "Camry",
        title: "2025 Toyota Camry",
        values: defaultValues,
      },
    ];

    const options = buildTemplateOptions(customVehicle, templates);

    expect(options[0].title).toContain("My vehicle");
    expect(
      getCurrentVehicleLabel("custom", customVehicle, templates, null),
    ).toBe("2011 Ford Mustang");
    expect(
      getCurrentVehicleLabel("template", customVehicle, templates, "camry"),
    ).toBe("2025 Toyota Camry");
  });

  it("maps driving mileage units to recurring breakdown views", () => {
    expect(
      getRecurringBreakdownMode({
        ...defaultValues,
        drivingMileage: { n: 20, u: "wd" },
      }),
    ).toBe("day");
    expect(
      getRecurringBreakdownMode({
        ...defaultValues,
        drivingMileage: { n: 1000, u: "mo" },
      }),
    ).toBe("month");
  });

  it("builds tooltips reflecting years vs miles ownership assumptions", () => {
    const calculations = calculateCarCost(
      {
        ...defaultValues,
        depreciationBasis: "years",
        depreciationInterval: 3,
      },
      "roundTrip",
      "allSeason",
    );

    const tooltips = buildVehicleTooltips(
      {
        ...defaultValues,
        depreciationBasis: "years",
        depreciationInterval: 3,
      },
      calculations,
    );

    expect(tooltips.depreciationIntervalTooltip).toContain("3");
    expect(tooltips.depreciationIntervalTooltip).toContain("miles of ownership");
  });

  it("builds insights and filters them by associated category", () => {
    const calculations = calculateCarCost(
      defaultValues,
      "roundTrip",
      "allSeason",
    );
    const insights = buildInsights(calculations, [
      {
        id: "irs",
        label: "IRS mileage rate",
        benchmark: 0.67,
        context: "Business reimbursement benchmark",
        tooltip: "Varies by year and intended use.",
        methodology: "IRS published reimbursement benchmark.",
        associatedCategories: ["global"],
      },
      {
        id: "rental",
        label: "Economy rental benchmark",
        benchmark: 0.26,
        context: "Trip comparison benchmark",
        tooltip: "Rental rates vary by season and market.",
        methodology: "Rental daily pricing translated into a per-mile heuristic.",
        associatedCategories: ["tripEstimate"],
      },
    ]);

    expect(buildSummaryCards(calculations).some((card) => card.highlight)).toBe(true);
    expect(insights).toHaveLength(2);
    expect(filterModalInsights(insights, "tripEstimate")).toHaveLength(1);
    expect(filterModalInsights(insights, null)).toHaveLength(0);
  });
});
