import { useEffect, useMemo, useState } from "react";
import {
  CustomVehicleDraft,
  CustomVehicleField,
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

type VehicleLookupField = Extract<CustomVehicleField, "year" | "make" | "model" | "trim">;

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
  }, [draft.year]);

  useEffect(() => {
    const parsedYear = Number(draft.year);
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
  }, [draft.make, draft.year]);

  useEffect(() => {
    const parsedYear = Number(draft.year);
    if (!draft.year || !draft.make || !draft.model || !Number.isInteger(parsedYear)) {
      setTrimOptions(EMPTY_OPTIONS);
      setSelectedVehicleDetails(null);
      return;
    }

    let isMounted = true;
    setIsLoadingTrims(true);
    setLookupError(null);
    setSelectedVehicleDetails(null);

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
        }
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setTrimOptions(EMPTY_OPTIONS);
        setLookupError(
          "We couldn't resolve trim-level fuel economy data for that model.",
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
  }, [draft.make, draft.model, draft.trim, draft.year, setDraft]);

  useEffect(() => {
    if (!draft.trim) {
      setSelectedVehicleDetails(null);
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
        setDraft((current) => ({
          ...current,
          fuelType: details.fuelType,
        }));
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setSelectedVehicleDetails(null);
        setLookupError("We couldn't load the detailed fuel economy for that trim.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingVehicleDetails(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [draft.trim, setDraft]);

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
        };
      }

      if (field === "make") {
        return {
          ...current,
          make: value,
          model: "",
          trim: "",
        };
      }

      if (field === "model") {
        return {
          ...current,
          model: value,
          trim: "",
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
