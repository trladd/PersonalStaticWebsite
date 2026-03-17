import { getVehicleClassDefaultValues } from "../vehicleClassDefaults";

describe("vehicleClassDefaults", () => {
  it("returns category-specific generic defaults for known buckets", () => {
    const compact = getVehicleClassDefaultValues("compact");
    const heavyDuty = getVehicleClassDefaultValues("heavy_duty_truck");
    const standardPickup = getVehicleClassDefaultValues("standard_pickup_truck");
    const midsize = getVehicleClassDefaultValues("midsize");

    expect(compact.annualInsurance).toBe(1511);
    expect(compact.oilChangeCost).toBe(65);
    expect(compact.tireCost).toBe(850);

    expect(midsize.annualInsurance).toBe(1572);
    expect(midsize.miscMaintenanceCost).toBe(775);

    expect(heavyDuty.annualInsurance).toBe(2400);
    expect(heavyDuty.oilChangeCost).toBe(140);
    expect(heavyDuty.tireCost).toBe(1500);

    expect(standardPickup.annualInsurance).toBe(1699);
    expect(standardPickup.oilChangeCost).toBe(100);
    expect(standardPickup.tireCost).toBe(1100);
  });

  it("returns an empty override object for unknown buckets", () => {
    expect(getVehicleClassDefaultValues("unknown")).toEqual({});
  });
});
