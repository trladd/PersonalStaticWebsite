import { CAR_COST_ADMIN_STORAGE_KEY } from "../config/constants";
import { CustomVehicle, VehicleTemplate } from "../types";

declare global {
  interface Window {
    gtag?: (
      command: "event",
      eventName: string,
      params?: Record<string, string | number | boolean>,
    ) => void;
  }
}

export type CarCostAnalyticsSection =
  | "startup"
  | "running_costs"
  | "vehicle_cost"
  | "annual_ownership"
  | "trip_estimate"
  | "recurring_driving_totals"
  | "breakdown_explorer"
  | "ownership_summary"
  | "sharing"
  | "install";

export type CarCostVehicleSelectionSource =
  | "startup_template"
  | "sticky_switcher"
  | "startup_custom"
  | "shared_link"
  | "resume";

type AnalyticsParams = Record<
  string,
  string | number | boolean | null | undefined
>;

type AnalyticsPreviewHandler = (
  eventName: string,
  params: Record<string, string | number | boolean>,
) => void;

let analyticsPreviewHandler: AnalyticsPreviewHandler | null = null;

const normalizeAnalyticsParams = (
  params: AnalyticsParams,
): Record<string, string | number | boolean> =>
  Object.fromEntries(
    Object.entries(params).filter(
      (
        entry,
      ): entry is [string, string | number | boolean] =>
        entry[1] !== undefined && entry[1] !== null,
    ),
  );

export const setCarCostAnalyticsPreviewHandler = (
  handler: AnalyticsPreviewHandler | null,
) => {
  analyticsPreviewHandler = handler;
};

export const isCarCostAnalyticsDisabled = () => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const savedAdminState = window.localStorage.getItem(
      CAR_COST_ADMIN_STORAGE_KEY,
    );
    if (!savedAdminState) {
      return false;
    }

    const parsedAdminState = JSON.parse(savedAdminState) as {
      disableAnalyticsLogging?: boolean;
    };

    return parsedAdminState.disableAnalyticsLogging ?? false;
  } catch (error) {
    return false;
  }
};

export const trackCarCostEvent = (
  eventName: string,
  params: AnalyticsParams,
) => {
  const normalizedParams = normalizeAnalyticsParams(params);
  const disabled = isCarCostAnalyticsDisabled();

  if (disabled) {
    analyticsPreviewHandler?.(eventName, normalizedParams);
    return;
  }

  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, normalizedParams);
};

export const trackCarCostSectionEngagement = (
  section: CarCostAnalyticsSection,
) => {
  trackCarCostEvent(
    "car_cost_section_engaged",
    {
      section_name: section,
    },
  );
};

export const trackCarCostDetailOpened = (
  detailType: string,
  context: string,
) => {
  trackCarCostEvent(
    "car_cost_detail_opened",
    {
      detail_type: detailType,
      detail_context: context,
    },
  );
};

export const trackCarCostShare = (
  method: "native_share" | "clipboard" | "clipboard_failed",
) => {
  trackCarCostEvent(
    "car_cost_share",
    {
      share_method: method,
    },
  );
};

export const trackCarCostInstallPrompt = (
  action: "opened" | "accepted" | "dismissed",
) => {
  trackCarCostEvent(
    "car_cost_install_prompt",
    {
      install_action: action,
    },
  );
};

export const trackCarCostSessionEvent = (
  mode: "shared" | "resume",
) => {
  trackCarCostEvent(
    "car_cost_session_loaded",
    {
      startup_mode: mode,
    },
  );
};

export const trackCarCostVehicleSelected = ({
  selectionSource,
  selectedSource,
  templateId,
  vehicle,
}: {
  selectionSource: CarCostVehicleSelectionSource;
  selectedSource: "default" | "template" | "custom";
  templateId?: string | null;
  vehicle: Pick<VehicleTemplate, "year" | "make" | "model" | "title"> | null;
}) => {
  trackCarCostEvent(
    "car_cost_vehicle_selected",
    {
      selection_source: selectionSource,
      vehicle_source: selectedSource,
      template_id: templateId ?? undefined,
      vehicle_year: vehicle?.year,
      vehicle_make: vehicle?.make,
      vehicle_model: vehicle?.model,
      vehicle_label: vehicle?.title,
    },
  );
};

export const buildAnalyticsVehicleFromCustomDraft = ({
  trim,
  fuelType: _fuelType,
  ...draft
}: {
  year: string;
  make: string;
  model: string;
  trim?: string;
  fuelType: string;
}) => {
  const parsedYear = Number(draft.year);
  const trimmedMake = draft.make.trim();
  const trimmedModel = draft.model.trim();
  const trimmedTrim = trim?.trim();

  if (!Number.isInteger(parsedYear) || !trimmedMake || !trimmedModel) {
    return null;
  }

  return {
    year: parsedYear,
    make: trimmedMake,
    model: trimmedTrim || trimmedModel,
    title: `${parsedYear} ${trimmedMake} ${trimmedTrim || trimmedModel}`,
  };
};

export const buildAnalyticsVehicleFromSavedCustom = (
  vehicle: CustomVehicle | null,
) =>
  vehicle
    ? {
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        title: vehicle.title,
      }
    : null;
