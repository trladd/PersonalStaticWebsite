import { CAR_COST_STATE_VERSION, defaultValues } from "../../config/constants";
import {
  buildShareableCarCostUrl,
  CAR_COST_SHARE_PARAM,
  parseSharedCarCostPayload,
} from "../share";

describe("share utils", () => {
  // IMPORTANT:
  // Shared-link decoding depends on the stable minimized-key map tested in
  // sharePayloadCodec.test.ts. If a key is ever remapped to a different token,
  // old URLs can break even if these round-trip tests still pass for new ones.
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
        isSharedSession: false,
        selectedSource: "custom",
        selectedTemplateId: "custom",
        values: defaultValues,
        tripType: "oneWay",
        tripTireSet: "allSeason",
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

  it("produces a shorter encoded payload than plain uri-encoded json", () => {
    const state = {
      version: CAR_COST_STATE_VERSION,
      isSharedSession: false,
      selectedSource: "custom" as const,
      selectedTemplateId: "custom",
      values: defaultValues,
      tripType: "oneWay" as const,
      tripTireSet: "allSeason" as const,
      updatedAt: "2026-03-16T00:00:00.000Z",
    };
    const savedCustomVehicle = {
      id: "custom" as const,
      year: 2011,
      make: "Ford",
      model: "Mustang",
      title: "2011 Ford Mustang",
      values: defaultValues,
    };

    const url = buildShareableCarCostUrl({
      currentUrl: "https://example.com/sideProjects/carCost",
      savedCustomVehicle,
      state,
    });

    const encodedPayload = new URL(url).searchParams.get(CAR_COST_SHARE_PARAM) ?? "";
    const plainJsonPayload = encodeURIComponent(
      JSON.stringify({
        version: CAR_COST_STATE_VERSION,
        state,
        savedCustomVehicle,
      }),
    );

    expect(encodedPayload.length).toBeLessThan(plainJsonPayload.length);
  });

  it("returns null for an invalid shared payload", () => {
    expect(parseSharedCarCostPayload("?carCostShare=definitely-not-valid")).toBeNull();
  });
});
