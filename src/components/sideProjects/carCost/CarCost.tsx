import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import M from "materialize-css";
import { ThemeContext } from "../../../utility/ThemeContext";
import { BreakdownMode } from "./components/CostBreakdownViewer";
import StartupModal from "./components/StartupModal";
import VehicleStickyBar from "./components/VehicleStickyBar";
import HeaderOverview from "./components/HeaderOverview";
import SetupPanels from "./components/SetupPanels";
import PlanningPanels from "./components/PlanningPanels";
import OwnershipSections from "./components/OwnershipSections";
import { BreakdownModal, LoanDetailsModal } from "./components/DetailModals";
import insightsMetadata from "./insights.json";
import vehicleTemplates from "./vehicleTemplates.json";
import { Link } from "react-router-dom";
import {
  CAR_COST_CUSTOM_KEY,
  CAR_COST_STATE_VERSION,
  CAR_COST_STORAGE_KEY,
  DEFAULT_FUEL_PRICES,
  STALE_STATE_MS,
  defaultValues,
} from "./config/constants";
import {
  CarCostProps,
  CarCostValues,
  CustomVehicle,
  CustomVehicleDraft,
  CustomVehicleField,
  FuelType,
  InsightCategory,
  InsightDefinition,
  PartialTemplateValues,
  PersistedCarCostState,
  RecurringType,
  TripType,
  VehicleTemplate,
} from "./types";
import { calculateCarCost } from "./utils/calculations";
import { buildBreakdownModes } from "./utils/breakdownModes";
import {
  buildButtonStyles,
  buildCardStyle,
  buildCompactStyles,
  buildInputContainerStyle,
  buildInvalidInputContainerStyle,
  buildPalette,
  buildPrefixStyle,
  buildSelectStyle,
  fieldLabelStyle,
  inputStyle,
  sectionDescriptionStyle,
  stackedCardStyle,
  subFieldLabelStyle,
} from "./utils/presentation";
import {
  applySessionScopedValues,
  cleanupModalArtifacts,
  getDraftFromVehicle,
  migratePersistedCarCostState,
  normalizeCarCostValues,
  normalizeVehicleTemplate,
  parseSavedCustomVehicle,
  getSessionScopedValues,
  stripSessionScopedValues,
} from "./utils/state";
import {
  buildFuelLabels,
  buildInsights,
  buildSummaryCards,
  buildTemplateOptions,
  buildVehicleTooltips,
  filterModalInsights,
  getCurrentVehicleLabel,
  getRecurringBreakdownMode,
} from "./utils/viewModel";

const CarCost: React.FC<CarCostProps> = ({ navWrapperRef }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const typedTemplates = useMemo(
    () =>
      (
        vehicleTemplates as Array<
          VehicleTemplate & { values: PartialTemplateValues }
        >
      ).map(normalizeVehicleTemplate),
    [],
  );
  const [values, setValues] = useState<CarCostValues>(defaultValues);
  const [recurringType, setRecurringType] = useState<RecurringType>("year");
  const [tripType, setTripType] = useState<TripType>("oneWay");
  const [hasResolvedStartupChoice, setHasResolvedStartupChoice] =
    useState(false);
  const [selectedSource, setSelectedSource] = useState<
    "default" | "template" | "custom"
  >("default");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [startupTemplateId, setStartupTemplateId] = useState<string>(
    typedTemplates[0]?.id ?? "",
  );
  const [savedCustomVehicle, setSavedCustomVehicle] =
    useState<CustomVehicle | null>(null);
  const [customVehicleDraft, setCustomVehicleDraft] =
    useState<CustomVehicleDraft>({
      year: "",
      make: "",
      model: "",
      fuelType: "regular",
    });
  const [customVehicleTouched, setCustomVehicleTouched] = useState<
    Record<CustomVehicleField, boolean>
  >({
    year: false,
    make: false,
    model: false,
  });
  const [showCustomVehicleValidation, setShowCustomVehicleValidation] =
    useState(false);
  const [startupNotice, setStartupNotice] = useState<string | null>(null);
  const [numericInputDrafts, setNumericInputDrafts] = useState<
    Record<string, string>
  >({});
  const [stickyTop, setStickyTop] = useState(72);
  const [isMobileView, setIsMobileView] = useState(false);
  const [breakdownModalMode, setBreakdownModalMode] =
    useState<BreakdownMode>("mile");
  const [breakdownModalTitle, setBreakdownModalTitle] = useState(
    "Cost breakdown details",
  );
  const [breakdownModalModes, setBreakdownModalModes] = useState<
    BreakdownMode[]
  >(["mile", "trip"]);
  const [breakdownInsightCategory, setBreakdownInsightCategory] =
    useState<InsightCategory | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalInstanceRef = useRef<M.Modal | null>(null);
  const breakdownModalRef = useRef<HTMLDivElement>(null);
  const breakdownModalInstanceRef = useRef<M.Modal | null>(null);
  const loanDetailsModalRef = useRef<HTMLDivElement>(null);
  const loanDetailsModalInstanceRef = useRef<M.Modal | null>(null);

  const palette = useMemo(() => buildPalette(isDarkMode), [isDarkMode]);
  const cardStyle = useMemo(() => buildCardStyle(palette), [palette]);
  const inputContainerStyle = useMemo(
    () => buildInputContainerStyle(palette),
    [palette],
  );
  const invalidInputContainerStyle = useMemo(
    () => buildInvalidInputContainerStyle(inputContainerStyle, isDarkMode),
    [inputContainerStyle, isDarkMode],
  );
  const prefixStyle = useMemo(() => buildPrefixStyle(palette), [palette]);
  const selectStyle = useMemo(() => buildSelectStyle(palette), [palette]);

  useEffect(() => {
    M.updateTextFields();
  }, [values, recurringType, customVehicleDraft]);

  useEffect(() => {
    const tooltipElements =
      document.querySelectorAll<HTMLElement>(".tooltipped");
    tooltipElements.forEach((element) => {
      M.Tooltip.getInstance(element)?.destroy();
    });
    M.Tooltip.init(tooltipElements, {
      enterDelay: 120,
      exitDelay: 0,
      position: "top",
    });

    return () => {
      tooltipElements.forEach((element) => {
        M.Tooltip.getInstance(element)?.destroy();
      });
    };
  }, [
    values.depreciationBasis,
    values.depreciationInterval,
    values.fuelType,
    values.fuelUnitPrice,
    values.purchasePrice,
    values.resaleValue,
    values.recurringMiles,
    values.includeVehicleCost,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    const applyFallbackPrice = () => {
      setValues((current) =>
        current.fuelUnitPrice === DEFAULT_FUEL_PRICES[current.fuelType]
          ? current
          : {
              ...current,
              fuelUnitPrice: DEFAULT_FUEL_PRICES[current.fuelType],
            },
      );
    };

    const fetchFuelPrice = async () => {
      try {
        const response = await fetch(
          "https://www.fueleconomy.gov/ws/rest/fuelprices",
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Fuel price lookup failed");
        }

        const xmlText = await response.text();
        const xml = new window.DOMParser().parseFromString(xmlText, "text/xml");
        const nodeNameByFuelType: Record<FuelType, string> = {
          cng: "cng",
          diesel: "diesel",
          e85: "e85",
          electric: "electric",
          lpg: "lpg",
          midgrade: "midgrade",
          premium: "premium",
          regular: "regular",
        };
        const priceNode = xml.querySelector(
          nodeNameByFuelType[values.fuelType],
        );
        const parsedPrice = Number(priceNode?.textContent ?? "");

        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
          throw new Error("Fuel price unavailable");
        }

        setValues((current) =>
          current.fuelType === values.fuelType
            ? { ...current, fuelUnitPrice: parsedPrice }
            : current,
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          applyFallbackPrice();
        }
      }
    };

    fetchFuelPrice();

    return () => {
      controller.abort();
    };
  }, [values.fuelType]);

  useEffect(() => {
    const updateStickyTop = () => {
      const nextTop = (navWrapperRef?.current?.offsetHeight ?? 56) + 8;
      setStickyTop(nextTop);
      setIsMobileView(window.innerWidth < 700);
    };

    updateStickyTop();
    window.addEventListener("resize", updateStickyTop);

    return () => {
      window.removeEventListener("resize", updateStickyTop);
    };
  }, [navWrapperRef]);

  useEffect(() => {
    if (!modalRef.current) {
      return;
    }

    modalInstanceRef.current = M.Modal.init(modalRef.current, {
      dismissible: false,
      preventScrolling: true,
      onOpenStart: () => {
        cleanupModalArtifacts();
      },
      onCloseEnd: () => {
        cleanupModalArtifacts();
      },
    });

    const savedState = localStorage.getItem(CAR_COST_STORAGE_KEY);
    const savedCustom = localStorage.getItem(CAR_COST_CUSTOM_KEY);

    const normalizedCustomVehicle = parseSavedCustomVehicle(savedCustom);
    if (normalizedCustomVehicle) {
      setSavedCustomVehicle(normalizedCustomVehicle);
      setCustomVehicleDraft(getDraftFromVehicle(normalizedCustomVehicle));
    }

    if (savedState) {
      try {
        const { migratedState, startupNotice: migrationNotice } =
          migratePersistedCarCostState(savedState);

        if (migratedState?.values && migratedState?.recurringType) {
          setValues(normalizeCarCostValues(migratedState.values));
          setRecurringType(migratedState.recurringType);
          setTripType(migratedState.tripType ?? "oneWay");
          setSelectedSource(migratedState.selectedSource ?? "default");
          setSelectedTemplateId(migratedState.selectedTemplateId ?? null);
          setStartupNotice(migrationNotice);
          if (
            migratedState.selectedSource === "template" &&
            migratedState.selectedTemplateId
          ) {
            setStartupTemplateId(migratedState.selectedTemplateId);
          }

          const savedAt = migratedState.updatedAt
            ? new Date(migratedState.updatedAt).getTime()
            : Number.NaN;
          const isRecentSession =
            Number.isFinite(savedAt) && Date.now() - savedAt <= STALE_STATE_MS;

          setHasResolvedStartupChoice(true);

          if (!isRecentSession || migrationNotice) {
            modalInstanceRef.current.open();
          }
        } else {
          localStorage.removeItem(CAR_COST_STORAGE_KEY);
          modalInstanceRef.current.open();
        }
      } catch (error) {
        localStorage.removeItem(CAR_COST_STORAGE_KEY);
        modalInstanceRef.current.open();
      }
    } else {
      modalInstanceRef.current.open();
    }

    return () => {
      cleanupModalArtifacts();
      modalInstanceRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!breakdownModalRef.current) {
      return;
    }

    breakdownModalInstanceRef.current = M.Modal.init(
      breakdownModalRef.current,
      {
        dismissible: true,
        preventScrolling: false,
        onOpenStart: () => {
          cleanupModalArtifacts();
        },
        onCloseEnd: () => {
          cleanupModalArtifacts();
        },
      },
    );

    return () => {
      cleanupModalArtifacts();
      breakdownModalInstanceRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!loanDetailsModalRef.current) {
      return;
    }

    loanDetailsModalInstanceRef.current = M.Modal.init(
      loanDetailsModalRef.current,
      {
        dismissible: true,
        preventScrolling: false,
        onOpenStart: () => {
          cleanupModalArtifacts();
        },
        onCloseEnd: () => {
          cleanupModalArtifacts();
        },
      },
    );

    return () => {
      cleanupModalArtifacts();
      loanDetailsModalInstanceRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!hasResolvedStartupChoice) {
      return;
    }

    const nextState: PersistedCarCostState = {
      version: CAR_COST_STATE_VERSION,
      selectedSource,
      selectedTemplateId,
      values,
      recurringType,
      tripType,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(CAR_COST_STORAGE_KEY, JSON.stringify(nextState));
  }, [
    hasResolvedStartupChoice,
    recurringType,
    selectedSource,
    selectedTemplateId,
    tripType,
    values,
  ]);

  const getNumericDraftValue = (key: string, actualValue: number) =>
    Object.prototype.hasOwnProperty.call(numericInputDrafts, key)
      ? numericInputDrafts[key]
      : String(actualValue);

  const clearNumericDraft = (key: string) => {
    setNumericInputDrafts((current) => {
      if (!Object.prototype.hasOwnProperty.call(current, key)) {
        return current;
      }

      const nextDrafts = { ...current };
      delete nextDrafts[key];
      return nextDrafts;
    });
  };

  const handleNumericFieldChange =
    (name: keyof CarCostValues, draftKey = String(name)) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      setNumericInputDrafts((current) => ({
        ...current,
        [draftKey]: rawValue,
      }));

      if (
        rawValue === "" ||
        rawValue === "-" ||
        rawValue === "." ||
        rawValue === "-."
      ) {
        return;
      }

      const parsedValue = Number(rawValue);
      if (Number.isNaN(parsedValue)) {
        return;
      }

      setValues((current) => ({
        ...current,
        [name]: parsedValue,
      }));
    };

  const handleNumericFieldBlur =
    (name: keyof CarCostValues, draftKey = String(name)) =>
    (event: React.FocusEvent<HTMLInputElement>) => {
      const rawValue = (
        Object.prototype.hasOwnProperty.call(numericInputDrafts, draftKey)
          ? numericInputDrafts[draftKey]
          : event.target.value
      ).trim();
      const parsedValue =
        rawValue === "" ||
        rawValue === "-" ||
        rawValue === "." ||
        rawValue === "-."
          ? 0
          : Number(rawValue);

      setValues((current) => ({
        ...current,
        [name]: Number.isNaN(parsedValue) ? current[name] : parsedValue,
      }));
      clearNumericDraft(draftKey);
    };

  const handleToggleChange =
      (
        name:
          | "includeVehicleCost"
          | "includeDepreciation"
          | "includeAnnualOwnership"
          | "includeFinancing",
    ) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({
        ...current,
        [name]: event.target.checked ? 1 : 0,
      }));
    };

  const handleLoanPaymentModeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setValues((current) => ({
      ...current,
      loanPaymentMode: event.target.value as CarCostValues["loanPaymentMode"],
    }));
  };

  const handleNumericInputFocus = (
    event: React.FocusEvent<HTMLInputElement>,
  ) => {
    if (event.target.value === "0") {
      event.target.select();
    }
  };

  const applySelection = (
    source: "default" | "template" | "custom",
    nextValues: CarCostValues,
    nextRecurringType: RecurringType,
    nextTemplateId: string | null,
  ) => {
    setSelectedSource(source);
    setSelectedTemplateId(nextTemplateId);
    setValues(nextValues);
    setRecurringType(nextRecurringType);
    if (source === "default") {
      setCustomVehicleDraft({
        year: "",
        make: "",
        model: "",
        fuelType: "regular",
      });
    }
    setHasResolvedStartupChoice(true);
    modalInstanceRef.current?.close();
  };

  const handleLoadStartupTemplate = () => {
    const matchingTemplate = typedTemplates.find(
      (template) => template.id === startupTemplateId,
    );
    if (!matchingTemplate) {
      M.toast({
        html: "Choose a template to get started",
        displayLength: 2500,
      });
      return;
    }

    const sessionValues = getSessionScopedValues(values);
    applySelection(
      "template",
      applySessionScopedValues(matchingTemplate.values, sessionValues),
      recurringType,
      matchingTemplate.id,
    );
  };

  const handleTemplateSwitch = (nextValue: string) => {
    const sessionValues = getSessionScopedValues(values);
    if (nextValue === "custom") {
      if (!savedCustomVehicle) {
        return;
      }
      setSelectedSource("custom");
      setSelectedTemplateId("custom");
      setValues(applySessionScopedValues(savedCustomVehicle.values, sessionValues));
      return;
    }

    const template = typedTemplates.find((item) => item.id === nextValue);
    if (!template) {
      return;
    }

    setSelectedSource("template");
    setSelectedTemplateId(template.id);
    setValues(applySessionScopedValues(template.values, sessionValues));
  };

  const handleFuelTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextFuelType = event.target.value as FuelType;
    setValues((current) => ({
      ...current,
      fuelType: nextFuelType,
      fuelUnitPrice: DEFAULT_FUEL_PRICES[nextFuelType],
    }));
  };

  const handleMiscMaintenanceBasisChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextBasis = event.target
      .value as CarCostValues["miscMaintenanceBasis"];
    setValues((current) => ({
      ...current,
      miscMaintenanceBasis: nextBasis,
      miscMaintenanceInterval:
        nextBasis === "miles"
          ? current.miscMaintenanceInterval || 15000
          : nextBasis === "month"
            ? 1
            : 1,
    }));
  };

  const handleDepreciationBasisChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextBasis = event.target.value as CarCostValues["depreciationBasis"];
    setValues((current) => ({
      ...current,
      depreciationBasis: nextBasis,
      depreciationInterval:
        nextBasis === "miles"
          ? current.depreciationInterval || 100000
          : current.depreciationInterval || 5,
    }));
  };

  const handleCustomVehicleDraftChange =
    (field: keyof CustomVehicleDraft) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCustomVehicleDraft((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleCustomVehicleFieldBlur = (field: CustomVehicleField) => () => {
    setCustomVehicleTouched((current) => ({
      ...current,
      [field]: true,
    }));
    setShowCustomVehicleValidation(true);
  };

  const parsedCustomVehicleYear = Number(customVehicleDraft.year);
  const currentModelYear = new Date().getFullYear() + 1;
  const customVehicleFieldErrors: Record<CustomVehicleField, string> = {
    year:
      customVehicleDraft.year.trim().length === 0
        ? "Enter a year."
        : !Number.isInteger(parsedCustomVehicleYear)
          ? "Year must be a whole number."
          : parsedCustomVehicleYear < 1886 ||
              parsedCustomVehicleYear > currentModelYear
            ? `Year must be between 1886 and ${currentModelYear}.`
            : "",
    make: customVehicleDraft.make.trim().length === 0 ? "Enter a make." : "",
    model: customVehicleDraft.model.trim().length === 0 ? "Enter a model." : "",
  };
  const isCustomVehicleValid =
    customVehicleFieldErrors.year === "" &&
    customVehicleFieldErrors.make === "" &&
    customVehicleFieldErrors.model === "";

  const customVehicleValidationMessage =
    customVehicleFieldErrors.year ||
    customVehicleFieldErrors.make ||
    customVehicleFieldErrors.model;

  const handleStartWithOwnCar = () => {
    if (!isCustomVehicleValid) {
      setCustomVehicleTouched({ year: true, make: true, model: true });
      setShowCustomVehicleValidation(true);
      M.toast({
        html: "Enter a valid year, make, and model",
        displayLength: 2500,
      });
      return;
    }

    const trimmedMake = customVehicleDraft.make.trim();
    const trimmedModel = customVehicleDraft.model.trim();
    const nextCustomVehicle: CustomVehicle = {
      id: "custom",
      year: parsedCustomVehicleYear,
      make: trimmedMake,
      model: trimmedModel,
      title: `${parsedCustomVehicleYear} ${trimmedMake} ${trimmedModel}`,
      values: normalizeCarCostValues(
        stripSessionScopedValues({
        fuelType: customVehicleDraft.fuelType,
        fuelUnitPrice: DEFAULT_FUEL_PRICES[customVehicleDraft.fuelType],
        }),
      ),
    };

    setSavedCustomVehicle(nextCustomVehicle);
    localStorage.setItem(
      CAR_COST_CUSTOM_KEY,
      JSON.stringify(nextCustomVehicle),
    );
    applySelection("custom", nextCustomVehicle.values, "year", "custom");
    M.toast({ html: `Loaded ${nextCustomVehicle.title}`, displayLength: 2500 });
  };

  const handleOpenOwnCarModal = () => {
    cleanupModalArtifacts();
    setCustomVehicleDraft(getDraftFromVehicle(savedCustomVehicle));
    setCustomVehicleTouched({ year: false, make: false, model: false });
    setShowCustomVehicleValidation(false);
    modalInstanceRef.current?.open();
  };

  const handleAnnualMileageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const parsedAnnualMiles = Number(event.target.value);
    const nextAnnualMiles = Number.isFinite(parsedAnnualMiles)
      ? Math.max(parsedAnnualMiles, 0)
      : 0;

    const recurringMilesByType: Record<RecurringType, number> = {
      day: nextAnnualMiles / 365,
      week: nextAnnualMiles / 52,
      month: nextAnnualMiles / 12,
      year: nextAnnualMiles,
      weekday: nextAnnualMiles / 260,
    };

    setValues((current) => ({
      ...current,
      recurringMiles: recurringMilesByType[recurringType],
    }));
  };

  const handleAnnualMileageDraftChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const rawValue = event.target.value;
    setNumericInputDrafts((current) => ({
      ...current,
      annualMileageVehicleCost: rawValue,
    }));

    if (
      rawValue === "" ||
      rawValue === "-" ||
      rawValue === "." ||
      rawValue === "-."
    ) {
      return;
    }

    const parsedValue = Number(rawValue);
    if (Number.isNaN(parsedValue)) {
      return;
    }

    handleAnnualMileageChange({
      ...event,
      target: { ...event.target, value: String(parsedValue) },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleAnnualMileageBlur = (
    event: React.FocusEvent<HTMLInputElement>,
  ) => {
    const rawValue = (
      Object.prototype.hasOwnProperty.call(
        numericInputDrafts,
        "annualMileageVehicleCost",
      )
        ? numericInputDrafts.annualMileageVehicleCost
        : event.target.value
    ).trim();
    const parsedValue =
      rawValue === "" ||
      rawValue === "-" ||
      rawValue === "." ||
      rawValue === "-."
        ? 0
        : Number(rawValue);

    handleAnnualMileageChange({
      ...event,
      target: {
        ...event.target,
        value: String(
          Number.isNaN(parsedValue) ? calculations.annualMileage : parsedValue,
        ),
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>);
    clearNumericDraft("annualMileageVehicleCost");
  };

  const calculations = useMemo(
    () => calculateCarCost(values, recurringType, tripType),
    [recurringType, tripType, values],
  );

  const breakdownModes = useMemo(
    () => buildBreakdownModes(values, calculations),
    [calculations, values],
  );

  const filteredBreakdownModalModes = useMemo(
    () =>
      breakdownModes.filter((mode) => breakdownModalModes.includes(mode.key)),
    [breakdownModalModes, breakdownModes],
  );

  const openBreakdownModal = (
    mode: BreakdownMode,
    title: string,
    visibleModes: BreakdownMode[],
    insightCategory: InsightCategory | null = null,
  ) => {
    cleanupModalArtifacts();
    setBreakdownModalMode(mode);
    setBreakdownModalTitle(title);
    setBreakdownModalModes(visibleModes);
    setBreakdownInsightCategory(insightCategory);
    breakdownModalInstanceRef.current?.open();
  };

  const openLoanDetailsModal = () => {
    cleanupModalArtifacts();
    loanDetailsModalInstanceRef.current?.open();
  };

  const summaryCards = buildSummaryCards(calculations);
  const primarySummaryCard =
    summaryCards.find((card) => card.highlight) ?? summaryCards[0];
  const secondarySummaryCards = summaryCards.filter((card) => !card.highlight);
  const templateOptions = buildTemplateOptions(
    savedCustomVehicle,
    typedTemplates,
  );
  const currentVehicleLabel = getCurrentVehicleLabel(
    selectedSource,
    savedCustomVehicle,
    typedTemplates,
    selectedTemplateId,
  );
  const recurringBreakdownMode = getRecurringBreakdownMode(recurringType);
  const { fuelEfficiencyLabel, fuelPriceLabel, fuelPriceTooltip } =
    buildFuelLabels(values);
  const { depreciationIntervalTooltip, parkingTooltip, resaleWarningTooltip } =
    buildVehicleTooltips(values, calculations);
  const {
    solidPrimaryButtonStyle,
    solidSecondaryButtonStyle,
    tripTypeButtonStyle,
  } = buildButtonStyles(isDarkMode, isMobileView, palette);
  const {
    compactMetricCardPadding,
    compactMetricLabelStyle,
    compactMetricValueStyle,
  } = buildCompactStyles(isMobileView, palette);
  const insights = buildInsights(
    calculations,
    insightsMetadata as InsightDefinition[],
  );
  const modalInsights = filterModalInsights(insights, breakdownInsightCategory);

  return (
    <div
      className={isMobileView ? "flow-text" : "container flow-text"}
      style={{
        paddingBottom: isMobileView ? "2rem" : "3rem",
        width: isMobileView ? "100%" : undefined,
        maxWidth: isMobileView ? "100%" : undefined,
      }}
    >
      <style>
        {`
          .material-tooltip {
            max-width: 320px;
            white-space: normal;
            line-height: 1.45;
            padding: 12px 14px;
          }

          .material-tooltip .tooltip-content {
            white-space: normal;
            overflow-wrap: anywhere;
          }

          .car-cost-placeholder::placeholder {
            color: rgba(107, 98, 91, 0.7);
            opacity: 1;
          }

          .car-cost-placeholder::-webkit-input-placeholder {
            color: rgba(107, 98, 91, 0.7);
            opacity: 1;
          }
        `}
      </style>
      <StartupModal
        modalRef={modalRef}
        palette={{
          panelBackground: palette.panelBackground,
          text: palette.text,
          muted: palette.muted,
          border: palette.border,
          subtlePanel: palette.subtlePanel,
        }}
        styles={{
          cardStyle,
          inputContainerStyle,
          invalidInputContainerStyle,
          selectStyle,
          inputStyle,
          solidPrimaryButtonStyle,
        }}
        isMobileView={isMobileView}
        startupTemplateId={startupTemplateId}
        typedTemplates={typedTemplates}
        setStartupTemplateId={setStartupTemplateId}
        handleLoadStartupTemplate={handleLoadStartupTemplate}
        customVehicleDraft={customVehicleDraft}
        setCustomVehicleDraft={setCustomVehicleDraft}
        customVehicleTouched={customVehicleTouched}
        showCustomVehicleValidation={showCustomVehicleValidation}
        customVehicleFieldErrors={customVehicleFieldErrors}
        customVehicleValidationMessage={customVehicleValidationMessage}
        currentModelYear={currentModelYear}
        isCustomVehicleValid={isCustomVehicleValid}
        startupNotice={startupNotice}
        handleCustomVehicleDraftChange={handleCustomVehicleDraftChange}
        handleCustomVehicleFieldBlur={handleCustomVehicleFieldBlur}
        handleNumericInputFocus={handleNumericInputFocus}
        setCustomVehicleTouched={setCustomVehicleTouched}
        setShowCustomVehicleValidation={setShowCustomVehicleValidation}
        handleStartWithOwnCar={handleStartWithOwnCar}
      />

      <BreakdownModal
        breakdownModalRef={breakdownModalRef}
        palette={{
          panelBackground: palette.panelBackground,
          text: palette.text,
          muted: palette.muted,
          border: palette.border,
          accent: palette.accent,
          accentDark: palette.accentDark,
          chartBase: palette.chartBase,
          chartCenter: palette.chartCenter,
          tooltipBackground: palette.tooltipBackground,
          shadow: palette.shadow,
          cardBackground: palette.cardBackground,
        }}
        cardStyle={cardStyle}
        breakdownModalMode={breakdownModalMode}
        breakdownModalModes={breakdownModalModes}
        breakdownModalTitle={breakdownModalTitle}
        filteredBreakdownModalModes={filteredBreakdownModalModes}
        modalInsights={modalInsights}
        isDarkMode={isDarkMode}
      />

      <LoanDetailsModal
        loanDetailsModalRef={loanDetailsModalRef}
        palette={{
          panelBackground: palette.panelBackground,
          text: palette.text,
          muted: palette.muted,
          border: palette.border,
          accent: palette.accent,
          accentDark: palette.accentDark,
          chartBase: palette.chartBase,
          cardBackground: palette.cardBackground,
        }}
        cardStyle={cardStyle}
        values={values}
        calculations={calculations}
      />

      <VehicleStickyBar
        palette={{
          panelBackground: palette.panelBackground,
          muted: palette.muted,
          resultHighlight: palette.resultHighlight,
          softBorder: palette.softBorder,
        }}
        cardStyle={cardStyle}
        inputContainerStyle={inputContainerStyle}
        selectStyle={selectStyle}
        solidSecondaryButtonStyle={solidSecondaryButtonStyle}
        isMobileView={isMobileView}
        stickyTop={stickyTop}
        currentVehicleLabel={currentVehicleLabel}
        selectedSource={selectedSource}
        selectedTemplateId={selectedTemplateId}
        templateOptions={templateOptions}
        handleTemplateSwitch={handleTemplateSwitch}
        handleOpenOwnCarModal={handleOpenOwnCarModal}
        calculations={calculations}
      />

      <div
        style={{
          background: isMobileView ? "transparent" : palette.shellBackground,
          borderRadius: isMobileView ? 0 : "32px",
          padding: isMobileView ? "0.5rem" : "2rem",
          marginTop: isMobileView ? "0.5rem" : "1rem",
          marginLeft: isMobileView ? "-0.75rem" : undefined,
          marginRight: isMobileView ? "-0.75rem" : undefined,
          width: isMobileView ? "calc(100% + 1.5rem)" : undefined,
          maxWidth: isMobileView ? "calc(100% + 1.5rem)" : undefined,
          color: palette.text,
          display: "flow-root",
        }}
      >
        <HeaderOverview
          palette={{
            panelBackground: palette.panelBackground,
            muted: palette.muted,
            accentDark: palette.accentDark,
            summaryHighlight: palette.summaryHighlight,
            missionShadow: palette.missionShadow,
          }}
          cardStyle={cardStyle}
          stackedCardStyle={stackedCardStyle}
          isMobileView={isMobileView}
          primarySummaryCard={primarySummaryCard}
          secondarySummaryCards={secondarySummaryCards}
        />

        <SetupPanels
          values={values}
          calculations={calculations}
          palette={{ text: palette.text, muted: palette.muted }}
          styles={{
            cardStyle,
            inputContainerStyle,
            invalidInputContainerStyle,
            prefixStyle,
            selectStyle,
            inputStyle,
            sectionDescriptionStyle: sectionDescriptionStyle(palette),
            fieldLabelStyle,
            subFieldLabelStyle: subFieldLabelStyle(palette),
          }}
          isMobileView={isMobileView}
          fuelEfficiencyLabel={fuelEfficiencyLabel}
          fuelPriceLabel={fuelPriceLabel}
          fuelPriceTooltip={fuelPriceTooltip}
          handleFuelTypeChange={handleFuelTypeChange}
          depreciationIntervalTooltip={depreciationIntervalTooltip}
          parkingTooltip={parkingTooltip}
          resaleWarningTooltip={resaleWarningTooltip}
          getNumericDraftValue={getNumericDraftValue}
          handleNumericFieldChange={handleNumericFieldChange}
          handleNumericFieldBlur={handleNumericFieldBlur}
          handleNumericInputFocus={handleNumericInputFocus}
          handleToggleChange={handleToggleChange}
          handleMiscMaintenanceBasisChange={handleMiscMaintenanceBasisChange}
          handleDepreciationBasisChange={handleDepreciationBasisChange}
          handleLoanPaymentModeChange={handleLoanPaymentModeChange}
          handleAnnualMileageDraftChange={handleAnnualMileageDraftChange}
          handleAnnualMileageBlur={handleAnnualMileageBlur}
        />
        <PlanningPanels
          values={values}
          calculations={calculations}
          palette={{
            muted: palette.muted,
            accentDark: palette.accentDark,
            resultHighlight: palette.resultHighlight,
            yearlyHighlight: palette.yearlyHighlight,
            cardBackground: palette.cardBackground,
            text: palette.text,
            softBorder: palette.softBorder,
          }}
          cardStyle={cardStyle}
          inputContainerStyle={inputContainerStyle}
          selectStyle={selectStyle}
          inputStyle={inputStyle}
          compactMetricCardPadding={compactMetricCardPadding}
          compactMetricLabelStyle={compactMetricLabelStyle}
          compactMetricValueStyle={compactMetricValueStyle}
          isMobileView={isMobileView}
          tripType={tripType}
          recurringType={recurringType}
          recurringBreakdownMode={recurringBreakdownMode}
          tripTypeButtonStyle={tripTypeButtonStyle}
          setTripType={setTripType}
          setRecurringType={setRecurringType}
          getNumericDraftValue={getNumericDraftValue}
          handleNumericFieldChange={handleNumericFieldChange}
          handleNumericFieldBlur={handleNumericFieldBlur}
          handleNumericInputFocus={handleNumericInputFocus}
          openBreakdownModal={openBreakdownModal}
        />

        <OwnershipSections
          values={values}
          calculations={calculations}
          palette={{
            text: palette.text,
            muted: palette.muted,
            accent: palette.accent,
            accentDark: palette.accentDark,
            border: palette.border,
            chartBase: palette.chartBase,
            chartCenter: palette.chartCenter,
            tooltipBackground: palette.tooltipBackground,
            shadow: palette.shadow,
            cardBackground: palette.cardBackground,
          }}
          cardStyle={cardStyle}
          compactMetricCardPadding={compactMetricCardPadding}
          compactMetricLabelStyle={compactMetricLabelStyle}
          compactMetricValueStyle={compactMetricValueStyle}
          breakdownModes={breakdownModes}
          insights={insights}
          isDarkMode={isDarkMode}
          openLoanDetailsModal={openLoanDetailsModal}
        />

        <div style={{ textAlign: "center", padding: "0.5rem 0 1rem" }}>
          <Link
            to="/sideProjects/carCost/about"
            onClick={() => window.scrollTo({ top: 0, behavior: "auto" })}
            style={{
              color: palette.accentDark,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            More about this page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CarCost;
