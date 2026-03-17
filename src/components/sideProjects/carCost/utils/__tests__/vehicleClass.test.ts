import {
  getKnownVehicleClassBuckets,
  mapVehicleClassToBucket,
} from "../vehicleClass";

describe("vehicleClass utils", () => {
  it("maps EPA VClass strings into broad default buckets", () => {
    expect(mapVehicleClassToBucket("Two Seaters")).toBe("two_seater");
    expect(mapVehicleClassToBucket("Subcompact Cars")).toBe("subcompact");
    expect(mapVehicleClassToBucket("Compact Cars")).toBe("compact");
    expect(mapVehicleClassToBucket("Midsize Cars")).toBe("midsize");
    expect(mapVehicleClassToBucket("Large Cars")).toBe("large");
    expect(mapVehicleClassToBucket("Minivan - 4WD")).toBe("minivan");
    expect(mapVehicleClassToBucket("Small Pickup Trucks 4WD")).toBe(
      "small_pickup_truck",
    );
    expect(mapVehicleClassToBucket("Small Sport Utility Vehicle 2WD")).toBe(
      "small_suv",
    );
    expect(mapVehicleClassToBucket("Sport Utility Vehicle - 4WD")).toBe("suv");
    expect(mapVehicleClassToBucket("Standard Pickup Trucks/2wd")).toBe(
      "standard_pickup_truck",
    );
    expect(mapVehicleClassToBucket("Standard Sport Utility Vehicle 4WD")).toBe(
      "standard_suv",
    );
    expect(mapVehicleClassToBucket("Special Purpose Vehicles/4wd")).toBe(
      "special_purpose",
    );
    expect(mapVehicleClassToBucket("Vans Passenger")).toBe("van_passenger");
    expect(mapVehicleClassToBucket("Vans, Cargo Type")).toBe("van_cargo");
  });

  it("returns unknown for missing or unmapped classes", () => {
    expect(mapVehicleClassToBucket(null)).toBe("unknown");
    expect(mapVehicleClassToBucket("")).toBe("unknown");
    expect(mapVehicleClassToBucket("Some New Future Class")).toBe("unknown");
  });

  it("exposes the known normalized buckets for future defaults config", () => {
    expect(getKnownVehicleClassBuckets()).toEqual([
      "two_seater",
      "subcompact",
      "compact",
      "midsize",
      "large",
      "minivan",
      "heavy_duty_truck",
      "small_pickup_truck",
      "small_suv",
      "special_purpose",
      "suv",
      "standard_pickup_truck",
      "standard_suv",
      "van_passenger",
      "van_cargo",
    ]);
  });
});
