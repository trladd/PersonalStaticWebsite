import {
  buildAnalyticsVehicleFromCustomDraft,
  setCarCostAnalyticsPreviewHandler,
  trackCarCostEvent,
  trackCarCostSectionEngagement,
  isCarCostAnalyticsDisabled,
} from "../analytics";
import { CAR_COST_ADMIN_STORAGE_KEY } from "../../config/constants";

describe("analytics utils", () => {
  beforeEach(() => {
    window.localStorage.removeItem(CAR_COST_ADMIN_STORAGE_KEY);
    setCarCostAnalyticsPreviewHandler(null);
  });

  it("builds a vehicle payload from a valid custom draft", () => {
    expect(
      buildAnalyticsVehicleFromCustomDraft({
        year: "2018",
        make: "Subaru",
        model: "WRX",
        fuelType: "premium",
      }),
    ).toEqual({
      year: 2018,
      make: "Subaru",
      model: "WRX",
      title: "2018 Subaru WRX",
    });
  });

  it("returns null for an incomplete custom draft", () => {
    expect(
      buildAnalyticsVehicleFromCustomDraft({
        year: "",
        make: "Subaru",
        model: "",
        fuelType: "premium",
      }),
    ).toBeNull();
  });

  it("sends a GA4 event when analytics are enabled", () => {
    const gtag = jest.fn();
    window.gtag = gtag;
    window.localStorage.removeItem(CAR_COST_ADMIN_STORAGE_KEY);

    trackCarCostEvent(
      "car_cost_vehicle_selected",
      {
        vehicle_make: "Toyota",
        vehicle_model: "Camry",
        template_id: null,
      },
      false,
    );

    expect(gtag).toHaveBeenCalledWith("event", "car_cost_vehicle_selected", {
      vehicle_make: "Toyota",
      vehicle_model: "Camry",
    });
  });

  it("does not send a GA4 event when analytics are disabled", () => {
    const gtag = jest.fn();
    window.gtag = gtag;
    window.localStorage.setItem(
      CAR_COST_ADMIN_STORAGE_KEY,
      JSON.stringify({ disableAnalyticsLogging: true }),
    );

    trackCarCostEvent("car_cost_vehicle_selected", { vehicle_make: "Toyota" });

    expect(gtag).not.toHaveBeenCalled();
  });

  it("sends a preview callback when analytics are disabled", () => {
    const previewHandler = jest.fn();
    setCarCostAnalyticsPreviewHandler(previewHandler);
    window.localStorage.setItem(
      CAR_COST_ADMIN_STORAGE_KEY,
      JSON.stringify({ disableAnalyticsLogging: true }),
    );

    trackCarCostEvent(
      "car_cost_vehicle_selected",
      { vehicle_make: "Toyota", template_id: null },
    );

    expect(previewHandler).toHaveBeenCalledWith("car_cost_vehicle_selected", {
      vehicle_make: "Toyota",
    });

    setCarCostAnalyticsPreviewHandler(null);
  });

  it("lets section engagement read the disabled flag from admin storage", () => {
    const previewHandler = jest.fn();
    const gtag = jest.fn();
    window.gtag = gtag;
    setCarCostAnalyticsPreviewHandler(previewHandler);
    window.localStorage.setItem(
      CAR_COST_ADMIN_STORAGE_KEY,
      JSON.stringify({ disableAnalyticsLogging: true }),
    );

    expect(isCarCostAnalyticsDisabled()).toBe(true);
    trackCarCostSectionEngagement("startup");

    expect(gtag).not.toHaveBeenCalled();
    expect(previewHandler).toHaveBeenCalledWith("car_cost_section_engaged", {
      section_name: "startup",
    });

    setCarCostAnalyticsPreviewHandler(null);
  });
});
