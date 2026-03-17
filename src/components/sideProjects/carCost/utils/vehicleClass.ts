import { VehicleClassBucket } from "../types";

const normalizeVehicleClassValue = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");

// IMPORTANT:
// These are intentionally broad buckets. EPA VClass values are useful, but they
// are still coarse and can classify sporty trims in surprising ways. We use the
// normalized bucket for ballpark defaults, not as a claim that the vehicle is
// perfectly represented in every case.
const VEHICLE_CLASS_BUCKET_RULES: Array<{
  bucket: VehicleClassBucket;
  matches: string[];
}> = [
  {
    bucket: "two_seater",
    matches: ["two seaters"],
  },
  {
    bucket: "subcompact",
    matches: ["subcompact cars", "minicompact cars"],
  },
  {
    bucket: "compact",
    matches: ["compact cars", "small station wagons"],
  },
  {
    bucket: "midsize",
    matches: [
      "midsize cars",
      "midsize station wagons",
      "midsize large station wagons",
    ],
  },
  {
    bucket: "large",
    matches: ["large cars"],
  },
  {
    bucket: "minivan",
    matches: ["minivan 2wd", "minivan 4wd"],
  },
  {
    bucket: "heavy_duty_truck",
    matches: ["heavy duty truck"],
  },
  {
    bucket: "small_pickup_truck",
    matches: [
      "small pickup trucks",
      "small pickup trucks 2wd",
      "small pickup trucks 4wd",
    ],
  },
  {
    bucket: "small_suv",
    matches: [
      "small sport utility vehicle 2wd",
      "small sport utility vehicle 4wd",
    ],
  },
  {
    bucket: "special_purpose",
    matches: [
      "special purpose vehicle",
      "special purpose vehicle 2wd",
      "special purpose vehicle 4wd",
      "special purpose vehicles",
      "special purpose vehicles 2wd",
      "special purpose vehicles 4wd",
    ],
  },
  {
    bucket: "suv",
    matches: [
      "sport utility vehicle 2wd",
      "sport utility vehicle 4wd",
    ],
  },
  {
    bucket: "standard_pickup_truck",
    matches: [
      "standard pickup trucks",
      "standard pickup trucks 2wd",
      "standard pickup trucks 4wd",
    ],
  },
  {
    bucket: "standard_suv",
    matches: [
      "standard sport utility vehicle 2wd",
      "standard sport utility vehicle 4wd",
    ],
  },
  {
    bucket: "van_passenger",
    matches: ["vans passenger", "vans passenger type"],
  },
  {
    bucket: "van_cargo",
    matches: ["vans", "vans cargo type"],
  },
];

export const mapVehicleClassToBucket = (
  vehicleClass: string | null | undefined,
): VehicleClassBucket => {
  if (!vehicleClass || vehicleClass.trim().length === 0) {
    return "unknown";
  }

  const normalizedClass = normalizeVehicleClassValue(vehicleClass);
  const match = VEHICLE_CLASS_BUCKET_RULES.find((rule) =>
    rule.matches.includes(normalizedClass),
  );

  return match?.bucket ?? "unknown";
};

export const getKnownVehicleClassBuckets = (): VehicleClassBucket[] =>
  VEHICLE_CLASS_BUCKET_RULES.map((rule) => rule.bucket);

export const VEHICLE_CLASS_BUCKET_LABELS: Record<
  Exclude<VehicleClassBucket, "unknown">,
  string
> = {
  two_seater: "Two seater",
  subcompact: "Subcompact car",
  compact: "Compact car",
  midsize: "Midsize car",
  large: "Large car",
  minivan: "Minivan",
  heavy_duty_truck: "Heavy-duty pickup truck",
  small_pickup_truck: "Small pickup truck",
  small_suv: "Small SUV",
  special_purpose: "Special purpose vehicle",
  suv: "SUV",
  standard_pickup_truck: "Standard pickup truck",
  standard_suv: "Standard SUV",
  van_passenger: "Passenger van",
  van_cargo: "Cargo van",
};

export const getVehicleClassBucketLabel = (
  bucket: VehicleClassBucket | "",
) => {
  if (!bucket || bucket === "unknown") {
    return "Unknown";
  }

  return VEHICLE_CLASS_BUCKET_LABELS[bucket];
};

export const getVehicleClassBucketOptions = () =>
  (Object.entries(VEHICLE_CLASS_BUCKET_LABELS) as Array<
    [Exclude<VehicleClassBucket, "unknown">, string]
  >).map(([value, label]) => ({
    value,
    label,
  }));
