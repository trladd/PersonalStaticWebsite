import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import M from "materialize-css";
import { ThemeContext } from "../../../utility/ThemeContext";
import { BreakdownMode } from "./components/CostBreakdownViewer";
import StartupModal from "./components/StartupModal";
import VehicleStickyBar from "./components/VehicleStickyBar";
import HeaderOverview from "./components/HeaderOverview";
import SetupPanels from "./components/SetupPanels";
import PlanningPanels from "./components/PlanningPanels";
import OwnershipSections from "./components/OwnershipSections";
import InstallAppModal from "./components/InstallAppModal";
import { BreakdownModal, LoanDetailsModal } from "./components/DetailModals";
import insightsMetadata from "./insights.json";
import vehicleTemplates from "./vehicleTemplates.json";
import { Link } from "react-router-dom";
import {
  CAR_COST_ADMIN_STORAGE_KEY,
  CAR_COST_CUSTOM_KEY,
  CAR_COST_STATE_VERSION,
  CAR_COST_STORAGE_KEY,
  DEFAULT_FUEL_PRICES,
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
  parseCarCostAdminState,
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
import {
  buildShareableCarCostUrl,
  parseSharedCarCostPayload,
} from "./utils/share";
import {
  buildAnalyticsVehicleFromCustomDraft,
  buildAnalyticsVehicleFromSavedCustom,
  setCarCostAnalyticsPreviewHandler,
  trackCarCostDetailOpened,
  trackCarCostInstallPrompt,
  trackCarCostSectionEngagement,
  trackCarCostSessionEvent,
  trackCarCostShare,
  trackCarCostVehicleSelected,
  type CarCostAnalyticsSection,
} from "./utils/analytics";

const CarCost: React.FC<CarCostProps> = ({ navWrapperRef }) => {
  type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  };

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
  const [startupMode, setStartupMode] = useState<
    "default" | "resume" | "shared"
  >("default");
  const [isSharedSession, setIsSharedSession] = useState(false);
  const [disableAnalyticsLogging, setDisableAnalyticsLogging] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return parseCarCostAdminState(
      window.localStorage.getItem(CAR_COST_ADMIN_STORAGE_KEY),
      window.localStorage.getItem(CAR_COST_STORAGE_KEY),
    ).disableAnalyticsLogging;
  });
  const [sharedStartupSummary, setSharedStartupSummary] = useState<{
    vehicleLabel: string;
    trueCostPerMile: number;
    overallCost: number;
  } | null>(null);
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
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
  const installModalRef = useRef<HTMLDivElement>(null);
  const installModalInstanceRef = useRef<M.Modal | null>(null);
  const engagedSectionsRef = useRef<Set<CarCostAnalyticsSection>>(new Set());

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

  const initializeStartupModal = useCallback(
    (dismissible: boolean) => {
      if (!modalRef.current) {
        return null;
      }

      modalInstanceRef.current?.destroy();
      modalInstanceRef.current = M.Modal.init(modalRef.current, {
        dismissible,
        preventScrolling: true,
        onOpenStart: () => {
          cleanupModalArtifacts();
        },
        onCloseEnd: () => {
          cleanupModalArtifacts();
        },
      });

      return modalInstanceRef.current;
    },
    [],
  );

  useEffect(() => {
    M.updateTextFields();
  }, [values, recurringType, customVehicleDraft]);

  useEffect(() => {
    setCarCostAnalyticsPreviewHandler((eventName, params) => {
      const previewDetails = Object.entries(params)
        .slice(0, 3)
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join(" | ");

      M.toast({
        html: `Analytics preview: ${eventName}${
          previewDetails ? ` (${previewDetails})` : ""
        }`,
        classes: "teal lighten-1",
        displayLength: 10000,
      });
    });

    return () => {
      setCarCostAnalyticsPreviewHandler(null);
    };
  }, []);

  useEffect(() => {
    const handleAnalyticsToggleShortcut = (event: KeyboardEvent) => {
      const isShortcutPressed =
        event.key === "Enter" &&
        event.shiftKey &&
        (event.metaKey || event.ctrlKey);

      if (!isShortcutPressed) {
        return;
      }

      event.preventDefault();
      setDisableAnalyticsLogging((current) => {
        const nextValue = !current;
        M.toast({
          html: nextValue
            ? "Car cost analytics disabled for this session."
            : "Car cost analytics enabled for this session.",
          displayLength: 2200,
        });
        return nextValue;
      });
    };

    window.addEventListener("keydown", handleAnalyticsToggleShortcut);

    return () => {
      window.removeEventListener("keydown", handleAnalyticsToggleShortcut);
    };
  }, []);

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

    const navElement = navWrapperRef?.current ?? null;
    const observer =
      typeof ResizeObserver !== "undefined" && navElement
        ? new ResizeObserver(() => {
            updateStickyTop();
          })
        : null;

    if (observer && navElement) {
      observer.observe(navElement);
    }

    return () => {
      window.removeEventListener("resize", updateStickyTop);
      observer?.disconnect();
    };
  }, [navWrapperRef]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  useEffect(() => {
    if (!modalRef.current) {
      return;
    }

    const savedState = localStorage.getItem(CAR_COST_STORAGE_KEY);
    const savedCustom = localStorage.getItem(CAR_COST_CUSTOM_KEY);
    const sharedPayload = parseSharedCarCostPayload(window.location.search);

    const normalizedCustomVehicle = parseSavedCustomVehicle(savedCustom);
    if (normalizedCustomVehicle) {
      setSavedCustomVehicle(normalizedCustomVehicle);
      setCustomVehicleDraft(getDraftFromVehicle(normalizedCustomVehicle));
    }

    if (sharedPayload?.state) {
      const { migratedState, startupNotice: migrationNotice } =
        migratePersistedCarCostState(JSON.stringify(sharedPayload.state));

      let normalizedSharedVehicle: CustomVehicle | null = null;
      if (sharedPayload.savedCustomVehicle) {
        normalizedSharedVehicle = {
          ...sharedPayload.savedCustomVehicle,
          id: "custom",
          values: normalizeCarCostValues(
            stripSessionScopedValues(sharedPayload.savedCustomVehicle.values),
          ),
        };
      }

      if (migratedState?.values && migratedState?.recurringType) {
        const nextSharedState: PersistedCarCostState = {
          ...migratedState,
          version: CAR_COST_STATE_VERSION,
          isSharedSession: true,
          updatedAt: new Date().toISOString(),
        };

        localStorage.setItem(
          CAR_COST_STORAGE_KEY,
          JSON.stringify(nextSharedState),
        );
        if (normalizedSharedVehicle) {
          localStorage.setItem(
            CAR_COST_CUSTOM_KEY,
            JSON.stringify(normalizedSharedVehicle),
          );
        }
      }

      const cleanedUrl = new URL(window.location.href);
      cleanedUrl.searchParams.delete("carCostShare");
      window.history.replaceState({}, document.title, cleanedUrl.toString());

      if (normalizedSharedVehicle) {
        setSavedCustomVehicle(normalizedSharedVehicle);
        setCustomVehicleDraft(getDraftFromVehicle(normalizedSharedVehicle));
      }

      if (migratedState?.values && migratedState?.recurringType) {
        const nextSharedState: PersistedCarCostState = {
          ...migratedState,
          version: CAR_COST_STATE_VERSION,
          isSharedSession: true,
          updatedAt: new Date().toISOString(),
        };
        const sharedVehicleLabel =
          nextSharedState.selectedSource === "custom"
            ? (normalizedSharedVehicle?.title ?? "Shared vehicle")
            : getCurrentVehicleLabel(
                nextSharedState.selectedSource ?? "default",
                null,
                typedTemplates,
                nextSharedState.selectedTemplateId ?? null,
              );
        const sharedCalculations = calculateCarCost(
          normalizeCarCostValues(nextSharedState.values),
          nextSharedState.recurringType,
          nextSharedState.tripType ?? "oneWay",
        );

        setValues(normalizeCarCostValues(nextSharedState.values));
        setRecurringType(nextSharedState.recurringType);
        setTripType(nextSharedState.tripType ?? "oneWay");
        setIsSharedSession(true);
        setSelectedSource(nextSharedState.selectedSource ?? "default");
        setSelectedTemplateId(nextSharedState.selectedTemplateId ?? null);
        setStartupMode("shared");
        setSharedStartupSummary({
          vehicleLabel: sharedVehicleLabel,
          trueCostPerMile: sharedCalculations.trueCostPerMile,
          overallCost: sharedCalculations.overallCost,
        });
        setStartupNotice(migrationNotice);
        if (
          nextSharedState.selectedSource === "template" &&
          nextSharedState.selectedTemplateId
        ) {
          setStartupTemplateId(nextSharedState.selectedTemplateId);
        }
        trackCarCostVehicleSelected({
          selectionSource: "shared_link",
          selectedSource: nextSharedState.selectedSource,
          templateId: nextSharedState.selectedTemplateId,
          vehicle:
            nextSharedState.selectedSource === "custom"
              ? buildAnalyticsVehicleFromSavedCustom(normalizedSharedVehicle)
              : typedTemplates.find(
                  (template) => template.id === nextSharedState.selectedTemplateId,
                ) ?? null,
        });
        setHasResolvedStartupChoice(true);
        initializeStartupModal(true)?.open();
      } else {
        setIsSharedSession(true);
        setStartupMode("shared");
        initializeStartupModal(true)?.open();
      }
    } else if (savedState) {
      try {
        const { migratedState, startupNotice: migrationNotice } =
          migratePersistedCarCostState(savedState);

        if (migratedState?.values && migratedState?.recurringType) {
          const savedVehicleLabel =
            migratedState.selectedSource === "custom"
              ? normalizedCustomVehicle?.title ?? "Your vehicle"
              : getCurrentVehicleLabel(
                  migratedState.selectedSource ?? "default",
                  normalizedCustomVehicle,
                  typedTemplates,
                  migratedState.selectedTemplateId ?? null,
                );
          const savedCalculations = calculateCarCost(
            normalizeCarCostValues(migratedState.values),
            migratedState.recurringType,
            migratedState.tripType ?? "oneWay",
          );

          setValues(normalizeCarCostValues(migratedState.values));
          setRecurringType(migratedState.recurringType);
          setTripType(migratedState.tripType ?? "oneWay");
          setIsSharedSession(migratedState.isSharedSession ?? false);
          setSelectedSource(migratedState.selectedSource ?? "default");
          setSelectedTemplateId(migratedState.selectedTemplateId ?? null);
          setStartupMode(
            migratedState.isSharedSession ? "shared" : "resume",
          );
          setSharedStartupSummary(
            migratedState.isSharedSession
              ? {
                  vehicleLabel: savedVehicleLabel,
                  trueCostPerMile: savedCalculations.trueCostPerMile,
                  overallCost: savedCalculations.overallCost,
                }
              : null,
          );
          setStartupNotice(migrationNotice);
          if (
            migratedState.selectedSource === "template" &&
            migratedState.selectedTemplateId
          ) {
            setStartupTemplateId(migratedState.selectedTemplateId);
          }

          setHasResolvedStartupChoice(true);
          initializeStartupModal(true)?.open();
        } else {
          localStorage.removeItem(CAR_COST_STORAGE_KEY);
          setStartupMode("default");
          setIsSharedSession(false);
          setSharedStartupSummary(null);
          initializeStartupModal(false)?.open();
        }
      } catch (error) {
        localStorage.removeItem(CAR_COST_STORAGE_KEY);
        setStartupMode("default");
        setIsSharedSession(false);
        setSharedStartupSummary(null);
        initializeStartupModal(false)?.open();
      }
    } else {
      setStartupMode("default");
      setIsSharedSession(false);
      setSharedStartupSummary(null);
      initializeStartupModal(false)?.open();
    }

    return () => {
      cleanupModalArtifacts();
      modalInstanceRef.current?.destroy();
    };
  }, [initializeStartupModal, typedTemplates]);

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
    if (!installModalRef.current) {
      return;
    }

    installModalInstanceRef.current = M.Modal.init(installModalRef.current, {
      dismissible: true,
      preventScrolling: false,
      onOpenStart: () => {
        cleanupModalArtifacts();
      },
      onCloseEnd: () => {
        cleanupModalArtifacts();
      },
    });

    return () => {
      cleanupModalArtifacts();
      installModalInstanceRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!startupNotice) {
      return;
    }

    const toast = M.toast({
      displayLength: Infinity,
      html: `<span>${startupNotice}</span><button class="btn-flat toast-action">Dismiss</button>`,
    });

    const dismissButton = toast.el.querySelector(
      ".toast-action",
    ) as HTMLButtonElement | null;
    const handleDismiss = () => {
      toast.dismiss();
      setStartupNotice(null);
    };

    dismissButton?.addEventListener("click", handleDismiss);

    return () => {
      dismissButton?.removeEventListener("click", handleDismiss);
      toast.dismiss();
    };
  }, [startupNotice]);

  const buildPersistedStateSnapshot = useCallback(
    (): PersistedCarCostState => ({
      version: CAR_COST_STATE_VERSION,
      isSharedSession,
      selectedSource,
      selectedTemplateId,
      values,
      recurringType,
      tripType,
      updatedAt: new Date().toISOString(),
    }),
    [
      isSharedSession,
      recurringType,
      selectedSource,
      selectedTemplateId,
      tripType,
      values,
    ],
  );

  useEffect(() => {
    if (!hasResolvedStartupChoice) {
      return;
    }

    const nextState: PersistedCarCostState = buildPersistedStateSnapshot();

    localStorage.setItem(CAR_COST_STORAGE_KEY, JSON.stringify(nextState));
  }, [buildPersistedStateSnapshot, hasResolvedStartupChoice]);

  useEffect(() => {
    localStorage.setItem(
      CAR_COST_ADMIN_STORAGE_KEY,
      JSON.stringify({ disableAnalyticsLogging }),
    );
  }, [disableAnalyticsLogging]);

  const getNumericDraftValue = (key: string, actualValue: number) =>
    Object.prototype.hasOwnProperty.call(numericInputDrafts, key)
      ? numericInputDrafts[key]
      : String(actualValue);

  const trackSectionEngagementOnce = (section: CarCostAnalyticsSection) => {
    if (engagedSectionsRef.current.has(section)) {
      return;
    }

    engagedSectionsRef.current.add(section);
    trackCarCostSectionEngagement(section);
  };

  const numericFieldSectionMap: Partial<
    Record<keyof CarCostValues, CarCostAnalyticsSection>
  > = {
    fuelEfficiency: "running_costs",
    fuelUnitPrice: "running_costs",
    oilChangeCost: "running_costs",
    oilChangeInterval: "running_costs",
    tireCost: "running_costs",
    tireInterval: "running_costs",
    miscMaintenanceCost: "running_costs",
    miscMaintenanceInterval: "running_costs",
    purchasePrice: "vehicle_cost",
    resaleValue: "vehicle_cost",
    depreciationInterval: "vehicle_cost",
    annualInsurance: "annual_ownership",
    annualRegistration: "annual_ownership",
    annualParking: "annual_ownership",
    annualInspection: "annual_ownership",
    annualRoadside: "annual_ownership",
    loanDownPayment: "vehicle_cost",
    loanApr: "vehicle_cost",
    loanTermMonths: "vehicle_cost",
    loanMonthlyPayment: "vehicle_cost",
    tripDistance: "trip_estimate",
    recurringMiles: "recurring_driving_totals",
  };

  const clearSharedSessionIfNeeded = () => {
    if (!isSharedSession) {
      return;
    }

    setIsSharedSession(false);
    setStartupMode("resume");
    setSharedStartupSummary(null);
  };

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

      const section = numericFieldSectionMap[name];
      if (section) {
        trackSectionEngagementOnce(section);
      }
      clearSharedSessionIfNeeded();
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
      trackSectionEngagementOnce(
        name === "includeAnnualOwnership" ? "annual_ownership" : "vehicle_cost",
      );
      clearSharedSessionIfNeeded();
      setValues((current) => ({
        ...current,
        [name]: event.target.checked ? 1 : 0,
      }));
    };

  const handleLoanPaymentModeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    trackSectionEngagementOnce("vehicle_cost");
    clearSharedSessionIfNeeded();
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
    trackSectionEngagementOnce("startup");
    trackCarCostVehicleSelected({
      selectionSource: "startup_template",
      selectedSource: "template",
      templateId: matchingTemplate.id,
      vehicle: matchingTemplate,
    });
    clearSharedSessionIfNeeded();
    applySelection(
      "template",
      applySessionScopedValues(matchingTemplate.values, sessionValues),
      recurringType,
      matchingTemplate.id,
    );
  };

  const handleTemplateSwitch = (nextValue: string) => {
    const sessionValues = getSessionScopedValues(values);
    trackSectionEngagementOnce("startup");
    clearSharedSessionIfNeeded();
    if (nextValue === "custom") {
      if (!savedCustomVehicle) {
        return;
      }
      trackCarCostVehicleSelected({
        selectionSource: "sticky_switcher",
        selectedSource: "custom",
        templateId: "custom",
        vehicle: buildAnalyticsVehicleFromSavedCustom(savedCustomVehicle),
      });
      setSelectedSource("custom");
      setSelectedTemplateId("custom");
      setValues(
        applySessionScopedValues(savedCustomVehicle.values, sessionValues),
      );
      return;
    }

    const template = typedTemplates.find((item) => item.id === nextValue);
    if (!template) {
      return;
    }

    trackCarCostVehicleSelected({
      selectionSource: "sticky_switcher",
      selectedSource: "template",
      templateId: template.id,
      vehicle: template,
    });
    setSelectedSource("template");
    setSelectedTemplateId(template.id);
    setValues(applySessionScopedValues(template.values, sessionValues));
  };

  const handleFuelTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextFuelType = event.target.value as FuelType;
    trackSectionEngagementOnce("running_costs");
    clearSharedSessionIfNeeded();
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
    trackSectionEngagementOnce("running_costs");
    clearSharedSessionIfNeeded();
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
    trackSectionEngagementOnce("vehicle_cost");
    clearSharedSessionIfNeeded();
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

    trackSectionEngagementOnce("startup");
    trackCarCostVehicleSelected({
      selectionSource: "startup_custom",
      selectedSource: "custom",
      templateId: "custom",
      vehicle: buildAnalyticsVehicleFromCustomDraft(customVehicleDraft),
    });
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
    trackSectionEngagementOnce("startup");
    clearSharedSessionIfNeeded();
    setStartupMode("resume");
    setSharedStartupSummary(null);
    setStartupNotice(null);
    setCustomVehicleDraft(getDraftFromVehicle(savedCustomVehicle));
    setCustomVehicleTouched({ year: false, make: false, model: false });
    setShowCustomVehicleValidation(false);
    initializeStartupModal(true)?.open();
  };

  const handleContinueFromSavedState = () => {
    if (startupMode === "shared" || startupMode === "resume") {
      trackCarCostSessionEvent(startupMode);
    }
    setStartupNotice(null);
    modalInstanceRef.current?.close();
  };

  const handleTripTypeDispatch: React.Dispatch<
    React.SetStateAction<TripType>
  > = (nextTripType) => {
    trackSectionEngagementOnce("trip_estimate");
    clearSharedSessionIfNeeded();
    setTripType((current) =>
      typeof nextTripType === "function" ? nextTripType(current) : nextTripType,
    );
  };

  const handleRecurringTypeDispatch: React.Dispatch<
    React.SetStateAction<RecurringType>
  > = (nextRecurringType) => {
    trackSectionEngagementOnce("recurring_driving_totals");
    clearSharedSessionIfNeeded();
    setRecurringType((current) =>
      typeof nextRecurringType === "function"
        ? nextRecurringType(current)
        : nextRecurringType,
    );
  };

  const handleAnnualMileageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    trackSectionEngagementOnce("vehicle_cost");
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

    clearSharedSessionIfNeeded();
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

  const handleShareCalculator = async () => {
    trackSectionEngagementOnce("sharing");
    const shareUrl = buildShareableCarCostUrl({
      currentUrl: window.location.href,
      savedCustomVehicle,
      state: buildPersistedStateSnapshot(),
    });

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Vehicle cost estimate for ${currentVehicleLabel}`,
          text: `Take a look at this car cost estimate for ${currentVehicleLabel}.`,
          url: shareUrl,
        });
        trackCarCostShare("native_share");
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      trackCarCostShare("clipboard");
      M.toast({
        html: "Share link copied. Paste it to send it to a friend.",
        displayLength: 2800,
      });
    } catch (error) {
      trackCarCostShare("clipboard_failed");
      M.toast({
        html: "Couldn't copy the share link automatically.",
        displayLength: 2500,
      });
    }
  };

  const handleOpenInstallModal = () => {
    trackSectionEngagementOnce("install");
    trackCarCostInstallPrompt("opened");
    installModalInstanceRef.current?.open();
  };

  const handleInstallApp = async () => {
    if (!installPromptEvent) {
      return;
    }

    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;

    if (choice.outcome === "accepted") {
      trackCarCostInstallPrompt("accepted");
      setInstallPromptEvent(null);
      installModalInstanceRef.current?.close();
      M.toast({ html: "Added to home screen.", displayLength: 2200 });
      return;
    }

    trackCarCostInstallPrompt("dismissed");
    M.toast({ html: "Install was dismissed.", displayLength: 2200 });
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
    trackSectionEngagementOnce("breakdown_explorer");
    trackCarCostDetailOpened("breakdown_modal", title);
    setBreakdownModalMode(mode);
    setBreakdownModalTitle(title);
    setBreakdownModalModes(visibleModes);
    setBreakdownInsightCategory(insightCategory);
    breakdownModalInstanceRef.current?.open();
  };

  const openLoanDetailsModal = () => {
    cleanupModalArtifacts();
    trackSectionEngagementOnce("ownership_summary");
    trackCarCostDetailOpened("loan_details_modal", "vehicle_financing");
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
  const isRunningAsPwa =
    window.matchMedia("(display-mode: standalone)").matches ||
    ((window.navigator as Navigator & { standalone?: boolean }).standalone ??
      false);
  const showInstallAppAction =
    isMobileView && !isRunningAsPwa && installPromptEvent !== null;

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
        startupMode={startupMode}
        sharedStartupSummary={sharedStartupSummary}
        showInstallAppAction={showInstallAppAction}
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
        handleContinueFromSavedState={handleContinueFromSavedState}
        handleOpenInstallModal={handleOpenInstallModal}
        handleCustomVehicleDraftChange={handleCustomVehicleDraftChange}
        handleCustomVehicleFieldBlur={handleCustomVehicleFieldBlur}
        handleNumericInputFocus={handleNumericInputFocus}
        setCustomVehicleTouched={setCustomVehicleTouched}
        setShowCustomVehicleValidation={setShowCustomVehicleValidation}
        handleStartWithOwnCar={handleStartWithOwnCar}
      />

      <InstallAppModal
        modalRef={installModalRef}
        palette={{
          panelBackground: palette.panelBackground,
          text: palette.text,
          muted: palette.muted,
          border: palette.border,
          subtlePanel: palette.subtlePanel,
        }}
        solidPrimaryButtonStyle={solidPrimaryButtonStyle}
        handleInstallApp={handleInstallApp}
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
        handleShareCalculator={handleShareCalculator}
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
        {disableAnalyticsLogging ? (
          <div
            style={{
              textAlign: "center",
              fontSize: "0.35rem",
              lineHeight: 1.2,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: palette.accentDark,
              opacity: 0.8,
              marginBottom: "0.35rem",
            }}
          >
            Analytics disabled
          </div>
        ) : null}
        {showInstallAppAction ? (
          <div
            style={{
              display: "flex",
              justifyContent: isMobileView ? "center" : "flex-end",
              marginBottom: "0.75rem",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn-flat"
              onClick={handleOpenInstallModal}
              style={{
                color: palette.accentDark,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <i className="material-icons tiny">download</i>
              Add app
            </button>
          </div>
        ) : null}
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
          setTripType={handleTripTypeDispatch}
          setRecurringType={handleRecurringTypeDispatch}
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

        <div
          style={{
            textAlign: "center",
            padding: "0.5rem 0 1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
              marginBottom: "0.25rem",
            }}
          >
            <button
              type="button"
              className="btn-flat"
              onClick={handleShareCalculator}
              style={{
                color: palette.accentDark,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <i className="material-icons tiny">ios_share</i>
              Share with a friend
            </button>
            {showInstallAppAction ? (
              <button
                type="button"
                className="btn-flat"
                onClick={handleOpenInstallModal}
                style={{
                  color: palette.accentDark,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <i className="material-icons tiny">download</i>
                Add app
              </button>
            ) : null}
          </div>
          <div style={{ textAlign: "center" }}>
            <Link
              to="/sideProjects/carCost/about"
              onClick={() => window.scrollTo({ top: 0, behavior: "auto" })}
              style={{
                color: palette.muted,
                fontWeight: 600,
                fontSize: "0.92rem",
                textDecoration: "none",
              }}
            >
              More information about this page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarCost;
