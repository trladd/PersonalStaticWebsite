import { CAR_COST_STATE_VERSION, defaultValues } from "../../config/constants";
import {
  compressSharePayload,
  decompressSharePayload,
  expandSharePayloadKeys,
  getStableShareKeyToken,
  minifySharePayloadKeys,
} from "../sharePayloadCodec";

const regressionFixturePayload = {
  version: 1,
  state: {
    version: 1,
    isSharedSession: false,
    disableAnalyticsLogging: false,
    selectedSource: "custom",
    selectedTemplateId: "custom",
    values: {
      fuelType: "regular",
      fuelEfficiency: 25,
      fuelUnitPrice: 2.92,
      oilChangeCost: 75,
      oilChangeInterval: 7500,
      tireCost: 900,
      tireInterval: 50000,
      miscMaintenanceCost: 600,
      miscMaintenanceBasis: "miles",
      miscMaintenanceInterval: 15000,
      depreciationBasis: "miles",
      purchasePrice: 32000,
      resaleValue: 18000,
      depreciationInterval: 100000,
      tripDistance: 250,
      recurringMiles: 12000,
      annualInsurance: 2100,
      annualRegistration: 175,
      annualParking: 0,
      annualInspection: 0,
      annualRoadside: 100,
      loanDownPayment: 4000,
      loanApr: 6.56,
      loanTermMonths: 72,
      loanMonthlyPayment: 748,
      loanPaymentMode: "months",
      includeVehicleCost: 1,
      includeDepreciation: 1,
      includeAnnualOwnership: 1,
      includeFinancing: 0,
    },
    recurringType: "year",
    tripType: "oneWay",
    tripTireSet: "allSeason",
    updatedAt: "2026-03-17T00:43:03.657Z",
  },
  savedCustomVehicle: {
    id: "custom",
    year: 2020,
    make: "a",
    model: "sdf",
    title: "2020 a sdf",
    values: {
      fuelType: "regular",
      fuelEfficiency: 25,
      fuelUnitPrice: 2.92,
      oilChangeCost: 75,
      oilChangeInterval: 7500,
      tireCost: 900,
      tireInterval: 50000,
      miscMaintenanceCost: 600,
      miscMaintenanceBasis: "miles",
      miscMaintenanceInterval: 15000,
      depreciationBasis: "miles",
      purchasePrice: 32000,
      resaleValue: 18000,
      depreciationInterval: 100000,
      tripDistance: 250,
      recurringMiles: 12000,
      annualInsurance: 2100,
      annualRegistration: 175,
      annualParking: 0,
      annualInspection: 0,
      annualRoadside: 100,
      loanDownPayment: 4000,
      loanApr: 6.56,
      loanTermMonths: 72,
      loanMonthlyPayment: 748,
      loanPaymentMode: "months",
      includeVehicleCost: 1,
      includeDepreciation: 1,
      includeAnnualOwnership: 1,
      includeFinancing: 0,
    },
  },
};

describe("sharePayloadCodec", () => {
  // IMPORTANT:
  // These assertions intentionally lock down a few representative key-to-token
  // assignments. Once a key gets a minimized token in shared URLs, that mapping
  // must remain stable forever so previously shared links continue to decode.
  it("keeps stable minimized tokens for share payload keys", () => {
    expect(getStableShareKeyToken("version")).toBe("a");
    expect(getStableShareKeyToken("state")).toBe("b");
    expect(getStableShareKeyToken("savedCustomVehicle")).toBe("c");
    expect(getStableShareKeyToken("fuelType")).toBe("p");
    expect(getStableShareKeyToken("includeFinancing")).toBe("S");
  });

  it("minifies and expands nested payload keys without losing values", () => {
    const payload = {
      version: CAR_COST_STATE_VERSION,
      state: {
        isSharedSession: true,
        selectedSource: "custom",
        selectedTemplateId: "custom",
        values: defaultValues,
        recurringType: "year",
        tripType: "oneWay",
        tripTireSet: "allSeason",
        updatedAt: "2026-03-16T00:00:00.000Z",
      },
      savedCustomVehicle: {
        id: "custom",
        year: 2011,
        make: "Ford",
        model: "Mustang",
        title: "2011 Ford Mustang",
        values: defaultValues,
      },
    };

    const minified = minifySharePayloadKeys(payload) as Record<string, unknown>;
    expect(minified.a).toBe(CAR_COST_STATE_VERSION);
    expect(minified.b).toBeTruthy();
    expect(minified.c).toBeTruthy();

    expect(expandSharePayloadKeys(minified)).toEqual(payload);
  });

  it("leaves unknown keys untouched while still round-tripping known ones", () => {
    const payload = {
      version: CAR_COST_STATE_VERSION,
      customFutureField: "keep-me",
      state: {
        values: {
          fuelType: "regular",
        },
      },
    };

    const minified = minifySharePayloadKeys(payload) as Record<string, unknown>;
    expect(minified.customFutureField).toBe("keep-me");

    expect(expandSharePayloadKeys(minified)).toEqual(payload);
  });

  it("keeps the full minimized payload stable for a known regression fixture", () => {
    // IMPORTANT:
    // This exact minimized JSON is a regression fixture for the public share
    // format. Once a field receives a shortened token, that token must stay
    // stable forever so previously shared URLs keep decoding correctly.
    const expectedMinifiedJson =
      '{"a":1,"b":{"a":1,"d":false,"disableAnalyticsLogging":false,"e":"custom","f":"custom","g":{"p":"regular","q":25,"r":2.92,"s":75,"t":7500,"u":900,"v":50000,"w":600,"x":"miles","y":15000,"z":"miles","A":32000,"B":18000,"C":100000,"D":250,"E":12000,"F":2100,"G":175,"H":0,"I":0,"J":100,"K":4000,"L":6.56,"M":72,"N":748,"O":"months","P":1,"Q":1,"R":1,"S":0},"h":"year","i":"oneWay","U":"allSeason","j":"2026-03-17T00:43:03.657Z"},"c":{"k":"custom","l":2020,"m":"a","n":"sdf","o":"2020 a sdf","g":{"p":"regular","q":25,"r":2.92,"s":75,"t":7500,"u":900,"v":50000,"w":600,"x":"miles","y":15000,"z":"miles","A":32000,"B":18000,"C":100000,"D":250,"E":12000,"F":2100,"G":175,"H":0,"I":0,"J":100,"K":4000,"L":6.56,"M":72,"N":748,"O":"months","P":1,"Q":1,"R":1,"S":0}}}';

    expect(JSON.stringify(minifySharePayloadKeys(regressionFixturePayload))).toBe(
      expectedMinifiedJson,
    );
  });

  it("round-trips the regression fixture through compress and decompress", () => {
    const compressed = compressSharePayload(regressionFixturePayload);

    expect(compressed.length).toBeGreaterThan(0);
    expect(decompressSharePayload(compressed)).toEqual(regressionFixturePayload);
  });

  it("compresses and decompresses a share payload round-trip", () => {
    const payload = {
      version: CAR_COST_STATE_VERSION,
      state: {
        version: CAR_COST_STATE_VERSION,
        isSharedSession: false,
        selectedSource: "custom" as const,
        selectedTemplateId: "custom",
        values: defaultValues,
        recurringType: "year" as const,
        tripType: "oneWay" as const,
        tripTireSet: "allSeason" as const,
        updatedAt: "2026-03-16T00:00:00.000Z",
      },
      savedCustomVehicle: {
        id: "custom" as const,
        year: 2011,
        make: "Ford",
        model: "Mustang",
        title: "2011 Ford Mustang",
        values: defaultValues,
      },
    };

    const compressed = compressSharePayload(payload);
    expect(compressed.length).toBeGreaterThan(0);
    expect(decompressSharePayload(compressed)).toEqual(payload);
  });
});
