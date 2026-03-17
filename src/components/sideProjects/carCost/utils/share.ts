import { CAR_COST_STATE_VERSION } from "../config/constants";
import { CustomVehicle, PersistedCarCostState } from "../types";
import {
  compressSharePayload,
  decompressSharePayload,
  ShareableCarCostPayload,
} from "./sharePayloadCodec";

export const CAR_COST_SHARE_PARAM = "carCostShare";

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

  url.searchParams.set(CAR_COST_SHARE_PARAM, compressSharePayload(payload));

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
  console.log(decompressSharePayload(encodedPayload));
  return decompressSharePayload(encodedPayload);
};
