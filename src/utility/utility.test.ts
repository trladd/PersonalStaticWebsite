import { getYearsSince } from "./utility";

describe("getYearsSince", () => {
  it("increments at the beginning of the anniversary month", () => {
    expect(getYearsSince(2017, 5, new Date(2026, 3, 30))).toBe(8);
    expect(getYearsSince(2017, 5, new Date(2026, 4, 1))).toBe(9);
  });

  it("does not return a negative value for a future start month", () => {
    expect(getYearsSince(2027, 5, new Date(2026, 4, 1))).toBe(0);
  });
});
