import { useEffect, useMemo, useState } from "react";
import { defaultValues } from "../config/constants";
import {
  CustomVehicleDraft,
  SelectedVehicleLookupDetails,
  VehicleLookupOption,
} from "../types";
import {
  buildVehicleDetailsSummary,
  fetchVehicleLookupDetails,
  fetchVehicleMakes,
  fetchVehicleModels,
  fetchVehicleTrimOptions,
  getVehicleLookupYears,
} from "./vehicleData";

type VehicleLookupField =
  | "year"
  | "make"
  | "model"
  | "trim"
  | "vehicleClassBucket"
  | "manualVehicleEntry";

type VehicleLookupProps = {
  draft: CustomVehicleDraft;
  setDraft: React.Dispatch<React.SetStateAction<CustomVehicleDraft>>;
};

const EMPTY_OPTIONS: VehicleLookupOption[] = [];

export const useVehicleLookup = ({
  draft,
  setDraft,
}: VehicleLookupProps) => {
  const [makeOptions, setMakeOptions] = useState<VehicleLookupOption[]>(EMPTY_OPTIONS);
  const [modelOptions, setModelOptions] = useState<VehicleLookupOption[]>(EMPTY_OPTIONS);
  const [trimOptions, setTrimOptions] = useState<VehicleLookupOption[]>(EMPTY_OPTIONS);
  const [selectedVehicleDetails, setSelectedVehicleDetails] =
    useState<SelectedVehicleLookupDetails | null>(null);
  const [isLoadingMakes, setIsLoadingMakes] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingTrims, setIsLoadingTrims] = useState(false);
  const [isLoadingVehicleDetails, setIsLoadingVehicleDetails] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [trimNotRequired, setTrimNotRequired] = useState(false);
  const [requiresManualCategory, setRequiresManualCategory] = useState(false);
  const [manualCategoryMessage, setManualCategoryMessage] = useState<string | null>(
    null,
  );

  const yearOptions = useMemo(
    () =>
      getVehicleLookupYears().map((year) => ({
        label: String(year),
        value: String(year),
      })),
    [],
  );

  useEffect(() => {
    const parsedYear = Number(draft.year);
    if (draft.manualVehicleEntry) {
      setMakeOptions(EMPTY_OPTIONS);
      return;
    }
    if (!draft.year || !Number.isInteger(parsedYear)) {
      setMakeOptions(EMPTY_OPTIONS);
      return;
    }

    let isMounted = true;
    setIsLoadingMakes(true);
    setLookupError(null);

    fetchVehicleMakes(parsedYear)
      .then((options) => {
        if (!isMounted) {
          return;
        }

        setMakeOptions(options);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setMakeOptions(EMPTY_OPTIONS);
        setLookupError("We couldn't load the available makes right now.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingMakes(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [draft.manualVehicleEntry, draft.year]);

  useEffect(() => {
    const parsedYear = Number(draft.year);
    if (draft.manualVehicleEntry) {
      setModelOptions(EMPTY_OPTIONS);
      return;
    }
    if (!draft.year || !draft.make || !Number.isInteger(parsedYear)) {
      setModelOptions(EMPTY_OPTIONS);
      return;
    }

    let isMounted = true;
    setIsLoadingModels(true);
    setLookupError(null);

    fetchVehicleModels(parsedYear, draft.make)
      .then((options) => {
        if (!isMounted) {
          return;
        }

        setModelOptions(options);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setModelOptions(EMPTY_OPTIONS);
        setLookupError("We couldn't load the available models right now.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingModels(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [draft.make, draft.manualVehicleEntry, draft.year]);

  useEffect(() => {
    const parsedYear = Number(draft.year);
    if (draft.manualVehicleEntry) {
      setTrimOptions(EMPTY_OPTIONS);
      setSelectedVehicleDetails(null);
      setTrimNotRequired(true);
      setRequiresManualCategory(true);
      setManualCategoryMessage(
        "That is okay. If your vehicle is not in the free government data sets, you can enter it manually. Choose the closest category and provide fuel economy details, and the calculator will still work well with a little more manual attention.",
      );
      return;
    }
    if (!draft.year || !draft.make || !draft.model || !Number.isInteger(parsedYear)) {
      setTrimOptions(EMPTY_OPTIONS);
      setSelectedVehicleDetails(null);
      setTrimNotRequired(false);
      setRequiresManualCategory(false);
      setManualCategoryMessage(null);
      return;
    }

    let isMounted = true;
    setIsLoadingTrims(true);
    setLookupError(null);
    setSelectedVehicleDetails(null);
    setTrimNotRequired(false);
    setRequiresManualCategory(false);
    setManualCategoryMessage(null);

    fetchVehicleTrimOptions(parsedYear, draft.make, draft.model)
      .then((options) => {
        if (!isMounted) {
          return;
        }

        setTrimOptions(options);
        if (options.length === 1 && !draft.trim) {
          setDraft((current) => ({
            ...current,
            trim: options[0].value,
          }));
          return;
        }

        if (options.length === 0) {
          setTrimNotRequired(true);
          setRequiresManualCategory(true);
          setManualCategoryMessage(
            "We could not find EPA trim-level fuel economy data for this vehicle. This often happens for heavier-duty trucks or less-complete government records. Choose the closest vehicle category so we can set rough defaults, then review the numbers manually.",
          );
        }
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setTrimOptions(EMPTY_OPTIONS);
        setTrimNotRequired(true);
        setRequiresManualCategory(true);
        setManualCategoryMessage(
          "We could not resolve EPA trim-level fuel economy data for this vehicle. Choose the closest vehicle category so we can set rough defaults, then review the details manually.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingTrims(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [draft.make, draft.manualVehicleEntry, draft.model, draft.trim, draft.year, setDraft]);

  useEffect(() => {
    if (draft.manualVehicleEntry) {
      setSelectedVehicleDetails(null);
      return;
    }
    if (!draft.trim) {
      setSelectedVehicleDetails(null);
      if (!trimNotRequired) {
        setRequiresManualCategory(false);
        setManualCategoryMessage(null);
      }
      return;
    }

    let isMounted = true;
    setIsLoadingVehicleDetails(true);
    setLookupError(null);

    fetchVehicleLookupDetails(draft.trim)
      .then((details) => {
        if (!isMounted) {
          return;
        }

        setSelectedVehicleDetails(details);
        setRequiresManualCategory(false);
        setManualCategoryMessage(null);
        setDraft((current) => ({
          ...current,
          fuelType: details.fuelType,
          vehicleClassBucket: details.lookupSummary.vehicleClassBucket,
        }));
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setSelectedVehicleDetails(null);
        setRequiresManualCategory(true);
        setManualCategoryMessage(
          "We found the vehicle, but the free EPA detail record is incomplete for this trim. Choose the closest vehicle category so we can apply rough defaults, then review the entered values manually.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingVehicleDetails(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [draft.manualVehicleEntry, draft.trim, setDraft, trimNotRequired]);

  const setLookupField = (field: VehicleLookupField, value: string) => {
    setLookupError(null);
    setDraft((current) => {
      if (field === "year") {
        return {
          ...current,
          year: value,
          make: "",
          model: "",
          trim: "",
          fuelType: defaultValues.fuelType,
          vehicleClassBucket: "",
        };
      }

      if (field === "make") {
        return {
          ...current,
          make: value,
          model: "",
          trim: "",
          fuelType: defaultValues.fuelType,
          vehicleClassBucket: "",
        };
      }

      if (field === "model") {
        return {
          ...current,
          model: value,
          trim: "",
          fuelType: defaultValues.fuelType,
          vehicleClassBucket: "",
        };
      }

      if (field === "vehicleClassBucket") {
        return {
          ...current,
          vehicleClassBucket: value as typeof current.vehicleClassBucket,
        };
      }

      if (field === "manualVehicleEntry") {
        const isEnabled = value === "1";
        return {
          ...current,
          manualVehicleEntry: isEnabled,
          make: isEnabled ? current.make : "",
          model: isEnabled ? current.model : "",
          trim: isEnabled ? current.trim : "",
          vehicleClassBucket: isEnabled ? current.vehicleClassBucket : "",
          fuelType: isEnabled ? current.fuelType : defaultValues.fuelType,
        };
      }

      return {
        ...current,
        trim: value,
      };
    });
  };

  return {
    yearOptions,
    makeOptions,
    modelOptions,
    trimOptions,
    trimNotRequired,
    requiresManualCategory,
    manualCategoryMessage,
    selectedVehicleDetails,
    selectedVehicleSummary: buildVehicleDetailsSummary(selectedVehicleDetails),
    isLoadingMakes,
    isLoadingModels,
    isLoadingTrims,
    isLoadingVehicleDetails,
    lookupError,
    setLookupField,
  };
};
