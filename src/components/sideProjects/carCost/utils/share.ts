import { CAR_COST_STATE_VERSION } from "../config/constants";
import { CustomVehicle, PersistedCarCostState } from "../types";

export const CAR_COST_SHARE_PARAM = "carCostShare";

type ShareableCarCostPayload = {
  version: number;
  state: PersistedCarCostState;
  savedCustomVehicle: CustomVehicle | null;
};

const encodeBase64Url = (value: string) =>
  btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const decodeBase64Url = (value: string) => {
  const paddedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = paddedValue.length % 4;
  const normalizedValue =
    remainder === 0 ? paddedValue : `${paddedValue}${"=".repeat(4 - remainder)}`;

  return decodeURIComponent(escape(atob(normalizedValue)));
};

export const buildShareableCarCostUrl = ({
  currentUrl,
  savedCustomVehicle,
  state,
}: {
  currentUrl: string;
  savedCustomVehicle: CustomVehicle | null;
  state: PersistedCarCostState;
}) => {
  const url = new URL(currentUrl);
  const payload: ShareableCarCostPayload = {
    version: CAR_COST_STATE_VERSION,
    state,
    savedCustomVehicle:
      state.selectedSource === "custom" ? savedCustomVehicle : null,
  };

  url.searchParams.set(
    CAR_COST_SHARE_PARAM,
    encodeBase64Url(JSON.stringify(payload)),
  );

  return url.toString();
};

export const parseSharedCarCostPayload = (
  search: string,
): ShareableCarCostPayload | null => {
  const params = new URLSearchParams(search);
  const encodedPayload = params.get(CAR_COST_SHARE_PARAM);

  if (!encodedPayload) {
    return null;
  }

  try {
    return JSON.parse(
      decodeBase64Url(encodedPayload),
    ) as ShareableCarCostPayload;
  } catch (error) {
    return null;
  }
};
