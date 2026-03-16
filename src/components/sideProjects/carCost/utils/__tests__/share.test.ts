import { CAR_COST_STATE_VERSION, defaultValues } from "../../config/constants";
import {
  buildShareableCarCostUrl,
  CAR_COST_SHARE_PARAM,
  parseSharedCarCostPayload,
} from "../share";

describe("share utils", () => {
  it("builds and parses a shareable payload in the query string", () => {
    const url = buildShareableCarCostUrl({
      currentUrl: "https://example.com/sideProjects/carCost",
      savedCustomVehicle: {
        id: "custom",
        year: 2011,
        make: "Ford",
        model: "Mustang",
        title: "2011 Ford Mustang",
        values: defaultValues,
      },
      state: {
        version: CAR_COST_STATE_VERSION,
        selectedSource: "custom",
        selectedTemplateId: "custom",
        values: defaultValues,
        recurringType: "year",
        tripType: "oneWay",
        updatedAt: "2026-03-16T00:00:00.000Z",
      },
    });

    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get(CAR_COST_SHARE_PARAM)).toBeTruthy();

    const parsedPayload = parseSharedCarCostPayload(parsedUrl.search);
    expect(parsedPayload?.version).toBe(CAR_COST_STATE_VERSION);
    expect(parsedPayload?.state.selectedSource).toBe("custom");
    expect(parsedPayload?.savedCustomVehicle?.title).toBe("2011 Ford Mustang");
  });

  it("returns null for an invalid shared payload", () => {
    expect(parseSharedCarCostPayload("?carCostShare=definitely-not-valid")).toBeNull();
  });
});
