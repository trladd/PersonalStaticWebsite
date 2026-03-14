import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import M from "materialize-css";
import { Link } from "react-router-dom";
import { ThemeContext } from "../../../utility/ThemeContext";
import CostBreakdownViewer, {
  BreakdownMode,
  CostBreakdownViewerMode,
} from "./CostBreakdownViewer";
import { InsightCardData } from "./InsightsCard";
import InsightsSection from "./InsightsSection";
import insightsMetadata from "./insights.json";
import vehicleTemplates from "./vehicleTemplates.json";

interface CarCostProps {
  navWrapperRef?: React.RefObject<HTMLDivElement>;
}

type CarCostValues = {
  fuelType: FuelType;
  fuelEfficiency: number;
  fuelUnitPrice: number;
  oilChangeCost: number;
  oilChangeInterval: number;
  tireCost: number;
  tireInterval: number;
  miscMaintenanceCost: number;
  miscMaintenanceBasis: "miles" | "month" | "year";
  miscMaintenanceInterval: number;
  purchasePrice: number;
  resaleValue: number;
  depreciationInterval: number;
  tripDistance: number;
  recurringMiles: number;
  annualInsurance: number;
  annualRegistration: number;
  annualParking: number;
  annualInspection: number;
  annualRoadside: number;
  loanApr: number;
  includeDepreciation: number;
  includeAnnualOwnership: number;
  includeFinancing: number;
};

type FuelType =
  | "regular"
  | "midgrade"
  | "premium"
  | "diesel"
  | "e85"
  | "cng"
  | "lpg"
  | "electric";

type RecurringType = "day" | "week" | "month" | "year" | "weekday";
type TripType = "oneWay" | "roundTrip";
type InsightCategory = "global" | "tripEstimate" | "recurringDrivingTotals";

type FieldDefinition = {
  label: string;
  name: keyof CarCostValues;
  step: string;
  prefix?: string;
};

type PersistedCarCostState = {
  selectedSource: "default" | "template" | "custom";
  selectedTemplateId: string | null;
  values: CarCostValues;
  recurringType: RecurringType;
  tripType: TripType;
  updatedAt: string;
};

type VehicleTemplate = {
  id: string;
  year: number;
  make: string;
  model: string;
  title: string;
  values: CarCostValues;
};
type CustomVehicle = VehicleTemplate & { id: "custom" };

type CustomVehicleDraft = {
  year: string;
  make: string;
  model: string;
  fuelType: FuelType;
};

type CustomVehicleField = "year" | "make" | "model";

type PlannerValues = Pick<CarCostValues, "tripDistance" | "recurringMiles">;
type InsightDefinition = {
  id: string;
  label: string;
  benchmark: number;
  context: string;
  tooltip: string;
  methodology: string;
  sourceLabel?: string;
  sourceUrl?: string;
  associatedCategories: InsightCategory[];
};

const defaultValues: CarCostValues = {
  fuelType: "regular",
  fuelEfficiency: 25,
  fuelUnitPrice: 3.49,
  oilChangeCost: 75,
  oilChangeInterval: 7500,
  tireCost: 900,
  tireInterval: 50000,
  miscMaintenanceCost: 600,
  miscMaintenanceBasis: "miles",
  miscMaintenanceInterval: 15000,
  purchasePrice: 32000,
  resaleValue: 18000,
  depreciationInterval: 100000,
  tripDistance: 250,
  recurringMiles: 12000,
  annualInsurance: 2100,
  annualRegistration: 175,
  annualParking: 0,
  annualInspection: 0,
  annualRoadside: 100,
  loanApr: 6.7,
  includeDepreciation: 1,
  includeAnnualOwnership: 1,
  includeFinancing: 0,
};

const DEFAULT_FUEL_PRICES: Record<FuelType, number> = {
  cng: 2.96,
  diesel: 3.71,
  e85: 2.63,
  electric: 0.15,
  lpg: 3.42,
  midgrade: 3.5,
  premium: 3.86,
  regular: 2.92,
};

const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  cng: "CNG",
  diesel: "Diesel",
  e85: "E85",
  electric: "Electric",
  lpg: "LPG",
  midgrade: "Midgrade",
  premium: "Premium",
  regular: "Regular",
};

const DEFAULT_NEW_CAR_APR = 6.7;

const getPlannerValues = (values: CarCostValues): PlannerValues => ({
  tripDistance: values.tripDistance,
  recurringMiles: values.recurringMiles,
});

const applyPlannerValues = (
  baseValues: CarCostValues,
  plannerValues: PlannerValues,
): CarCostValues => ({
  ...baseValues,
  ...plannerValues,
});

const getDraftFromVehicle = (
  vehicle: CustomVehicle | null,
): CustomVehicleDraft => ({
  year: vehicle ? String(vehicle.year || "") : "",
  make: vehicle?.make ?? "",
  model: vehicle?.model ?? "",
  fuelType: vehicle?.values.fuelType ?? "regular",
});

const sections: {
  title: string;
  description: string;
  items: FieldDefinition[];
}[] = [
  {
    title: "Running costs",
    description:
      "Enter the costs and service intervals you want to spread across each mile.",
    items: [
      {
        label: "Oil change cost",
        name: "oilChangeCost",
        step: "0.01",
        prefix: "$",
      },
      {
        label: "Oil change interval (miles)",
        name: "oilChangeInterval",
        step: "1",
      },
      { label: "Tire cost", name: "tireCost", step: "0.01", prefix: "$" },
      { label: "Tire interval (miles)", name: "tireInterval", step: "1" },
      {
        label: "Misc. maintenance cost",
        name: "miscMaintenanceCost",
        step: "0.01",
        prefix: "$",
      },
      {
        label: "Misc. maintenance interval (miles)",
        name: "miscMaintenanceInterval",
        step: "1",
      },
    ],
  },
  {
    title: "Vehicle cost",
    description:
      "Estimate depreciation and, if applicable, financing costs tied to the vehicle itself.",
    items: [
      {
        label: "Purchase price",
        name: "purchasePrice",
        step: "0.01",
        prefix: "$",
      },
      {
        label: "Expected resale value",
        name: "resaleValue",
        step: "0.01",
        prefix: "$",
      },
      {
        label: "Depreciation interval (miles)",
        name: "depreciationInterval",
        step: "1",
      },
      {
        label: "APR (%)",
        name: "loanApr",
        step: "0.01",
      },
    ],
  },
  {
    title: "Annual ownership costs",
    description:
      "Add fixed yearly costs that happen whether you drive a lot or a little.",
    items: [
      {
        label: "Insurance per year",
        name: "annualInsurance",
        step: "0.01",
        prefix: "$",
      },
      {
        label: "Registration per year",
        name: "annualRegistration",
        step: "0.01",
        prefix: "$",
      },
      {
        label: "Parking per year",
        name: "annualParking",
        step: "0.01",
        prefix: "$",
      },
      {
        label: "Inspection / emissions per year",
        name: "annualInspection",
        step: "0.01",
        prefix: "$",
      },
      {
        label: "Roadside assistance per year",
        name: "annualRoadside",
        step: "0.01",
        prefix: "$",
      },
    ],
  },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  boxShadow: "none",
  margin: 0,
  padding: "0 1rem",
  height: "3rem",
  background: "transparent",
  color: "var(--text-color)",
  fontSize: "1rem",
  lineHeight: 1.4,
  fontFamily: "inherit",
};

const stackedCardStyle: React.CSSProperties = {
  marginBottom: "0.9rem",
};

const CAR_COST_STORAGE_KEY = "carCostState";
const CAR_COST_CUSTOM_KEY = "carCostCustomVehicle";
const STALE_STATE_MS = 60 * 60 * 1000;

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
const isToggleEnabled = (value: number) => value === 1;

const cleanupModalArtifacts = () => {
  document.body.style.overflow = "";
  document.body.style.width = "";

  if (document.querySelector(".modal.open")) {
    return;
  }

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.parentElement?.removeChild(overlay);
  });

  document.body.classList.remove("modal-open");
};

const CarCost: React.FC<CarCostProps> = ({ navWrapperRef }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const typedTemplates = useMemo(
    () =>
      (
        vehicleTemplates as Array<
          VehicleTemplate & { values: Partial<CarCostValues> }
        >
      ).map((template) => ({
        ...template,
        values: {
          ...defaultValues,
          ...template.values,
          fuelType: template.values.fuelType ?? defaultValues.fuelType,
          fuelEfficiency:
            template.values.fuelEfficiency ??
            (template.values as any).fuelMileage ??
            defaultValues.fuelEfficiency,
          miscMaintenanceBasis:
            template.values.miscMaintenanceBasis ?? defaultValues.miscMaintenanceBasis,
          fuelUnitPrice:
            DEFAULT_FUEL_PRICES[
              (template.values.fuelType ?? defaultValues.fuelType) as FuelType
            ],
          includeDepreciation: template.values.includeDepreciation ?? 1,
          includeAnnualOwnership: template.values.includeAnnualOwnership ?? 1,
          loanApr: template.values.loanApr ?? DEFAULT_NEW_CAR_APR,
          includeFinancing: template.values.includeFinancing ?? 0,
        },
      })),
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

  const palette = useMemo(
    () => ({
      shellBackground: isDarkMode
        ? "radial-gradient(circle at top left, rgba(184, 92, 56, 0.18), transparent 24%), linear-gradient(180deg, #191511 0%, #110e0b 100%)"
        : "radial-gradient(circle at top left, rgba(184, 92, 56, 0.18), transparent 24%), linear-gradient(180deg, #f8f4ec 0%, #f2eadf 100%)",
      cardBackground: isDarkMode
        ? "rgba(31, 25, 20, 0.96)"
        : "rgba(255, 252, 247, 0.96)",
      panelBackground: isDarkMode
        ? "rgba(39, 32, 24, 0.92)"
        : "rgba(255, 252, 247, 0.98)",
      subtlePanel: isDarkMode
        ? "rgba(44, 36, 27, 0.94)"
        : "rgba(255, 252, 247, 0.96)",
      border: isDarkMode
        ? "1px solid rgba(202, 202, 202, 0.12)"
        : "1px solid rgba(77, 55, 34, 0.12)",
      softBorder: isDarkMode
        ? "1px solid rgba(202, 202, 202, 0.16)"
        : "1px solid rgba(77, 55, 34, 0.15)",
      text: "var(--text-color)",
      muted: isDarkMode ? "rgba(202, 202, 202, 0.76)" : "#6b625b",
      accent: "#b85c38",
      accentDark: isDarkMode ? "#d79a7f" : "#7f351b",
      chartBase: isDarkMode ? "#2f261d" : "#f3e8da",
      chartCenter: isDarkMode
        ? "rgba(26, 22, 18, 0.98)"
        : "rgba(255, 252, 247, 0.98)",
      summaryHighlight: "linear-gradient(135deg, #b85c38 0%, #d47a4d 100%)",
      yearlyHighlight: isDarkMode
        ? "linear-gradient(135deg, rgba(184, 92, 56, 0.34) 0%, rgba(212, 122, 77, 0.28) 100%)"
        : "linear-gradient(135deg, #f0c59d 0%, #f7ddbd 100%)",
      resultHighlight: isDarkMode
        ? "linear-gradient(135deg, rgba(184, 92, 56, 0.26), rgba(212, 122, 77, 0.18))"
        : "linear-gradient(135deg, rgba(184, 92, 56, 0.12), rgba(212, 122, 77, 0.18))",
      tooltipBackground: isDarkMode
        ? "rgba(31, 25, 20, 0.98)"
        : "rgba(255, 252, 247, 0.98)",
      shadow: isDarkMode
        ? "0 24px 60px rgba(0, 0, 0, 0.34)"
        : "0 24px 60px rgba(91, 60, 34, 0.12)",
      missionShadow: isDarkMode
        ? "0 14px 34px rgba(0, 0, 0, 0.28)"
        : "0 14px 34px rgba(91, 60, 34, 0.08)",
    }),
    [isDarkMode],
  );

  const cardStyle: React.CSSProperties = useMemo(
    () => ({
      background: palette.cardBackground,
      border: palette.border,
      borderRadius: "24px",
      boxShadow: palette.shadow,
      color: palette.text,
    }),
    [palette],
  );

  const inputContainerStyle: React.CSSProperties = useMemo(
    () => ({
      display: "flex",
      alignItems: "center",
      minHeight: "3rem",
      background: palette.subtlePanel,
      border: palette.softBorder,
      borderRadius: "14px",
      overflow: "hidden",
    }),
    [palette],
  );

  const invalidInputContainerStyle: React.CSSProperties = useMemo(
    () => ({
      ...inputContainerStyle,
      border: isDarkMode
        ? "1px solid rgba(222, 114, 114, 0.55)"
        : "1px solid rgba(196, 73, 73, 0.38)",
      boxShadow: isDarkMode
        ? "0 0 0 1px rgba(222, 114, 114, 0.14)"
        : "0 0 0 1px rgba(196, 73, 73, 0.08)",
    }),
    [inputContainerStyle, isDarkMode],
  );

  const prefixStyle: React.CSSProperties = useMemo(
    () => ({
      display: "flex",
      alignItems: "center",
      alignSelf: "stretch",
      padding: "0 0.85rem",
      color: palette.muted,
      fontWeight: 600,
      fontSize: "1rem",
      lineHeight: 1,
      borderRight: palette.softBorder,
      background: "rgba(0, 0, 0, 0.04)",
    }),
    [palette],
  );

  const selectStyle: React.CSSProperties = useMemo(
    () => ({
      width: "100%",
      height: "3rem",
      minHeight: "3rem",
      border: "none",
      outline: "none",
      borderRadius: "14px",
      padding: "0 1rem",
      background: "transparent",
      color: palette.text,
      fontSize: "1rem",
      lineHeight: 1.4,
      fontFamily: "inherit",
      cursor: "pointer",
      appearance: "none",
      WebkitAppearance: "none",
      MozAppearance: "none",
    }),
    [palette],
  );

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
  }, [values.fuelType, values.fuelUnitPrice]);

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

    if (savedCustom) {
      try {
        const parsedCustom = JSON.parse(savedCustom) as CustomVehicle;
        if (parsedCustom?.title && parsedCustom?.values) {
          const normalizedCustomVehicle = {
            ...parsedCustom,
            values: {
              ...defaultValues,
              ...parsedCustom.values,
              fuelType: parsedCustom.values.fuelType ?? defaultValues.fuelType,
              fuelEfficiency:
                parsedCustom.values.fuelEfficiency ??
                (parsedCustom.values as any).fuelMileage ??
                defaultValues.fuelEfficiency,
              miscMaintenanceBasis:
                parsedCustom.values.miscMaintenanceBasis ??
                defaultValues.miscMaintenanceBasis,
              fuelUnitPrice:
                parsedCustom.values.fuelUnitPrice ??
                DEFAULT_FUEL_PRICES[
                  (parsedCustom.values.fuelType ??
                    defaultValues.fuelType) as FuelType
                ],
              loanApr: parsedCustom.values.loanApr ?? DEFAULT_NEW_CAR_APR,
              includeFinancing: parsedCustom.values.includeFinancing ?? 0,
            },
          } as CustomVehicle;
          setSavedCustomVehicle(normalizedCustomVehicle);
          setCustomVehicleDraft(getDraftFromVehicle(normalizedCustomVehicle));
        } else {
          localStorage.removeItem(CAR_COST_CUSTOM_KEY);
        }
      } catch (error) {
        localStorage.removeItem(CAR_COST_CUSTOM_KEY);
      }
    }

    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState) as PersistedCarCostState;
        if (parsedState?.values && parsedState?.recurringType) {
          setValues({
            ...defaultValues,
            ...parsedState.values,
            fuelType: parsedState.values.fuelType ?? defaultValues.fuelType,
            fuelEfficiency:
              parsedState.values.fuelEfficiency ??
              (parsedState.values as any).fuelMileage ??
              defaultValues.fuelEfficiency,
            miscMaintenanceBasis:
              parsedState.values.miscMaintenanceBasis ??
              defaultValues.miscMaintenanceBasis,
            fuelUnitPrice:
              parsedState.values.fuelUnitPrice ??
              DEFAULT_FUEL_PRICES[
                (parsedState.values.fuelType ??
                  defaultValues.fuelType) as FuelType
              ],
            loanApr: parsedState.values.loanApr ?? DEFAULT_NEW_CAR_APR,
            includeFinancing: parsedState.values.includeFinancing ?? 0,
          });
          setRecurringType(parsedState.recurringType);
          setTripType(parsedState.tripType ?? "oneWay");
          setSelectedSource(parsedState.selectedSource ?? "default");
          setSelectedTemplateId(parsedState.selectedTemplateId ?? null);
          if (
            parsedState.selectedSource === "template" &&
            parsedState.selectedTemplateId
          ) {
            setStartupTemplateId(parsedState.selectedTemplateId);
          }

          const savedAt = parsedState.updatedAt
            ? new Date(parsedState.updatedAt).getTime()
            : Number.NaN;
          const isRecentSession =
            Number.isFinite(savedAt) && Date.now() - savedAt <= STALE_STATE_MS;

          setHasResolvedStartupChoice(true);

          if (!isRecentSession) {
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
    if (!hasResolvedStartupChoice) {
      return;
    }

    const nextState: PersistedCarCostState = {
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

  const handleChange =
    (name: keyof CarCostValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number(event.target.value);
      setValues((current) => ({
        ...current,
        [name]: Number.isNaN(nextValue) ? 0 : nextValue,
      }));
    };

  const handleToggleChange =
    (
      name:
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

    const plannerValues = getPlannerValues(values);
    applySelection(
      "template",
      applyPlannerValues(matchingTemplate.values, plannerValues),
      recurringType,
      matchingTemplate.id,
    );
  };

  const handleTemplateSwitch = (nextValue: string) => {
    const plannerValues = getPlannerValues(values);
    if (nextValue === "custom") {
      if (!savedCustomVehicle) {
        return;
      }
      setSelectedSource("custom");
      setSelectedTemplateId("custom");
      setValues(applyPlannerValues(savedCustomVehicle.values, plannerValues));
      return;
    }

    const template = typedTemplates.find((item) => item.id === nextValue);
    if (!template) {
      return;
    }

    setSelectedSource("template");
    setSelectedTemplateId(template.id);
    setValues(applyPlannerValues(template.values, plannerValues));
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
    const nextBasis = event.target.value as CarCostValues["miscMaintenanceBasis"];
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
      values: {
        ...defaultValues,
        fuelType: customVehicleDraft.fuelType,
        fuelUnitPrice: DEFAULT_FUEL_PRICES[customVehicleDraft.fuelType],
      },
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

  const calculations = useMemo(() => {
    const tripMultiplier = tripType === "oneWay" ? 2 : 1;
    const selectedTripDistance = values.tripDistance * tripMultiplier;
    const fuelCostPerMile =
      values.fuelEfficiency > 0
        ? values.fuelUnitPrice / values.fuelEfficiency
        : 0;
    const oilCostPerMile =
      values.oilChangeInterval > 0
        ? values.oilChangeCost / values.oilChangeInterval
        : 0;
    const tireCostPerMile =
      values.tireInterval > 0 ? values.tireCost / values.tireInterval : 0;
    const depreciationCostPerMile =
      isToggleEnabled(values.includeDepreciation) &&
      values.depreciationInterval > 0
        ? Math.max(values.purchasePrice - values.resaleValue, 0) /
          values.depreciationInterval
        : 0;

    const annualMileageByType: Record<RecurringType, number> = {
      day: values.recurringMiles * 365,
      week: values.recurringMiles * 52,
      month: values.recurringMiles * 12,
      year: values.recurringMiles,
      weekday: values.recurringMiles * 5 * 52,
    };

    const annualMileage = annualMileageByType[recurringType];
    const miscCostPerMile =
      values.miscMaintenanceInterval > 0
        ? values.miscMaintenanceBasis === "miles"
          ? values.miscMaintenanceCost / values.miscMaintenanceInterval
          : annualMileage > 0
            ? (values.miscMaintenanceCost *
                (values.miscMaintenanceBasis === "month"
                  ? 12 / values.miscMaintenanceInterval
                  : 1 / values.miscMaintenanceInterval)) /
              annualMileage
            : 0
        : 0;
    const variableCostPerMile =
      fuelCostPerMile +
      oilCostPerMile +
      tireCostPerMile +
      miscCostPerMile +
      depreciationCostPerMile;
    const annualFixedCosts = isToggleEnabled(values.includeAnnualOwnership)
      ? values.annualInsurance +
        values.annualRegistration +
        values.annualParking +
        values.annualInspection +
        values.annualRoadside
      : 0;
    const annualFinanceCost = isToggleEnabled(values.includeFinancing)
      ? values.purchasePrice * (values.loanApr / 100)
      : 0;
    const fixedCostPerMile =
      annualMileage > 0 ? annualFixedCosts / annualMileage : 0;
    const financeCostPerMile =
      annualMileage > 0 ? annualFinanceCost / annualMileage : 0;
    const trueCostPerMile =
      variableCostPerMile + fixedCostPerMile + financeCostPerMile;
    const tripCost = selectedTripDistance * trueCostPerMile;
    const recurringDrivingCosts = {
      day: (annualMileage * variableCostPerMile) / 365,
      week: (annualMileage * variableCostPerMile) / 52,
      month: (annualMileage * variableCostPerMile) / 12,
      year: annualMileage * variableCostPerMile,
    };
    const recurringTrueCosts = {
      day: recurringDrivingCosts.day + annualFixedCosts / 365 + annualFinanceCost / 365,
      week: recurringDrivingCosts.week + annualFixedCosts / 52 + annualFinanceCost / 52,
      month:
        recurringDrivingCosts.month + annualFixedCosts / 12 + annualFinanceCost / 12,
      year: recurringDrivingCosts.year + annualFixedCosts + annualFinanceCost,
    };

    return {
      fuelCostPerMile,
      oilCostPerMile,
      tireCostPerMile,
      miscCostPerMile,
      depreciationCostPerMile,
      variableCostPerMile,
      annualMileage,
      annualFixedCosts,
      annualFinanceCost,
      fixedCostPerMile,
      financeCostPerMile,
      trueCostPerMile,
      selectedTripDistance,
      tripCost,
      recurringDrivingCosts,
      recurringTrueCosts,
    };
  }, [recurringType, tripType, values]);

  const recurringMilesByPeriod: Record<RecurringType, number> = useMemo(
    () => ({
      day: calculations.annualMileage / 365,
      week: calculations.annualMileage / 52,
      month: calculations.annualMileage / 12,
      year: calculations.annualMileage,
      weekday: calculations.annualMileage / 260,
    }),
    [calculations.annualMileage],
  );

  const recurringOwnershipByPeriod: Record<RecurringType, number> = useMemo(
    () => ({
      day: calculations.annualFixedCosts / 365,
      week: calculations.annualFixedCosts / 52,
      month: calculations.annualFixedCosts / 12,
      year: calculations.annualFixedCosts,
      weekday: calculations.annualFixedCosts / 260,
    }),
    [calculations.annualFixedCosts],
  );

  const recurringFinanceByPeriod: Record<RecurringType, number> = useMemo(
    () => ({
      day: calculations.annualFinanceCost / 365,
      week: calculations.annualFinanceCost / 52,
      month: calculations.annualFinanceCost / 12,
      year: calculations.annualFinanceCost,
      weekday: calculations.annualFinanceCost / 260,
    }),
    [calculations.annualFinanceCost],
  );

  const breakdownModes: CostBreakdownViewerMode[] = useMemo(() => {
    const colors = {
      fuel: "#b85c38",
      oil: "#d47a4d",
      tires: "#8f633c",
      misc: "#d9a15d",
      depreciation: "#6f8f72",
      ownership: "#4f6d7a",
      financing: "#8a5f8f",
    };

    const buildItems = (
      fuel: number,
      oil: number,
      tires: number,
      misc: number,
      depreciation: number,
      ownership: number,
      financing: number,
    ) =>
      [
        { label: "Fuel", value: fuel, color: colors.fuel },
        { label: "Oil changes", value: oil, color: colors.oil },
        { label: "Tires", value: tires, color: colors.tires },
        { label: "Misc. maintenance", value: misc, color: colors.misc },
        {
          label: "Depreciation",
          value: depreciation,
          color: colors.depreciation,
        },
        {
          label: "Ownership overhead",
          value: ownership,
          color: colors.ownership,
        },
        {
          label: "Financing",
          value: financing,
          color: colors.financing,
        },
      ].filter((item) => item.value > 0);

    const recurringModeMeta: Record<
      "day" | "week" | "month" | "year",
      { label: string; description: string; unitLabel: string }
    > = {
      day: {
        label: "Day",
        description:
          "See how each category contributes to one day of driving using your recurring miles assumption.",
        unitLabel: "per day",
      },
      week: {
        label: "Week",
        description:
          "See how each category contributes to one week of driving based on your recurring miles setup.",
        unitLabel: "per week",
      },
      month: {
        label: "Month",
        description:
          "See how each category contributes to one month of driving using the annualized mileage assumption.",
        unitLabel: "per month",
      },
      year: {
        label: "Year",
        description:
          "See how each category contributes across a full year, including annual ownership costs.",
        unitLabel: "per year",
      },
    };

    const recurringModes = (["day", "week", "month", "year"] as const).map(
      (key) => {
        const miles = recurringMilesByPeriod[key];
        const ownership = recurringOwnershipByPeriod[key];
        const financing = recurringFinanceByPeriod[key];

        return {
          key,
          label: recurringModeMeta[key].label,
          description: recurringModeMeta[key].description,
          unitLabel: recurringModeMeta[key].unitLabel,
          total: calculations.recurringTrueCosts[key],
          items: buildItems(
            calculations.fuelCostPerMile * miles,
            calculations.oilCostPerMile * miles,
            calculations.tireCostPerMile * miles,
            calculations.miscCostPerMile * miles,
            calculations.depreciationCostPerMile * miles,
            ownership,
            financing,
          ),
        };
      },
    );

    return [
      {
        key: "mile",
        label: "Per mile",
        description:
          "This is the baseline view of how much each category contributes to every mile driven.",
        unitLabel: "per mile",
        total: calculations.trueCostPerMile,
        items: buildItems(
          calculations.fuelCostPerMile,
          calculations.oilCostPerMile,
          calculations.tireCostPerMile,
          calculations.miscCostPerMile,
          calculations.depreciationCostPerMile,
          calculations.fixedCostPerMile,
          calculations.financeCostPerMile,
        ),
      },
      {
        key: "trip",
        label: "Trip",
        description: `This allocates the selected trip distance of ${calculations.selectedTripDistance.toFixed(
          0,
        )} miles across fuel, maintenance, depreciation, and ownership overhead.`,
        unitLabel: `${calculations.selectedTripDistance.toFixed(0)} mi trip`,
        total: calculations.tripCost,
        items: buildItems(
          calculations.fuelCostPerMile * calculations.selectedTripDistance,
          calculations.oilCostPerMile * calculations.selectedTripDistance,
          calculations.tireCostPerMile * calculations.selectedTripDistance,
          calculations.miscCostPerMile * calculations.selectedTripDistance,
          calculations.depreciationCostPerMile *
            calculations.selectedTripDistance,
          calculations.fixedCostPerMile * calculations.selectedTripDistance,
          calculations.financeCostPerMile * calculations.selectedTripDistance,
        ),
      },
      ...recurringModes,
    ];
  }, [
    calculations.depreciationCostPerMile,
    calculations.fixedCostPerMile,
    calculations.financeCostPerMile,
    calculations.fuelCostPerMile,
    calculations.miscCostPerMile,
    calculations.oilCostPerMile,
    calculations.recurringTrueCosts,
    calculations.selectedTripDistance,
    calculations.tireCostPerMile,
    calculations.tripCost,
    calculations.trueCostPerMile,
    recurringMilesByPeriod,
    recurringFinanceByPeriod,
    recurringOwnershipByPeriod,
  ]);

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

  const summaryCards = [
    { label: "Fuel", value: calculations.fuelCostPerMile },
    { label: "Oil changes", value: calculations.oilCostPerMile },
    { label: "Tires", value: calculations.tireCostPerMile },
    { label: "Misc. maintenance", value: calculations.miscCostPerMile },
    { label: "Depreciation", value: calculations.depreciationCostPerMile },
    { label: "Ownership overhead", value: calculations.fixedCostPerMile },
    { label: "Financing", value: calculations.financeCostPerMile },
    {
      label: "True cost per mile",
      value: calculations.trueCostPerMile,
      highlight: true,
    },
  ].filter((card) => card.highlight || card.value > 0);

  const primarySummaryCard =
    summaryCards.find((card) => card.highlight) ?? summaryCards[0];
  const secondarySummaryCards = summaryCards.filter((card) => !card.highlight);

  const templateOptions = [
    ...(savedCustomVehicle
      ? [{ id: "custom", title: `My vehicle: ${savedCustomVehicle.title}` }]
      : []),
    ...typedTemplates.map((template) => ({
      id: template.id,
      title: `${template.year} ${template.make} ${template.model}`,
    })),
  ];

  const currentVehicleLabel =
    selectedSource === "custom"
      ? (savedCustomVehicle?.title ?? "Your vehicle")
      : (() => {
          const matchingTemplate = typedTemplates.find(
            (template) => template.id === selectedTemplateId,
          );
          return matchingTemplate
            ? `${matchingTemplate.year} ${matchingTemplate.make} ${matchingTemplate.model}`
            : "Vehicle template";
        })();

  const recurringBreakdownMode: BreakdownMode =
    recurringType === "weekday" ? "day" : recurringType;

  const fuelEfficiencyLabel =
    values.fuelType === "electric"
      ? "Efficiency (mi/kWh)"
      : "Fuel mileage (MPG)";
  const fuelPriceLabel =
    values.fuelType === "electric"
      ? "Electricity cost per kWh"
      : `${FUEL_TYPE_LABELS[values.fuelType]} cost per gallon`;
  const fuelPriceTooltip = `Fuel price was set from current ${FUEL_TYPE_LABELS[
    values.fuelType
  ].toLowerCase()} pricing at ${formatCurrency(values.fuelUnitPrice)} per ${
    values.fuelType === "electric" ? "kWh" : "gallon"
  }.`;
  const depreciationIntervalTooltip =
    "Enter the number of miles over which you expect the vehicle to lose the value between purchase price and resale value. The calculator uses (purchase price - resale value) divided by this mileage interval to estimate depreciation cost per mile.";
  const parkingTooltip =
    "Most people do not have this cost, but some do in dense urban settings. It is treated as part of annual ownership cost rather than a mileage-based expense.";

  const solidPrimaryButtonStyle: React.CSSProperties = {
    marginTop: "1rem",
    backgroundColor: "var(--primary-color)",
    color: "#ffffff",
    opacity: 1,
    filter: "none",
  };

  const solidSecondaryButtonStyle: React.CSSProperties = {
    backgroundColor: "var(--secondary-color)",
    color: "#ffffff",
    opacity: 1,
    filter: "none",
    whiteSpace: "nowrap",
  };

  const tripTypeButtonStyle = (isActive: boolean): React.CSSProperties => ({
    borderRadius: "999px",
    border: isActive ? "none" : palette.softBorder,
    background: isActive ? palette.accent : "transparent",
    color: isActive ? "#ffffff" : palette.text,
    textTransform: "none",
    fontWeight: 600,
    minWidth: "unset",
    padding: "0 1rem",
    boxShadow: "none",
  });

  const insights: InsightCardData[] = (
    insightsMetadata as InsightDefinition[]
  ).map((item) => {
    const difference = calculations.trueCostPerMile - item.benchmark;
    const isAbove = difference > 0;

    return {
      ...item,
      isAbove,
      currentRate: calculations.trueCostPerMile,
      headline:
        difference === 0
          ? `Right in line with ${item.label.toLowerCase()}`
          : `${formatCurrency(Math.abs(difference))} per mile ${
              isAbove ? "above" : "below"
            } ${item.label.toLowerCase()}`,
    };
  });

  const modalInsights = breakdownInsightCategory
    ? insights.filter((insight) =>
        insight.associatedCategories.includes(breakdownInsightCategory),
      )
    : [];

  return (
    <div className="container flow-text" style={{ paddingBottom: "3rem" }}>
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
      <div id="car-cost-restore-modal" className="modal" ref={modalRef}>
        <div
          className="modal-content"
          style={{
            background: palette.panelBackground,
            color: palette.text,
          }}
        >
          <h4>Choose how you want to get started</h4>
          <p
            style={{
              color: palette.muted,
              display: isMobileView ? "none" : "block",
            }}
          >
            You can load a presaved template, or enter your own car and begin
            with a fresh calculator state.
          </p>
          <div className="row" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
            <div className="col s12 l6" style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  ...cardStyle,
                  padding: "1.25rem",
                  height: "100%",
                  background: palette.subtlePanel,
                }}
              >
                <h5 style={{ marginTop: 0 }}>Use a presaved template</h5>
                <p
                  style={{
                    color: palette.muted,
                    fontSize: "0.9rem",
                    lineHeight: 1.45,
                  }}
                >
                  Pick one of the built-in vehicles to see how the calculator
                  behaves with realistic sample values.
                </p>
                <label
                  htmlFor="startupTemplate"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "0.45rem",
                  }}
                >
                  Example vehicle
                </label>
                <div style={{ ...inputContainerStyle, position: "relative" }}>
                  <select
                    id="startupTemplate"
                    className="browser-default"
                    value={startupTemplateId}
                    onChange={(event) =>
                      setStartupTemplateId(event.target.value)
                    }
                    style={{ ...selectStyle, paddingRight: "2.75rem" }}
                  >
                    {typedTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.year} {template.make} {template.model}
                      </option>
                    ))}
                  </select>
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      right: "1rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: palette.muted,
                      fontSize: "0.85rem",
                      pointerEvents: "none",
                    }}
                  >
                    ▼
                  </span>
                </div>
                <button
                  type="button"
                  className="waves-effect waves-light btn primaryColor"
                  onClick={handleLoadStartupTemplate}
                  style={solidPrimaryButtonStyle}
                >
                  Use this vehicle
                </button>
              </div>
            </div>

            <div className="col s12 l6" style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  ...cardStyle,
                  padding: "1.25rem",
                  height: "100%",
                  background: palette.subtlePanel,
                }}
              >
                <h5 style={{ marginTop: 0 }}>Check with my own car</h5>
                <p
                  style={{
                    color: palette.muted,
                    fontSize: "0.9rem",
                    lineHeight: 1.45,
                  }}
                >
                  Enter your vehicle details to begin with a fresh state tied to
                  your own car.
                </p>
                <div className="row" style={{ marginBottom: 0 }}>
                  <div className="col s12">
                    <label
                      htmlFor="customVehicleYear"
                      style={{
                        display: "block",
                        fontWeight: 600,
                        marginBottom: "0.45rem",
                      }}
                    >
                      Year
                    </label>
                    <div
                      style={
                        showCustomVehicleValidation &&
                        customVehicleTouched.year &&
                        customVehicleFieldErrors.year
                          ? invalidInputContainerStyle
                          : inputContainerStyle
                      }
                    >
                      <input
                        id="customVehicleYear"
                        type="number"
                        min="1886"
                        max={`${currentModelYear}`}
                        step="1"
                        value={customVehicleDraft.year}
                        onChange={handleCustomVehicleDraftChange("year")}
                        onBlur={handleCustomVehicleFieldBlur("year")}
                        onFocus={handleNumericInputFocus}
                        placeholder="2020"
                        style={inputStyle}
                        className="car-cost-placeholder"
                      />
                    </div>
                    {showCustomVehicleValidation &&
                    customVehicleTouched.year &&
                    customVehicleFieldErrors.year ? (
                      <small
                        style={{
                          display: "block",
                          color: "#c44949",
                          marginTop: "0.35rem",
                        }}
                      >
                        {customVehicleFieldErrors.year}
                      </small>
                    ) : null}
                  </div>
                  <div className="col s12 m6">
                    <label
                      htmlFor="customVehicleMake"
                      style={{
                        display: "block",
                        fontWeight: 600,
                        marginBottom: "0.45rem",
                      }}
                    >
                      Make
                    </label>
                    <div
                      style={
                        showCustomVehicleValidation &&
                        customVehicleTouched.make &&
                        customVehicleFieldErrors.make
                          ? invalidInputContainerStyle
                          : inputContainerStyle
                      }
                    >
                      <input
                        id="customVehicleMake"
                        type="text"
                        value={customVehicleDraft.make}
                        onChange={handleCustomVehicleDraftChange("make")}
                        onBlur={handleCustomVehicleFieldBlur("make")}
                        placeholder="Toyota"
                        style={inputStyle}
                        className="car-cost-placeholder"
                      />
                    </div>
                    {showCustomVehicleValidation &&
                    customVehicleTouched.make &&
                    customVehicleFieldErrors.make ? (
                      <small
                        style={{
                          display: "block",
                          color: "#c44949",
                          marginTop: "0.35rem",
                        }}
                      >
                        {customVehicleFieldErrors.make}
                      </small>
                    ) : null}
                  </div>
                  <div className="col s12 m6">
                    <label
                      htmlFor="customVehicleModel"
                      style={{
                        display: "block",
                        fontWeight: 600,
                        marginBottom: "0.45rem",
                      }}
                    >
                      Model
                    </label>
                    <div
                      style={
                        showCustomVehicleValidation &&
                        customVehicleTouched.model &&
                        customVehicleFieldErrors.model
                          ? invalidInputContainerStyle
                          : inputContainerStyle
                      }
                    >
                      <input
                        id="customVehicleModel"
                        type="text"
                        value={customVehicleDraft.model}
                        onChange={handleCustomVehicleDraftChange("model")}
                        onBlur={handleCustomVehicleFieldBlur("model")}
                        placeholder="Camry"
                        style={inputStyle}
                        className="car-cost-placeholder"
                      />
                    </div>
                    {showCustomVehicleValidation &&
                    customVehicleTouched.model &&
                    customVehicleFieldErrors.model ? (
                      <small
                        style={{
                          display: "block",
                          color: "#c44949",
                          marginTop: "0.35rem",
                        }}
                      >
                        {customVehicleFieldErrors.model}
                      </small>
                    ) : null}
                  </div>
                  <div className="col s12">
                    <label
                      htmlFor="customVehicleFuelType"
                      style={{
                        display: "block",
                        fontWeight: 600,
                        marginBottom: "0.45rem",
                      }}
                    >
                      Fuel type
                    </label>
                    <div
                      style={{ ...inputContainerStyle, position: "relative" }}
                    >
                      <select
                        id="customVehicleFuelType"
                        className="browser-default"
                        value={customVehicleDraft.fuelType}
                        onChange={(event) =>
                          setCustomVehicleDraft((current) => ({
                            ...current,
                            fuelType: event.target.value as FuelType,
                          }))
                        }
                        style={{ ...selectStyle, paddingRight: "2.75rem" }}
                      >
                        <option value="regular">Regular</option>
                        <option value="midgrade">Midgrade</option>
                        <option value="premium">Premium</option>
                        <option value="diesel">Diesel</option>
                        <option value="e85">E85</option>
                        <option value="cng">CNG</option>
                        <option value="lpg">LPG</option>
                        <option value="electric">Electric</option>
                      </select>
                      <span
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          right: "1rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: palette.muted,
                          fontSize: "0.85rem",
                          pointerEvents: "none",
                        }}
                      >
                        ▼
                      </span>
                    </div>
                  </div>
                </div>
                <p
                  style={{
                    color: palette.muted,
                    fontSize: "0.92rem",
                    margin: "0.5rem 0 0",
                  }}
                >
                  Year must be between 1886 and {currentModelYear}.
                </p>
                {showCustomVehicleValidation && !isCustomVehicleValid ? (
                  <p
                    style={{
                      color: "#c44949",
                      fontSize: "0.88rem",
                      margin: "0.5rem 0 0",
                    }}
                  >
                    {customVehicleValidationMessage}
                  </p>
                ) : null}
                <div
                  onMouseDown={() => {
                    if (!isCustomVehicleValid) {
                      setCustomVehicleTouched({
                        year: true,
                        make: true,
                        model: true,
                      });
                      setShowCustomVehicleValidation(true);
                    }
                  }}
                  onTouchStart={() => {
                    if (!isCustomVehicleValid) {
                      setCustomVehicleTouched({
                        year: true,
                        make: true,
                        model: true,
                      });
                      setShowCustomVehicleValidation(true);
                    }
                  }}
                >
                  <button
                    type="button"
                    className="waves-effect waves-light btn primaryColor"
                    onClick={handleStartWithOwnCar}
                    disabled={!isCustomVehicleValid}
                    style={{
                      ...solidPrimaryButtonStyle,
                      opacity: isCustomVehicleValid ? 1 : 0.65,
                    }}
                  >
                    Use my vehicle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className="modal-footer"
          style={{
            background: palette.panelBackground,
            borderTop: palette.border,
          }}
        />
      </div>

      <div
        id="car-cost-breakdown-modal"
        className="modal modal-fixed-footer"
        ref={breakdownModalRef}
      >
        <div
          className="modal-content"
          style={{
            background: palette.panelBackground,
            color: palette.text,
          }}
        >
          <CostBreakdownViewer
            key={`${breakdownModalMode}-${breakdownModalModes.join("-")}`}
            title={breakdownModalTitle}
            subtitle="Use the interval controls to compare how the same costs allocate across a mile, trip, or recurring driving window."
            modes={filteredBreakdownModalModes}
            initialMode={breakdownModalMode}
            palette={{
              text: palette.text,
              muted: palette.muted,
              accent: palette.accent,
              border: palette.border,
              chartBase: palette.chartBase,
              chartCenter: palette.chartCenter,
              tooltipBackground: palette.tooltipBackground,
              shadow: palette.shadow,
              cardBackground: palette.cardBackground,
            }}
            cardStyle={cardStyle}
            autoCycle={false}
            subtitleFontSize="0.92rem"
          />
          {modalInsights.length > 0 ? (
            <div style={{ marginTop: "1.5rem" }}>
              <InsightsSection
                insights={modalInsights}
                cardStyle={cardStyle}
                isDarkMode={isDarkMode}
                mutedColor={palette.muted}
                title="Related insights"
              />
            </div>
          ) : null}
        </div>
        <div
          className="modal-footer"
          style={{
            background: palette.panelBackground,
            borderTop: palette.border,
          }}
        >
          <button
            type="button"
            className="modal-close waves-effect btn-flat"
            style={{
              color: palette.accentDark,
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            Close
          </button>
        </div>
      </div>

      <div
        style={{
          background: palette.shellBackground,
          borderRadius: "32px",
          padding: "2rem",
          marginTop: "1rem",
          color: palette.text,
        }}
      >
        <div
          style={{
            ...cardStyle,
            position: "sticky",
            top: `${stickyTop}px`,
            zIndex: 20,
            padding: "1rem 1.2rem",
            marginBottom: "1.5rem",
            background: palette.panelBackground,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              alignItems: isMobileView ? "center" : "end",
            }}
          >
            {!isMobileView ? (
              <div style={{ flex: "1 1 260px" }}>
                <span
                  style={{
                    display: "block",
                    color: palette.muted,
                    fontSize: "0.85rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  Selected vehicle
                </span>
                <strong style={{ display: "block", fontSize: "1.15rem" }}>
                  {currentVehicleLabel}
                </strong>
              </div>
            ) : null}
            <div style={{ flex: isMobileView ? "1 1 0" : "1 1 280px" }}>
              {!isMobileView ? (
                <label
                  htmlFor="vehicleTemplateSwitcher"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "0.45rem",
                  }}
                >
                  Switch vehicle
                </label>
              ) : null}
              <div style={{ ...inputContainerStyle, position: "relative" }}>
                <select
                  id="vehicleTemplateSwitcher"
                  className="browser-default"
                  value={
                    selectedSource === "custom"
                      ? "custom"
                      : (selectedTemplateId ?? typedTemplates[0]?.id ?? "")
                  }
                  onChange={(event) => handleTemplateSwitch(event.target.value)}
                  style={{ ...selectStyle, paddingRight: "2.75rem" }}
                >
                  {templateOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: palette.muted,
                    fontSize: "0.85rem",
                    pointerEvents: "none",
                  }}
                >
                  ▼
                </span>
              </div>
            </div>
            <div style={{ flex: "0 0 auto" }}>
              <button
                type="button"
                className="waves-effect waves-light btn secondaryColor"
                onClick={handleOpenOwnCarModal}
                style={solidSecondaryButtonStyle}
              >
                {isMobileView ? "Use my own" : "Start over"}
              </button>
            </div>
            <div
              style={{
                flex: "0 0 auto",
                padding: "0.32rem 0.65rem",
                borderRadius: "999px",
                background: palette.resultHighlight,
                border: palette.softBorder,
                minWidth: "unset",
              }}
              className="tooltipped"
              data-position="bottom"
              data-tooltip={`True cost per mile: ${formatCurrency(
                calculations.trueCostPerMile,
              )} per mile`}
            >
              <strong
                style={{
                  fontSize: "0.84rem",
                  lineHeight: 1,
                  display: "block",
                  whiteSpace: "nowrap",
                }}
              >
                {formatCurrency(calculations.trueCostPerMile)}/mi
              </strong>
            </div>
          </div>
        </div>

        <div className="row" style={{ marginBottom: 0 }}>
          <div className="col s12 l7" style={{ marginBottom: "1rem" }}>
            <p
              style={{
                margin: 0,
                color: palette.accentDark,
                fontSize: "0.85rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Vehicle Cost Calculator
            </p>
            <h2
              style={{
                margin: "0.6rem 0 0",
                fontSize: "clamp(2.2rem, 4vw, 4rem)",
                lineHeight: 1,
              }}
            >
              Estimate what your vehicle really costs per mile.
            </h2>
            <p style={{ color: palette.muted, lineHeight: 1.6 }}>
              Plug in fuel, maintenance, tires, depreciation, and yearly
              ownership costs to get a clearer picture of what driving really
              costs.
            </p>
            <div
              style={{
                ...cardStyle,
                marginTop: "1.25rem",
                padding: "1.25rem 1.5rem",
                background: palette.panelBackground,
                boxShadow: palette.missionShadow,
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: "1.2rem" }}>
                Why I built this
              </h3>
              <p style={{ color: palette.muted, lineHeight: 1.65 }}>
                I built this to help people understand the true cost of driving
                their vehicle. Most people focus on fuel first, and while that
                is a major part of the equation, it often does not tell the full
                story.
              </p>
              <p
                style={{
                  color: palette.muted,
                  lineHeight: 1.65,
                  marginBottom: 0,
                }}
              >
                That gap matters even more in the gig economy, where drivers may
                overestimate their real profit, and for families deciding
                whether it makes more sense to take their daily driver or rent a
                vehicle for a longer trip.
              </p>
            </div>
          </div>

          <div className="col s12 l5" style={{ marginBottom: "1rem" }}>
            <article
              style={{
                ...cardStyle,
                ...stackedCardStyle,
                padding: "1.05rem 1.2rem",
                color: "#fff",
                background: palette.summaryHighlight,
              }}
            >
              <span
                style={{
                  display: "block",
                  color: "rgba(255,255,255,0.82)",
                  marginBottom: "0.3rem",
                }}
              >
                {primarySummaryCard.label}
              </span>
              <strong style={{ fontSize: "2.1rem", lineHeight: 1 }}>
                {formatCurrency(primarySummaryCard.value)}
              </strong>
              <small
                style={{
                  display: "block",
                  marginTop: "0.3rem",
                  color: "rgba(255,255,255,0.82)",
                }}
              >
                per mile
              </small>
            </article>

            {!isMobileView ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "0.8rem",
                }}
              >
                {secondarySummaryCards.map((card) => (
                  <article
                    key={card.label}
                    style={{
                      ...cardStyle,
                      padding: "0.85rem 0.95rem",
                      minHeight: "96px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        color: palette.muted,
                        marginBottom: "0.25rem",
                        fontSize: "0.88rem",
                        lineHeight: 1.25,
                      }}
                    >
                      {card.label}
                    </span>
                    <strong
                      style={{
                        display: "block",
                        fontSize: "1.35rem",
                        lineHeight: 1.05,
                      }}
                    >
                      {formatCurrency(card.value)}
                    </strong>
                    <small
                      style={{
                        display: "block",
                        marginTop: "0.22rem",
                        color: palette.muted,
                        fontSize: "0.82rem",
                      }}
                    >
                      per mile
                    </small>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="row" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
          {sections.map((section) => (
            <div
              key={section.title}
              className="col s12 m6 xl4"
              style={{ marginBottom: "1rem" }}
            >
              <section
                style={{
                  ...cardStyle,
                  padding: "1.5rem",
                  height: "100%",
                  opacity:
                    section.title === "Vehicle cost" &&
                    !isToggleEnabled(values.includeDepreciation)
                      ? 0.58
                      : section.title === "Annual ownership costs" &&
                          !isToggleEnabled(values.includeAnnualOwnership)
                        ? 0.58
                        : section.title === "Vehicle cost" &&
                            !isToggleEnabled(values.includeFinancing) &&
                            !isToggleEnabled(values.includeDepreciation)
                        ? 0.58
                        : 1,
                }}
              >
                <h3 style={{ marginTop: 0 }}>{section.title}</h3>
                <p style={{ color: palette.muted, lineHeight: 1.5 }}>
                  {section.description}
                </p>
                {section.title === "Vehicle cost" ? (
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isToggleEnabled(values.includeDepreciation)}
                        onChange={handleToggleChange("includeDepreciation")}
                      />
                      <span style={{ color: palette.text }}>
                        Include depreciation
                      </span>
                    </label>
                  </div>
                ) : null}
                {section.title === "Annual ownership costs" ? (
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isToggleEnabled(values.includeAnnualOwnership)}
                        onChange={handleToggleChange("includeAnnualOwnership")}
                      />
                      <span style={{ color: palette.text }}>
                        Include annual ownership costs
                      </span>
                    </label>
                  </div>
                ) : null}
                {section.title === "Running costs" ? (
                  <div
                    style={{
                      display: "grid",
                      gap: "1rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div>
                      <label
                        htmlFor="fuelType"
                        style={{
                          display: "block",
                          fontWeight: 600,
                          marginBottom: "0.45rem",
                        }}
                      >
                        Fuel type
                      </label>
                      <div
                        style={{ ...inputContainerStyle, position: "relative" }}
                      >
                        <select
                          id="fuelType"
                          className="browser-default"
                          value={values.fuelType}
                          onChange={handleFuelTypeChange}
                          style={{ ...selectStyle, paddingRight: "2.75rem" }}
                        >
                          <option value="regular">Regular</option>
                          <option value="midgrade">Midgrade</option>
                          <option value="premium">Premium</option>
                          <option value="diesel">Diesel</option>
                          <option value="e85">E85</option>
                          <option value="cng">CNG</option>
                          <option value="lpg">LPG</option>
                          <option value="electric">Electric</option>
                        </select>
                        <span
                          aria-hidden="true"
                          style={{
                            position: "absolute",
                            right: "1rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: palette.muted,
                            fontSize: "0.85rem",
                            pointerEvents: "none",
                          }}
                        >
                          ▼
                        </span>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="fuelEfficiency"
                        style={{
                          display: "block",
                          fontWeight: 600,
                          marginBottom: "0.45rem",
                        }}
                      >
                        {fuelEfficiencyLabel}
                      </label>
                      <div style={inputContainerStyle}>
                        <input
                          id="fuelEfficiency"
                          type="number"
                          min="0"
                          step="0.1"
                          value={values.fuelEfficiency}
                          onChange={handleChange("fuelEfficiency")}
                          onFocus={handleNumericInputFocus}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="fuelUnitPrice"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.45rem",
                          fontWeight: 600,
                          marginBottom: "0.45rem",
                        }}
                      >
                        <span>{fuelPriceLabel}</span>
                        <i
                          className="material-icons tiny tooltipped"
                          data-position="top"
                          data-tooltip={fuelPriceTooltip}
                          style={{
                            color: "var(--secondary-color)",
                            cursor: "help",
                          }}
                        >
                          info_outline
                        </i>
                      </label>
                      <div style={inputContainerStyle}>
                        <span style={prefixStyle}>$</span>
                        <input
                          id="fuelUnitPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={values.fuelUnitPrice}
                          onChange={handleChange("fuelUnitPrice")}
                          onFocus={handleNumericInputFocus}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
                <div style={{ display: "grid", gap: "1rem" }}>
                  {section.items.map((field) => (
                    <div key={field.name}>
                      {field.name !== "loanApr" ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                            fontWeight: 600,
                            marginBottom: "0.45rem",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                            <span>
                              {field.name === "miscMaintenanceInterval"
                                ? values.miscMaintenanceBasis === "miles"
                                  ? "Misc. maintenance interval (miles)"
                                  : values.miscMaintenanceBasis === "month"
                                    ? "Misc. maintenance interval (months)"
                                    : "Misc. maintenance interval (years)"
                                : field.label}
                            </span>
                            {field.name === "depreciationInterval" ? (
                              <i
                                className="material-icons tiny tooltipped"
                                data-position="top"
                                data-tooltip={depreciationIntervalTooltip}
                                style={{
                                  color: "var(--secondary-color)",
                                  cursor: "help",
                                }}
                              >
                                info_outline
                              </i>
                            ) : null}
                            {field.name === "annualParking" ? (
                              <i
                                className="material-icons tiny tooltipped"
                                data-position="top"
                                data-tooltip={parkingTooltip}
                                style={{
                                  color: "var(--secondary-color)",
                                  cursor: "help",
                                }}
                              >
                                info_outline
                              </i>
                            ) : null}
                          </span>
                        </div>
                      ) : null}
                      {field.name === "loanApr" ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.85rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.45rem",
                              cursor: "pointer",
                              fontWeight: 500,
                              color: palette.text,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isToggleEnabled(values.includeFinancing)}
                              onChange={handleToggleChange("includeFinancing")}
                            />
                            <span>Vehicle is financed</span>
                          </label>
                          {isToggleEnabled(values.includeFinancing) ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.6rem",
                                flex: "1 1 240px",
                                minWidth: 0,
                              }}
                            >
                              <span
                                style={{
                                  color: palette.muted,
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                APR (%)
                              </span>
                              <div style={{ ...inputContainerStyle, flex: "1 1 auto" }}>
                                <input
                                  id={field.name}
                                  type="number"
                                  min="0"
                                  step={field.step}
                                  value={values[field.name]}
                                  onChange={handleChange(field.name)}
                                  onFocus={handleNumericInputFocus}
                                  style={inputStyle}
                                />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : field.name === "miscMaintenanceInterval" ? (
                        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)", gap: "0.75rem" }}>
                          <div>
                            <label
                              htmlFor="miscMaintenanceBasis"
                              style={{
                                display: "block",
                                color: palette.muted,
                                fontWeight: 500,
                                marginBottom: "0.35rem",
                                fontSize: "0.86rem",
                              }}
                            >
                              Based on
                            </label>
                            <div style={{ ...inputContainerStyle, position: "relative" }}>
                              <select
                                id="miscMaintenanceBasis"
                                className="browser-default"
                                value={values.miscMaintenanceBasis}
                                onChange={handleMiscMaintenanceBasisChange}
                                style={{ ...selectStyle, paddingRight: "2.75rem" }}
                              >
                                <option value="miles">Miles</option>
                                <option value="month">Months</option>
                                <option value="year">Years</option>
                              </select>
                              <span
                                aria-hidden="true"
                                style={{
                                  position: "absolute",
                                  right: "1rem",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  color: palette.muted,
                                  fontSize: "0.85rem",
                                  pointerEvents: "none",
                                }}
                              >
                                ▼
                              </span>
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor={field.name}
                              style={{
                                display: "block",
                                color: palette.muted,
                                fontWeight: 500,
                                marginBottom: "0.35rem",
                                fontSize: "0.86rem",
                              }}
                            >
                              Every
                            </label>
                            <div style={inputContainerStyle}>
                              <input
                                id={field.name}
                                type="number"
                                min="0"
                                step={field.step}
                                value={values[field.name]}
                                onChange={handleChange(field.name)}
                                onFocus={handleNumericInputFocus}
                                style={inputStyle}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={inputContainerStyle}>
                          {field.prefix ? (
                            <span style={prefixStyle}>{field.prefix}</span>
                          ) : null}
                          <input
                            id={field.name}
                            type="number"
                            min="0"
                            step={field.step}
                            value={values[field.name]}
                            onChange={handleChange(field.name)}
                            onFocus={handleNumericInputFocus}
                            disabled={
                              (section.title === "Vehicle cost" &&
                                !isToggleEnabled(values.includeDepreciation)) ||
                              (section.title === "Annual ownership costs" &&
                                !isToggleEnabled(values.includeAnnualOwnership))
                            }
                            style={inputStyle}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ))}
        </div>

        <div className="row" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
          <div className="col s12 xl6" style={{ marginBottom: "1rem" }}>
            <section
              style={{ ...cardStyle, padding: "1.5rem", height: "100%" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  marginBottom: "0.35rem",
                }}
              >
                <h3 style={{ margin: 0 }}>Trip estimate</h3>
                <button
                  type="button"
                  className="btn-flat"
                  onClick={() =>
                    openBreakdownModal(
                      "trip",
                      "Trip cost breakdown",
                      ["mile", "trip"],
                      "tripEstimate",
                    )
                  }
                  style={{
                    color: palette.accentDark,
                    fontWeight: 700,
                    textTransform: "none",
                    padding: "0 0.5rem",
                  }}
                >
                  <i
                    className="material-icons left"
                    style={{
                      marginRight: "0.3rem",
                      fontSize: "1.1rem",
                      lineHeight: "inherit",
                    }}
                  >
                    open_in_full
                  </i>
                  See more
                </button>
              </div>
              <p style={{ color: palette.muted, lineHeight: 1.5 }}>
                Multiply your true cost per mile by a route distance to estimate
                the total cost of the trip.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "0.65rem",
                  flexWrap: "wrap",
                  marginBottom: "1rem",
                }}
              >
                <button
                  type="button"
                  className="btn-flat"
                  onClick={() => setTripType("oneWay")}
                  style={tripTypeButtonStyle(tripType === "oneWay")}
                >
                  One way
                </button>
                <button
                  type="button"
                  className="btn-flat"
                  onClick={() => setTripType("roundTrip")}
                  style={tripTypeButtonStyle(tripType === "roundTrip")}
                >
                  Round trip
                </button>
              </div>
              <label
                htmlFor="tripDistance"
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: "0.45rem",
                }}
              >
                {tripType === "roundTrip"
                  ? "Round trip distance (miles)"
                  : "One-way trip distance (miles)"}
              </label>
              <div style={inputContainerStyle}>
                <input
                  id="tripDistance"
                  type="number"
                  min="0"
                  step="1"
                  value={values.tripDistance}
                  onChange={handleChange("tripDistance")}
                  onFocus={handleNumericInputFocus}
                  style={inputStyle}
                />
              </div>
              <div
                style={{
                  marginTop: "1.25rem",
                  padding: "1.25rem",
                  borderRadius: "18px",
                  background: palette.resultHighlight,
                }}
              >
                <span style={{ display: "block", color: palette.muted }}>
                  Total trip cost
                </span>
                <strong
                  style={{
                    display: "block",
                    fontSize: "2rem",
                    lineHeight: 1.1,
                  }}
                >
                  {formatCurrency(calculations.tripCost)}
                </strong>
                <small
                  style={{
                    display: "block",
                    color: palette.muted,
                    marginTop: "0.4rem",
                  }}
                >
                  {calculations.selectedTripDistance.toFixed(0)} miles at{" "}
                  {formatCurrency(calculations.trueCostPerMile)} per mile
                </small>
                <p style={{ margin: "0.6rem 0 0", color: palette.muted }}>
                  {tripType === "roundTrip"
                    ? `Round trip uses your selected total distance of ${values.tripDistance.toFixed(0)} miles.`
                    : `One-way distance is doubled to estimate the full there-and-back trip (${values.tripDistance.toFixed(0)} miles each way).`}
                </p>
                <p style={{ margin: "0.35rem 0 0", color: palette.muted }}>
                  Variable-only trip cost:{" "}
                  {formatCurrency(
                    calculations.selectedTripDistance *
                      calculations.variableCostPerMile,
                  )}
                </p>
              </div>
            </section>
          </div>

          <div className="col s12 xl6" style={{ marginBottom: "1rem" }}>
            <section
              style={{ ...cardStyle, padding: "1.5rem", height: "100%" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  marginBottom: "0.35rem",
                }}
              >
                <h3 style={{ margin: 0 }}>Recurring driving totals</h3>
                <button
                  type="button"
                  className="btn-flat"
                  onClick={() =>
                    openBreakdownModal(
                      recurringBreakdownMode,
                      "Recurring cost breakdown",
                      ["mile", "day", "week", "month", "year"],
                      "recurringDrivingTotals",
                    )
                  }
                  style={{
                    color: palette.accentDark,
                    fontWeight: 700,
                    textTransform: "none",
                    padding: "0 0.5rem",
                  }}
                >
                  <i
                    className="material-icons left"
                    style={{
                      marginRight: "0.3rem",
                      fontSize: "1.1rem",
                      lineHeight: "inherit",
                    }}
                  >
                    open_in_full
                  </i>
                  See more
                </button>
              </div>
              <p style={{ color: palette.muted, lineHeight: 1.5 }}>
                Enter miles by day, week, month, or year to see equivalent cost
                across every timeframe.
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div style={{ flex: "1 1 220px" }}>
                  <label
                    htmlFor="recurringMiles"
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: "0.45rem",
                    }}
                  >
                    Miles
                  </label>
                  <div style={inputContainerStyle}>
                    <input
                      id="recurringMiles"
                      type="number"
                      min="0"
                      step="1"
                      value={values.recurringMiles}
                      onChange={handleChange("recurringMiles")}
                      onFocus={handleNumericInputFocus}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ flex: "1 1 220px" }}>
                  <label
                    htmlFor="recurringType"
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: "0.45rem",
                    }}
                  >
                    Based on
                  </label>
                  <div style={{ ...inputContainerStyle, position: "relative" }}>
                    <select
                      id="recurringType"
                      className="browser-default"
                      value={recurringType}
                      onChange={(event) =>
                        setRecurringType(event.target.value as RecurringType)
                      }
                      style={{ ...selectStyle, paddingRight: "2.75rem" }}
                    >
                      <option value="day">Miles per day</option>
                      <option value="weekday">Miles per weekday</option>
                      <option value="week">Miles per week</option>
                      <option value="month">Miles per month</option>
                      <option value="year">Miles per year</option>
                    </select>
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: palette.muted,
                        fontSize: "0.85rem",
                        pointerEvents: "none",
                      }}
                    >
                      ▼
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="row"
                style={{ marginTop: "1.25rem", marginBottom: 0 }}
              >
                {(["day", "week", "month", "year"] as const).map((key) => (
                  <div
                    key={key}
                    className="col s12 m6"
                    style={{ marginBottom: "1rem" }}
                  >
                    <article
                      style={{
                        ...cardStyle,
                        position: "relative",
                        padding: "1rem 1.1rem",
                        height: "100%",
                        background:
                          key === "year"
                            ? palette.yearlyHighlight
                            : palette.cardBackground,
                      }}
                    >
                      <button
                        type="button"
                        className="btn-flat"
                        onClick={() =>
                          openBreakdownModal(
                            key,
                            `Recurring ${key} cost breakdown`,
                            ["mile", "day", "week", "month", "year"],
                            "recurringDrivingTotals",
                          )
                        }
                        style={{
                          position: "absolute",
                          top: "0.35rem",
                          right: "0.35rem",
                          color: palette.accentDark,
                          minWidth: "unset",
                          padding: "0 0.45rem",
                          lineHeight: 1,
                        }}
                        aria-label={`See ${key} breakdown details`}
                        title={`See ${key} breakdown details`}
                      >
                        <i
                          className="material-icons"
                          style={{ fontSize: "1rem", lineHeight: "inherit" }}
                        >
                          open_in_full
                        </i>
                      </button>
                      <span
                        style={{
                          display: "block",
                          color: palette.muted,
                          marginBottom: "0.4rem",
                        }}
                      >
                        Per {key}
                      </span>
                      <strong style={{ fontSize: "1.6rem", lineHeight: 1 }}>
                        {formatCurrency(calculations.recurringTrueCosts[key])}
                      </strong>
                      <small
                        style={{
                          display: "block",
                          marginTop: "0.45rem",
                          color: palette.muted,
                        }}
                      >
                        Driving:{" "}
                        {formatCurrency(
                          calculations.recurringDrivingCosts[key],
                        )}
                      </small>
                    </article>
                  </div>
                ))}
              </div>

              <div className="row" style={{ marginTop: "1rem", marginBottom: 0 }}>
                <div
                  className={`col s12 ${isToggleEnabled(values.includeFinancing) ? "m4" : "m6"}`}
                  style={{ marginBottom: "1rem" }}
                >
                  <article
                    style={{
                      ...cardStyle,
                      padding: "1rem 1.1rem",
                      height: "100%",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        color: palette.muted,
                        marginBottom: "0.4rem",
                      }}
                    >
                      Annual fixed ownership costs
                    </span>
                    <strong style={{ fontSize: "1.5rem", lineHeight: 1 }}>
                      {formatCurrency(calculations.annualFixedCosts)}
                    </strong>
                  </article>
                </div>
                {isToggleEnabled(values.includeFinancing) ? (
                  <div className="col s12 m4" style={{ marginBottom: "1rem" }}>
                    <article
                      style={{
                        ...cardStyle,
                        padding: "1rem 1.1rem",
                        height: "100%",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          color: palette.muted,
                          marginBottom: "0.4rem",
                        }}
                      >
                        Annual financing cost
                      </span>
                      <strong style={{ fontSize: "1.5rem", lineHeight: 1 }}>
                        {formatCurrency(calculations.annualFinanceCost)}
                      </strong>
                    </article>
                  </div>
                ) : null}
                <div
                  className={`col s12 ${isToggleEnabled(values.includeFinancing) ? "m4" : "m6"}`}
                  style={{ marginBottom: "1rem" }}
                >
                  <article
                    style={{
                      ...cardStyle,
                      padding: "1rem 1.1rem",
                      height: "100%",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        color: palette.muted,
                        marginBottom: "0.4rem",
                      }}
                    >
                      Annual miles assumed
                    </span>
                    <strong style={{ fontSize: "1.5rem", lineHeight: 1 }}>
                      {calculations.annualMileage.toFixed(0)}
                    </strong>
                  </article>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="row" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
          <div className="col s12" style={{ marginBottom: "1rem" }}>
            <section style={{ ...cardStyle, padding: "1.5rem" }}>
              <CostBreakdownViewer
                title="Cost breakdown explorer"
                subtitle="Compare how each category allocates across a mile, a trip, or your recurring driving windows. When you stop interacting, it cycles through the views automatically."
                modes={breakdownModes}
                initialMode="mile"
                palette={{
                  text: palette.text,
                  muted: palette.muted,
                  accent: palette.accent,
                  border: palette.border,
                  chartBase: palette.chartBase,
                  chartCenter: palette.chartCenter,
                  tooltipBackground: palette.tooltipBackground,
                  shadow: palette.shadow,
                  cardBackground: palette.cardBackground,
                }}
                cardStyle={cardStyle}
              />
            </section>
          </div>
        </div>

        <div className="row" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
          <div className="col s12" style={{ marginBottom: "1rem" }}>
            <section style={{ ...cardStyle, padding: "1.5rem" }}>
              <InsightsSection
                insights={insights}
                cardStyle={cardStyle}
                isDarkMode={isDarkMode}
                mutedColor={palette.muted}
                title="Insights"
                description="These benchmarks help frame whether your vehicle is inexpensive or expensive to operate compared with common reimbursement, rental, and gig-work reference points."
              />
            </section>
          </div>
        </div>

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
