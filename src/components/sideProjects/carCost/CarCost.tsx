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
import LoanPaydownDetails from "./LoanPaydownDetails";
import SeeMoreButton from "./SeeMoreButton";
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
  depreciationBasis: "miles" | "years";
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
  loanDownPayment: number;
  loanApr: number;
  loanTermMonths: number;
  loanMonthlyPayment: number;
  loanPaymentMode: "months" | "payment";
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
  depreciationBasis: "miles",
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
  loanDownPayment: 4000,
  loanApr: 6.56,
  loanTermMonths: 72,
  loanMonthlyPayment: 748,
  loanPaymentMode: "months",
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

const DEFAULT_NEW_CAR_APR = 6.56;
const DEFAULT_NEW_CAR_PAYMENT = 748;
const DEFAULT_NEW_CAR_TERM_MONTHS = 72;

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

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });
const formatNumber = (value: number, maximumFractionDigits = 0) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
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
          depreciationBasis:
            template.values.depreciationBasis ?? defaultValues.depreciationBasis,
          fuelUnitPrice:
            DEFAULT_FUEL_PRICES[
              (template.values.fuelType ?? defaultValues.fuelType) as FuelType
            ],
          includeDepreciation: template.values.includeDepreciation ?? 1,
          includeAnnualOwnership: template.values.includeAnnualOwnership ?? 1,
          loanApr: template.values.loanApr ?? DEFAULT_NEW_CAR_APR,
          loanTermMonths:
            template.values.loanTermMonths ?? DEFAULT_NEW_CAR_TERM_MONTHS,
          loanDownPayment:
            template.values.loanDownPayment ?? defaultValues.loanDownPayment,
          loanMonthlyPayment:
            template.values.loanMonthlyPayment ?? DEFAULT_NEW_CAR_PAYMENT,
          loanPaymentMode:
            template.values.loanPaymentMode ?? defaultValues.loanPaymentMode,
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
  const loanDetailsModalRef = useRef<HTMLDivElement>(null);
  const loanDetailsModalInstanceRef = useRef<M.Modal | null>(null);

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
  }, [values.depreciationBasis, values.fuelType, values.fuelUnitPrice]);

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
              depreciationBasis:
                parsedCustom.values.depreciationBasis ??
                defaultValues.depreciationBasis,
              fuelUnitPrice:
                parsedCustom.values.fuelUnitPrice ??
                DEFAULT_FUEL_PRICES[
                  (parsedCustom.values.fuelType ??
                    defaultValues.fuelType) as FuelType
                ],
              loanApr: parsedCustom.values.loanApr ?? DEFAULT_NEW_CAR_APR,
              loanTermMonths:
                parsedCustom.values.loanTermMonths ?? DEFAULT_NEW_CAR_TERM_MONTHS,
              loanDownPayment:
                parsedCustom.values.loanDownPayment ?? defaultValues.loanDownPayment,
              loanMonthlyPayment:
                parsedCustom.values.loanMonthlyPayment ?? DEFAULT_NEW_CAR_PAYMENT,
              loanPaymentMode:
                parsedCustom.values.loanPaymentMode ?? defaultValues.loanPaymentMode,
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
            depreciationBasis:
              parsedState.values.depreciationBasis ??
              defaultValues.depreciationBasis,
            fuelUnitPrice:
              parsedState.values.fuelUnitPrice ??
              DEFAULT_FUEL_PRICES[
                (parsedState.values.fuelType ??
                  defaultValues.fuelType) as FuelType
              ],
            loanApr: parsedState.values.loanApr ?? DEFAULT_NEW_CAR_APR,
            loanTermMonths:
              parsedState.values.loanTermMonths ?? DEFAULT_NEW_CAR_TERM_MONTHS,
            loanDownPayment:
              parsedState.values.loanDownPayment ?? defaultValues.loanDownPayment,
            loanMonthlyPayment:
              parsedState.values.loanMonthlyPayment ?? DEFAULT_NEW_CAR_PAYMENT,
            loanPaymentMode:
              parsedState.values.loanPaymentMode ?? defaultValues.loanPaymentMode,
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
    if (!loanDetailsModalRef.current) {
      return;
    }

    loanDetailsModalInstanceRef.current = M.Modal.init(loanDetailsModalRef.current, {
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
      loanDetailsModalInstanceRef.current?.destroy();
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

    const annualMileageByType: Record<RecurringType, number> = {
      day: values.recurringMiles * 365,
      week: values.recurringMiles * 52,
      month: values.recurringMiles * 12,
      year: values.recurringMiles,
      weekday: values.recurringMiles * 5 * 52,
    };

    const annualMileage = annualMileageByType[recurringType];
    const ownershipYears =
      values.depreciationBasis === "years"
        ? values.depreciationInterval
        : annualMileage > 0
          ? values.depreciationInterval / annualMileage
          : 0;
    const ownershipMiles =
      values.depreciationBasis === "miles"
        ? values.depreciationInterval
        : annualMileage * values.depreciationInterval;
    const depreciationValueChange = values.purchasePrice - values.resaleValue;
    const depreciationCostPerMile =
      isToggleEnabled(values.includeDepreciation) && ownershipMiles > 0
        ? depreciationValueChange / ownershipMiles
        : 0;
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
    const depreciationTotal = isToggleEnabled(values.includeDepreciation)
      ? depreciationValueChange
      : 0;
    const monthsOwned = Math.max(0, Math.round(ownershipYears * 12));
    const financedAmount = Math.max(values.purchasePrice - values.loanDownPayment, 0);
    const monthlyRate = values.loanApr / 100 / 12;
    const normalizedLoanTermMonths = Math.max(
      0,
      Math.round(values.loanTermMonths),
    );
    const effectiveMonthlyPayment =
      values.loanPaymentMode === "months"
        ? financedAmount > 0 && normalizedLoanTermMonths > 0
          ? monthlyRate > 0
            ? (financedAmount * monthlyRate) /
              (1 - Math.pow(1 + monthlyRate, -normalizedLoanTermMonths))
            : financedAmount / normalizedLoanTermMonths
          : 0
        : values.loanMonthlyPayment;
    let remainingLoanBalance = financedAmount;
    let totalLoanPaymentsMade = 0;
    let totalInterestPaid = 0;
    let payoffMonth: number | null = financedAmount > 0 ? null : 0;
    const loanPaydownPoints: { month: number; balance: number; interestPaid: number }[] = [
      { month: 0, balance: financedAmount, interestPaid: 0 },
    ];

    if (isToggleEnabled(values.includeFinancing) && financedAmount > 0) {
      const simulationMonths =
        values.loanPaymentMode === "months"
          ? Math.max(monthsOwned, normalizedLoanTermMonths)
          : Math.max(monthsOwned, 1);

      for (let month = 1; month <= simulationMonths; month += 1) {
        const monthlyInterest = remainingLoanBalance * monthlyRate;
        const scheduledPayment = effectiveMonthlyPayment;
        const actualPayment = Math.min(
          scheduledPayment,
          remainingLoanBalance + monthlyInterest,
        );

        totalLoanPaymentsMade += actualPayment;
        totalInterestPaid += monthlyInterest;
        remainingLoanBalance = Math.max(
          remainingLoanBalance + monthlyInterest - actualPayment,
          0,
        );
        loanPaydownPoints.push({
          month,
          balance: remainingLoanBalance,
          interestPaid: totalInterestPaid,
        });

        if (remainingLoanBalance <= 0.01) {
          remainingLoanBalance = 0;
          payoffMonth = month;
          break;
        }

        if (scheduledPayment <= monthlyInterest) {
          payoffMonth = null;
        }
      }
    } else {
      remainingLoanBalance = 0;
    }

    if (
      isToggleEnabled(values.includeFinancing) &&
      financedAmount > 0 &&
      payoffMonth === null &&
      loanPaydownPoints[loanPaydownPoints.length - 1]?.balance === 0
    ) {
      payoffMonth = loanPaydownPoints[loanPaydownPoints.length - 1].month;
    }

    const annualFinanceCost =
      isToggleEnabled(values.includeFinancing) && ownershipYears > 0
        ? totalInterestPaid / ownershipYears
        : 0;
    const fixedCostPerMile =
      annualMileage > 0 ? annualFixedCosts / annualMileage : 0;
    const financeCostPerMile =
      ownershipMiles > 0 ? totalInterestPaid / ownershipMiles : 0;
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
    const equityAtSale = values.resaleValue - remainingLoanBalance;
    const netVehicleCostAtSale = isToggleEnabled(values.includeFinancing)
      ? values.loanDownPayment + totalLoanPaymentsMade - equityAtSale
      : depreciationTotal;
    const overallItems = {
      fuel: fuelCostPerMile * ownershipMiles,
      oil: oilCostPerMile * ownershipMiles,
      tires: tireCostPerMile * ownershipMiles,
      misc: miscCostPerMile * ownershipMiles,
      depreciation: Math.max(depreciationTotal, 0),
      ownership: annualFixedCosts * ownershipYears,
      financing: Math.max(totalInterestPaid, 0),
    };
    const overallCost =
      overallItems.fuel +
      overallItems.oil +
      overallItems.tires +
      overallItems.misc +
      overallItems.depreciation +
      overallItems.ownership +
      overallItems.financing;

    return {
      fuelCostPerMile,
      oilCostPerMile,
      tireCostPerMile,
      miscCostPerMile,
      depreciationCostPerMile,
      variableCostPerMile,
      annualMileage,
      ownershipYears,
      ownershipMiles,
      monthsOwned,
      annualFixedCosts,
      annualFinanceCost,
      depreciationTotal,
      financedAmount,
      effectiveMonthlyPayment,
      effectiveLoanTermMonths:
        values.loanPaymentMode === "months"
          ? normalizedLoanTermMonths
          : payoffMonth ?? monthsOwned,
      totalLoanPaymentsMade,
      remainingLoanBalance,
      totalInterestPaid,
      payoffMonth,
      loanPaydownPoints,
      equityAtSale,
      netVehicleCostAtSale,
      fixedCostPerMile,
      financeCostPerMile,
      trueCostPerMile,
      selectedTripDistance,
      tripCost,
      recurringDrivingCosts,
      recurringTrueCosts,
      overallItems,
      overallCost,
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

    const recurringModeMeta: Record<
      "day" | "week" | "month" | "year" | "overall",
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
      overall: {
        label: "Overall",
        description:
          "See how each category adds up across your full ownership horizon using annual miles and your depreciation timeline.",
        unitLabel: "total ownership",
      },
    };

    const getOwnershipFactor = (modeKey: BreakdownMode, miles: number) => {
      switch (modeKey) {
        case "mile":
          return calculations.annualMileage > 0 ? 1 / calculations.annualMileage : 0;
        case "trip":
          return calculations.annualMileage > 0
            ? calculations.selectedTripDistance / calculations.annualMileage
            : 0;
        case "day":
          return 1 / 365;
        case "week":
          return 1 / 52;
        case "month":
          return 1 / 12;
        case "year":
          return 1;
        case "overall":
          return calculations.ownershipYears;
        default:
          return miles > 0 && calculations.annualMileage > 0
            ? miles / calculations.annualMileage
            : 0;
      }
    };

    const buildOwnershipSegments = (factor: number) =>
      [
        {
          label: "Insurance",
          value: isToggleEnabled(values.includeAnnualOwnership)
            ? values.annualInsurance * factor
            : 0,
          color: "#4f6d7a",
        },
        {
          label: "Registration",
          value: isToggleEnabled(values.includeAnnualOwnership)
            ? values.annualRegistration * factor
            : 0,
          color: "#6a8793",
        },
        {
          label: "Parking",
          value: isToggleEnabled(values.includeAnnualOwnership)
            ? values.annualParking * factor
            : 0,
          color: "#8ea6af",
        },
        {
          label: "Inspection / emissions",
          value: isToggleEnabled(values.includeAnnualOwnership)
            ? values.annualInspection * factor
            : 0,
          color: "#9fb8c0",
        },
        {
          label: "Roadside assistance",
          value: isToggleEnabled(values.includeAnnualOwnership)
            ? values.annualRoadside * factor
            : 0,
          color: "#bfd2d8",
        },
      ].filter((segment) => segment.value > 0);

    const buildModeItems = (modeKey: BreakdownMode, modeLabel: string, unitLabel: string, miles: number) => {
      const fuelValue =
        modeKey === "overall"
          ? calculations.overallItems.fuel
          : calculations.fuelCostPerMile * miles;
      const oilValue =
        modeKey === "overall"
          ? calculations.overallItems.oil
          : calculations.oilCostPerMile * miles;
      const tireValue =
        modeKey === "overall"
          ? calculations.overallItems.tires
          : calculations.tireCostPerMile * miles;
      const miscValue =
        modeKey === "overall"
          ? calculations.overallItems.misc
          : calculations.miscCostPerMile * miles;
      const depreciationValue =
        modeKey === "overall"
          ? calculations.overallItems.depreciation
          : calculations.depreciationCostPerMile * miles;
      const ownershipValue =
        modeKey === "overall"
          ? calculations.overallItems.ownership
          : recurringModeMeta[modeKey as "day" | "week" | "month" | "year"]
            ? recurringOwnershipByPeriod[modeKey as "day" | "week" | "month" | "year"]
            : modeKey === "trip"
              ? calculations.fixedCostPerMile * miles
              : modeKey === "mile"
                ? calculations.fixedCostPerMile
                : 0;
      const financingValue =
        modeKey === "overall"
          ? calculations.overallItems.financing
          : recurringModeMeta[modeKey as "day" | "week" | "month" | "year"]
            ? recurringFinanceByPeriod[modeKey as "day" | "week" | "month" | "year"]
            : modeKey === "trip"
              ? calculations.financeCostPerMile * miles
              : modeKey === "mile"
                ? calculations.financeCostPerMile
                : 0;

      const ownershipFactor = getOwnershipFactor(modeKey, miles);
      const ownershipSegments = buildOwnershipSegments(ownershipFactor);

      const serviceMetrics = (
        costValue: number,
        serviceCost: number,
        serviceIntervalLabel: string,
        serviceIntervalValue: number,
        unitNoun: string,
      ) => {
        const equivalent = serviceCost > 0 ? costValue / serviceCost : 0;
        const whole = Math.floor(equivalent);
        const partialPercent =
          equivalent >= 1 ? (equivalent - whole) * 100 : equivalent * 100;

        return {
          equivalent,
          metrics: [
            { label: `Cost in this ${modeLabel.toLowerCase()} view`, value: formatCurrency(costValue) },
            { label: `${serviceIntervalLabel}`, value: `${formatNumber(serviceIntervalValue)} ${unitNoun}` },
            { label: "Equivalent services used", value: formatNumber(equivalent, 2) },
            { label: "Completed full services", value: formatNumber(whole) },
            {
              label: equivalent >= 1 ? "Next service used" : "Single service used",
              value: `${formatNumber(partialPercent, 1)}%`,
            },
          ],
        };
      };

      return [
        {
          label: "Fuel",
          value: fuelValue,
          color: colors.fuel,
          detail: {
            title: `Fuel detail for ${modeLabel.toLowerCase()}`,
            subtitle:
              values.fuelType === "electric"
                ? `Energy usage for ${unitLabel}.`
                : `Fuel usage for ${unitLabel}.`,
            metrics: [
              { label: `Cost in this ${modeLabel.toLowerCase()} view`, value: formatCurrency(fuelValue) },
              {
                label: values.fuelType === "electric" ? "Estimated kWh used" : "Estimated gallons used",
                value: formatNumber(
                  values.fuelUnitPrice > 0 ? fuelValue / values.fuelUnitPrice : 0,
                  2,
                ),
              },
              {
                label: values.fuelType === "electric" ? "Electricity rate" : "Fuel price",
                value: `${formatCurrency(values.fuelUnitPrice)} per ${
                  values.fuelType === "electric" ? "kWh" : "gallon"
                }`,
              },
              {
                label: values.fuelType === "electric" ? "Efficiency" : "Fuel mileage",
                value: `${formatNumber(values.fuelEfficiency, 1)} ${
                  values.fuelType === "electric" ? "mi/kWh" : "mpg"
                }`,
              },
            ],
            steps: [
              values.fuelType === "electric"
                ? `The calculator estimates total energy used, then multiplies by your electricity cost per kWh.`
                : `The calculator estimates total gallons consumed, then multiplies by your selected fuel price.`,
              `This ${modeLabel.toLowerCase()} view uses ${formatNumber(miles, 2)} miles of driving.`,
            ],
          },
        },
        {
          label: "Oil changes",
          value: oilValue,
          color: colors.oil,
          detail: {
            title: `Oil change detail for ${modeLabel.toLowerCase()}`,
            subtitle: `How much of your oil change cycle this ${unitLabel} uses up.`,
            metrics: serviceMetrics(
              oilValue,
              values.oilChangeCost,
              "Oil change interval",
              values.oilChangeInterval,
              "miles",
            ).metrics.concat([
              { label: "Oil change cost", value: formatCurrency(values.oilChangeCost) },
            ]),
            steps: [
              `Equivalent oil changes = ${formatCurrency(oilValue)} / ${formatCurrency(
                values.oilChangeCost,
              )} = ${formatNumber(
                values.oilChangeCost > 0 ? oilValue / values.oilChangeCost : 0,
                2,
              )}.`,
              `That tells you what share of one oil change, or how many full oil changes, this ${modeLabel.toLowerCase()} uses.`,
            ],
          },
        },
        {
          label: "Tires",
          value: tireValue,
          color: colors.tires,
          detail: {
            title: `Tire detail for ${modeLabel.toLowerCase()}`,
            subtitle: `How much of a tire set this ${unitLabel} uses up.`,
            metrics: serviceMetrics(
              tireValue,
              values.tireCost,
              "Tire interval",
              values.tireInterval,
              "miles",
            ).metrics.concat([{ label: "Tire set cost", value: formatCurrency(values.tireCost) }]),
            steps: [
              `Equivalent tire sets = ${formatCurrency(tireValue)} / ${formatCurrency(
                values.tireCost,
              )}.`,
              `This tells you the percentage of one set used, or how many full sets would be consumed over this view.`,
            ],
          },
        },
        {
          label: "Misc. maintenance",
          value: miscValue,
          color: colors.misc,
          detail: {
            title: `Misc. maintenance detail for ${modeLabel.toLowerCase()}`,
            subtitle: `How the miscellaneous maintenance allowance contributes to this ${modeLabel.toLowerCase()}.`,
            metrics: serviceMetrics(
              miscValue,
              values.miscMaintenanceCost,
              "Maintenance interval",
              values.miscMaintenanceInterval,
              values.miscMaintenanceBasis === "miles"
                ? "miles"
                : values.miscMaintenanceBasis === "month"
                  ? "months"
                  : "years",
            ).metrics.concat([
              { label: "Maintenance event cost", value: formatCurrency(values.miscMaintenanceCost) },
              {
                label: "Basis",
                value:
                  values.miscMaintenanceBasis === "miles"
                    ? "Mileage-based"
                    : values.miscMaintenanceBasis === "month"
                      ? "Month-based"
                      : "Year-based",
              },
            ]),
            steps: [
              `Equivalent maintenance events = ${formatCurrency(miscValue)} / ${formatCurrency(
                values.miscMaintenanceCost,
              )}.`,
              `The same allowance can be spread by miles, months, or years depending on how you track maintenance.`,
            ],
          },
        },
        {
          label: "Depreciation",
          value: depreciationValue,
          color: colors.depreciation,
          detail: {
            title: `Depreciation for ${modeLabel.toLowerCase()}`,
            subtitle:
              "Shows the vehicle’s expected value change over your ownership horizon, with financing shown alongside it for context.",
            metrics: [
              { label: `Depreciation in this ${modeLabel.toLowerCase()} view`, value: formatCurrency(depreciationValue) },
              { label: "Purchase price", value: formatCurrency(values.purchasePrice) },
              { label: "Expected resale value", value: formatCurrency(values.resaleValue) },
              {
                label: values.depreciationBasis === "miles" ? "Ownership miles assumed" : "Ownership years assumed",
                value:
                  values.depreciationBasis === "miles"
                    ? `${formatNumber(values.depreciationInterval)} miles`
                    : `${formatNumber(values.depreciationInterval, 1)} years`,
              },
            ],
            pieTitle: "Vehicle cost context",
            pieSegments: [
              {
                label: "Depreciation",
                value: Math.max(depreciationValue, 0),
                color: colors.depreciation,
              },
            ].filter((segment) => segment.value > 0),
            steps: [
              `Expected depreciation = ${formatCurrency(values.purchasePrice)} - ${formatCurrency(
                values.resaleValue,
              )} = ${formatCurrency(calculations.depreciationTotal)}.`,
              `That total is spread across your selected ownership horizon and allocated into this ${modeLabel.toLowerCase()} view.`,
            ],
          },
        },
        {
          label: "Ownership overhead",
          value: ownershipValue,
          color: colors.ownership,
          detail: {
            title: `Ownership overhead for ${modeLabel.toLowerCase()}`,
            subtitle: `Annual fixed ownership costs scaled into ${unitLabel}.`,
            metrics: [
              { label: `Overhead in this ${modeLabel.toLowerCase()} view`, value: formatCurrency(ownershipValue) },
              { label: "Annual fixed ownership total", value: formatCurrency(calculations.annualFixedCosts) },
              { label: "Annual miles assumed", value: formatNumber(calculations.annualMileage) },
            ],
            pieTitle: "Ownership overhead breakdown",
            pieSegments: ownershipSegments,
            steps: [
              `The calculator scales insurance, registration, parking, inspection, and roadside costs from annual totals into this ${modeLabel.toLowerCase()} view.`,
            ],
          },
        },
        {
          label: "Financing",
          value: financingValue,
          color: colors.financing,
          detail: {
            title: `Financing detail for ${modeLabel.toLowerCase()}`,
            subtitle: "Interest cost is calculated from the amortized loan schedule, not by multiplying APR directly across the full purchase price forever.",
            metrics: [
              { label: `Interest in this ${modeLabel.toLowerCase()} view`, value: formatCurrency(financingValue) },
              { label: "Amount financed", value: formatCurrency(calculations.financedAmount) },
              { label: "Down payment", value: formatCurrency(values.loanDownPayment) },
              {
                label: "Monthly payment",
                value: formatCurrency(calculations.effectiveMonthlyPayment),
              },
              {
                label: "Loan term",
                value: `${formatNumber(calculations.effectiveLoanTermMonths)} months`,
              },
              { label: "Total interest while owned", value: formatCurrency(calculations.totalInterestPaid) },
              { label: "Payments made while owned", value: formatCurrency(calculations.totalLoanPaymentsMade) },
            ],
            steps: [
              `Amount financed = purchase price (${formatCurrency(values.purchasePrice)}) - down payment (${formatCurrency(
                values.loanDownPayment,
              )}) = ${formatCurrency(calculations.financedAmount)}.`,
              values.loanPaymentMode === "months"
                ? `The loan uses ${formatNumber(values.loanApr, 2)}% APR across ${formatNumber(
                    calculations.effectiveLoanTermMonths,
                  )} months, which computes to about ${formatCurrency(
                    calculations.effectiveMonthlyPayment,
                  )} per month.`
                : `The loan is amortized month by month using ${formatNumber(
                    values.loanApr,
                    2,
                  )}% APR and a ${formatCurrency(
                    calculations.effectiveMonthlyPayment,
                  )} monthly payment.`,
              `Only interest paid during the ownership window is counted here as financing cost.`,
            ],
            note:
              calculations.payoffMonth !== null
                ? `At this payment level, the loan is paid off in month ${formatNumber(
                    calculations.payoffMonth,
                  )}.`
                : "At the current payment and APR, the loan is not fully paid off within the ownership window.",
          },
        },
      ].filter((item) => item.value > 0);
    };

    const recurringModes = (["day", "week", "month", "year"] as const).map(
      (key) => {
        const miles = recurringMilesByPeriod[key];

        return {
          key,
          label: recurringModeMeta[key].label,
          description: recurringModeMeta[key].description,
          unitLabel: recurringModeMeta[key].unitLabel,
          total: calculations.recurringTrueCosts[key],
          items: buildModeItems(key, recurringModeMeta[key].label, recurringModeMeta[key].unitLabel, miles),
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
        items: buildModeItems("mile", "Per mile", "per mile", 1),
      },
      {
        key: "trip",
        label: "Trip",
        description: `This allocates the selected trip distance of ${formatNumber(
          calculations.selectedTripDistance,
        )} miles across fuel, maintenance, depreciation, and ownership overhead.`,
        unitLabel: `${formatNumber(calculations.selectedTripDistance)} mi trip`,
        total: calculations.tripCost,
        items: buildModeItems(
          "trip",
          "Trip",
          `${formatNumber(calculations.selectedTripDistance)} mi trip`,
          calculations.selectedTripDistance,
        ),
      },
      ...recurringModes,
      {
        key: "overall",
        label: recurringModeMeta.overall.label,
        description: `This estimates total cost over about ${formatNumber(
          calculations.ownershipYears,
          1,
        )} years and ${formatNumber(
          calculations.ownershipMiles,
        )} miles of ownership at ${formatNumber(
          calculations.annualMileage,
        )} miles per year driven.`,
        unitLabel: recurringModeMeta.overall.unitLabel,
        total: calculations.overallCost,
        items: buildModeItems(
          "overall",
          recurringModeMeta.overall.label,
          recurringModeMeta.overall.unitLabel,
          calculations.ownershipMiles,
        ),
      },
    ];
  }, [
    calculations,
    recurringMilesByPeriod,
    recurringFinanceByPeriod,
    recurringOwnershipByPeriod,
    values,
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

  const openLoanDetailsModal = () => {
    cleanupModalArtifacts();
    loanDetailsModalInstanceRef.current?.open();
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
    values.depreciationBasis === "miles"
      ? `Choose miles if you expect to get rid of the vehicle after about ${formatNumber(
          values.depreciationInterval,
        )} miles of ownership. Based on your annual miles, that implies about ${formatNumber(
          calculations.ownershipYears,
          1,
        )} years of ownership.`
      : `Choose years if you expect to keep the vehicle for about ${formatNumber(
          values.depreciationInterval,
          1,
        )} years. Based on your annual miles, that implies about ${formatNumber(
          calculations.ownershipMiles,
        )} miles of ownership.`;
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
    borderRadius: "999px",
    boxShadow: isDarkMode
      ? "0 10px 22px rgba(0, 0, 0, 0.24)"
      : "0 10px 22px rgba(91, 60, 34, 0.16)",
    padding: isMobileView ? "0 1rem" : "0 1.2rem",
    height: isMobileView ? "2.7rem" : "2.85rem",
    lineHeight: isMobileView ? "2.7rem" : "2.85rem",
    fontSize: isMobileView ? "0.88rem" : "0.92rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
    textTransform: "none",
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

  const compactMetricCardPadding = isMobileView ? "0.8rem 0.9rem" : "1rem 1.1rem";
  const compactMetricValueSize = isMobileView ? "1.15rem" : "1.5rem";
  const compactMetricLabelStyle: React.CSSProperties = {
    display: "block",
    color: palette.muted,
    marginBottom: "0.35rem",
    fontSize: isMobileView ? "0.78rem" : "0.92rem",
    lineHeight: 1.3,
  };
  const compactMetricValueStyle: React.CSSProperties = {
    fontSize: compactMetricValueSize,
    lineHeight: 1.05,
  };
  const sectionDescriptionStyle: React.CSSProperties = {
    color: palette.muted,
    lineHeight: 1.4,
    fontSize: "0.9rem",
  };
  const fieldLabelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: 600,
    marginBottom: "0.38rem",
    fontSize: "0.98rem",
    lineHeight: 1.3,
  };
  const subFieldLabelStyle: React.CSSProperties = {
    display: "block",
    color: palette.muted,
    fontWeight: 500,
    marginBottom: "0.3rem",
    fontSize: "0.82rem",
    lineHeight: 1.3,
  };

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
        id="car-cost-loan-details-modal"
        className="modal modal-fixed-footer"
        ref={loanDetailsModalRef}
      >
        <div
          className="modal-content"
          style={{
            background: palette.panelBackground,
            color: palette.text,
          }}
        >
          <h4 style={{ marginTop: 0 }}>Financing details</h4>
          <p style={{ color: palette.muted, lineHeight: 1.5 }}>
            This view shows how the loan is paid down during the time you expect to own the
            vehicle, including payments made, interest paid, and the remaining principal balance
            at sale.
          </p>
          <LoanPaydownDetails
            purchasePrice={values.purchasePrice}
            downPayment={values.loanDownPayment}
            financedAmount={calculations.financedAmount}
            apr={values.loanApr}
            monthlyPayment={calculations.effectiveMonthlyPayment}
            loanTermMonths={calculations.effectiveLoanTermMonths}
            monthsOwned={calculations.monthsOwned}
            payoffMonth={calculations.payoffMonth}
            remainingBalance={calculations.remainingLoanBalance}
            totalInterestPaid={calculations.totalInterestPaid}
            totalLoanPaymentsMade={calculations.totalLoanPaymentsMade}
            points={calculations.loanPaydownPoints}
            palette={{
              text: palette.text,
              muted: palette.muted,
              accent: palette.accent,
              border: palette.border,
              chartBase: palette.chartBase,
              cardBackground: palette.cardBackground,
            }}
            cardStyle={cardStyle}
          />
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
          background: isMobileView ? "transparent" : palette.shellBackground,
          borderRadius: isMobileView ? 0 : "32px",
          padding: isMobileView ? "0.5rem" : "2rem",
          marginTop: isMobileView ? "0.5rem" : "1rem",
          marginLeft: isMobileView ? "-0.75rem" : undefined,
          marginRight: isMobileView ? "-0.75rem" : undefined,
          width: isMobileView ? "calc(100% + 1.5rem)" : undefined,
          maxWidth: isMobileView ? "calc(100% + 1.5rem)" : undefined,
          color: palette.text,
        }}
      >
        <div
          style={{
            ...cardStyle,
            position: "sticky",
            top: `${stickyTop}px`,
            zIndex: 20,
            padding: isMobileView ? "0.8rem 0.9rem" : "1rem 1.2rem",
            marginBottom: isMobileView ? "1rem" : "1.5rem",
            borderRadius: isMobileView ? "22px" : "24px",
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
                padding: isMobileView ? "1rem 1.1rem" : "1.25rem 1.5rem",
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
                  fontSize: isMobileView ? "0.82rem" : "1rem",
                }}
              >
                {primarySummaryCard.label}
              </span>
              <strong
                style={{ fontSize: isMobileView ? "1.7rem" : "2.1rem", lineHeight: 1 }}
              >
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
                <p style={sectionDescriptionStyle}>
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
                    {isToggleEnabled(values.includeDepreciation) ? (
                      <p
                        style={{
                          color: palette.muted,
                          lineHeight: 1.45,
                          fontSize: "0.92rem",
                          margin: "0.7rem 0 0",
                        }}
                      >
                        {values.depreciationBasis === "miles"
                          ? `This assumes you will sell the vehicle after about ${formatNumber(
                              values.depreciationInterval,
                            )} miles of ownership, which works out to roughly ${formatNumber(
                              calculations.ownershipYears,
                              1,
                            )} years at your current annual mileage.`
                          : `This assumes you will keep the vehicle for about ${formatNumber(
                              values.depreciationInterval,
                              1,
                            )} years, which works out to roughly ${formatNumber(
                              calculations.ownershipMiles,
                            )} miles at your current annual mileage.`}
                      </p>
                    ) : null}
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
                      <label htmlFor="fuelType" style={fieldLabelStyle}>
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
                      <label htmlFor="fuelEfficiency" style={fieldLabelStyle}>
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
                          ...fieldLabelStyle,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.45rem",
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
                      <div style={{ marginBottom: "0.38rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                          <span style={fieldLabelStyle}>
                            {field.name === "miscMaintenanceInterval"
                              ? values.miscMaintenanceBasis === "miles"
                                ? "Misc. maintenance interval (miles)"
                                : values.miscMaintenanceBasis === "month"
                                  ? "Misc. maintenance interval (months)"
                                  : "Misc. maintenance interval (years)"
                              : field.name === "depreciationInterval"
                                ? values.depreciationBasis === "miles"
                                  ? "Depreciation interval (miles)"
                                  : "Ownership length (years)"
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
                      {field.name === "miscMaintenanceInterval" ? (
                        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)", gap: "0.75rem" }}>
                          <div>
                            <label htmlFor="miscMaintenanceBasis" style={subFieldLabelStyle}>
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
                            <label htmlFor={field.name} style={subFieldLabelStyle}>
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
                      ) : field.name === "depreciationInterval" ? (
                        <>
                        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)", gap: "0.75rem" }}>
                          <div>
                            <label htmlFor="depreciationBasis" style={subFieldLabelStyle}>
                              Based on
                            </label>
                            <div style={{ ...inputContainerStyle, position: "relative" }}>
                              <select
                                id="depreciationBasis"
                                className="browser-default"
                                value={values.depreciationBasis}
                                onChange={handleDepreciationBasisChange}
                                style={{ ...selectStyle, paddingRight: "2.75rem" }}
                              >
                                <option value="miles">Miles</option>
                                <option value="years">Years owned</option>
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
                            <label htmlFor={field.name} style={subFieldLabelStyle}>
                              {values.depreciationBasis === "miles" ? "Every" : "For"}
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
                                disabled={!isToggleEnabled(values.includeDepreciation)}
                                style={inputStyle}
                              />
                            </div>
                          </div>
                        </div>
                        <div style={{ marginTop: "0.75rem" }}>
                          <label htmlFor="annualMileageVehicleCost" style={subFieldLabelStyle}>
                            Annual miles driven
                          </label>
                          <div style={inputContainerStyle}>
                            <input
                              id="annualMileageVehicleCost"
                              type="number"
                              min="0"
                              step="1"
                              value={Math.round(calculations.annualMileage)}
                              onChange={handleAnnualMileageChange}
                              onFocus={handleNumericInputFocus}
                              style={inputStyle}
                            />
                          </div>
                        </div>
                        </>
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
                      {field.name === "purchasePrice" && section.title === "Vehicle cost" ? (
                        <div
                          style={{
                            marginTop: "0.85rem",
                            display: "grid",
                            gap: "0.85rem",
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
                                display: "grid",
                                gridTemplateColumns: isMobileView
                                  ? "1fr"
                                  : "repeat(2, minmax(0, 1fr))",
                                gap: "0.75rem",
                              }}
                            >
                              <div>
                                <label htmlFor="loanDownPayment" style={subFieldLabelStyle}>
                                  Down payment
                                </label>
                                <div style={inputContainerStyle}>
                                  <span style={prefixStyle}>$</span>
                                  <input
                                    id="loanDownPayment"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={values.loanDownPayment}
                                    onChange={handleChange("loanDownPayment")}
                                    onFocus={handleNumericInputFocus}
                                    style={inputStyle}
                                  />
                                </div>
                              </div>
                              <div>
                                <label htmlFor="loanApr" style={subFieldLabelStyle}>
                                  APR (%)
                                </label>
                                <div style={inputContainerStyle}>
                                  <input
                                    id="loanApr"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={values.loanApr}
                                    onChange={handleChange("loanApr")}
                                    onFocus={handleNumericInputFocus}
                                    style={inputStyle}
                                  />
                                </div>
                              </div>
                              <div>
                                <label htmlFor="loanPaymentMode" style={subFieldLabelStyle}>
                                  Based on
                                </label>
                                <div style={{ ...inputContainerStyle, position: "relative" }}>
                                  <select
                                    id="loanPaymentMode"
                                    className="browser-default"
                                    value={values.loanPaymentMode}
                                    onChange={handleLoanPaymentModeChange}
                                    style={{ ...selectStyle, paddingRight: "2.75rem" }}
                                  >
                                    <option value="months">Months financed</option>
                                    <option value="payment">Monthly payment</option>
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
                                    â–¼
                                  </span>
                                </div>
                              </div>
                              <div>
                                <label
                                  htmlFor={
                                    values.loanPaymentMode === "months"
                                      ? "loanTermMonths"
                                      : "loanMonthlyPayment"
                                  }
                                  style={subFieldLabelStyle}
                                >
                                  {values.loanPaymentMode === "months"
                                    ? "Months financed"
                                    : "Monthly payment"}
                                </label>
                                <div style={inputContainerStyle}>
                                  {values.loanPaymentMode === "payment" ? (
                                    <span style={prefixStyle}>$</span>
                                  ) : null}
                                  <input
                                    id={
                                      values.loanPaymentMode === "months"
                                        ? "loanTermMonths"
                                        : "loanMonthlyPayment"
                                    }
                                    type="number"
                                    min="0"
                                    step={values.loanPaymentMode === "months" ? "1" : "0.01"}
                                    value={
                                      values.loanPaymentMode === "months"
                                        ? values.loanTermMonths
                                        : values.loanMonthlyPayment
                                    }
                                    onChange={
                                      values.loanPaymentMode === "months"
                                        ? handleChange("loanTermMonths")
                                        : handleChange("loanMonthlyPayment")
                                    }
                                    onFocus={handleNumericInputFocus}
                                    style={inputStyle}
                                  />
                                </div>
                              </div>
                              <div
                                style={{
                                  gridColumn: "1 / -1",
                                  color: palette.muted,
                                  fontSize: "0.82rem",
                                  lineHeight: 1.35,
                                }}
                              >
                                Amount financed: {formatCurrency(calculations.financedAmount)}
                                <br />
                                {values.loanPaymentMode === "months"
                                  ? `Estimated payment: ${formatCurrency(
                                      calculations.effectiveMonthlyPayment,
                                    )} per month`
                                  : `Estimated term: ${formatNumber(
                                      calculations.effectiveLoanTermMonths,
                                    )} months`}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
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
                <SeeMoreButton
                  onClick={() =>
                    openBreakdownModal(
                      "trip",
                      "Trip cost breakdown",
                      ["mile", "trip"],
                      "tripEstimate",
                    )
                  }
                  accentColor={palette.accentDark}
                  ariaLabel="See more about the trip cost breakdown"
                />
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
                  {formatNumber(calculations.selectedTripDistance)} miles at{" "}
                  {formatCurrency(calculations.trueCostPerMile)} per mile
                </small>
                <p style={{ margin: "0.6rem 0 0", color: palette.muted }}>
                  {tripType === "roundTrip"
                    ? `Round trip uses your selected total distance of ${formatNumber(values.tripDistance)} miles.`
                    : `One-way distance is doubled to estimate the full there-and-back trip (${formatNumber(values.tripDistance)} miles each way).`}
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
                <SeeMoreButton
                  onClick={() =>
                    openBreakdownModal(
                      recurringBreakdownMode,
                      "Recurring cost breakdown",
                      ["mile", "day", "week", "month", "year"],
                      "recurringDrivingTotals",
                    )
                  }
                  accentColor={palette.accentDark}
                  ariaLabel="See more about recurring cost breakdowns"
                />
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
                    className="col s6 m6"
                    style={{ marginBottom: "1rem" }}
                  >
                    <article
                      style={{
                        ...cardStyle,
                        position: "relative",
                        padding: compactMetricCardPadding,
                        height: "100%",
                        background:
                          key === "year"
                            ? palette.yearlyHighlight
                            : palette.cardBackground,
                      }}
                    >
                      <SeeMoreButton
                        onClick={() =>
                          openBreakdownModal(
                            key,
                            `Recurring ${key} cost breakdown`,
                            ["mile", "day", "week", "month", "year"],
                            "recurringDrivingTotals",
                          )
                        }
                        accentColor={palette.accentDark}
                        ariaLabel={`See ${key} breakdown details`}
                        title={`See ${key} breakdown details`}
                        iconOnly
                        buttonStyle={{
                          position: "absolute",
                          top: "0.35rem",
                          right: "0.35rem",
                        }}
                        iconStyle={{ fontSize: "1rem" }}
                      />
                      <span
                        style={{
                          ...compactMetricLabelStyle,
                        }}
                      >
                        Per {key}
                      </span>
                      <strong style={{ fontSize: isMobileView ? "1.25rem" : "1.6rem", lineHeight: 1 }}>
                        {formatCurrency(calculations.recurringTrueCosts[key])}
                      </strong>
                      <small
                        style={{
                          display: "block",
                          marginTop: "0.35rem",
                          color: palette.muted,
                          fontSize: isMobileView ? "0.76rem" : "0.85rem",
                          lineHeight: 1.3,
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
                  className={`col s6 ${isToggleEnabled(values.includeFinancing) ? "m4" : "m6"}`}
                  style={{ marginBottom: "1rem" }}
                >
                  <article
                    style={{
                      ...cardStyle,
                      padding: compactMetricCardPadding,
                      height: "100%",
                    }}
                  >
                    <span style={compactMetricLabelStyle}>
                      Annual fixed ownership costs
                    </span>
                    <strong style={compactMetricValueStyle}>
                      {formatCurrency(calculations.annualFixedCosts)}
                    </strong>
                  </article>
                </div>
                {isToggleEnabled(values.includeFinancing) ? (
                  <div className="col s6 m4" style={{ marginBottom: "1rem" }}>
                    <article
                      style={{
                        ...cardStyle,
                        padding: compactMetricCardPadding,
                        height: "100%",
                      }}
                    >
                      <span style={compactMetricLabelStyle}>
                        Annual financing cost
                      </span>
                      <strong style={compactMetricValueStyle}>
                        {formatCurrency(calculations.annualFinanceCost)}
                      </strong>
                    </article>
                  </div>
                ) : null}
                <div
                  className={`col s6 ${isToggleEnabled(values.includeFinancing) ? "m4" : "m6"}`}
                  style={{ marginBottom: "1rem" }}
                >
                  <article
                    style={{
                      ...cardStyle,
                      padding: compactMetricCardPadding,
                      height: "100%",
                    }}
                  >
                    <span style={compactMetricLabelStyle}>
                      Annual miles assumed
                    </span>
                    <strong style={compactMetricValueStyle}>
                      {formatNumber(calculations.annualMileage)}
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
                subtitle="Compare how each category allocates across a mile, a trip, recurring driving windows, or your full ownership horizon. When you stop interacting, it cycles through the views automatically."
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

        <div className="row" style={{ marginTop: "0.25rem", marginBottom: 0 }}>
          <div className="col s12" style={{ marginBottom: "1rem" }}>
            <section style={{ ...cardStyle, padding: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>Overall ownership estimate</h3>
                  <p style={{ color: palette.muted, margin: "0.35rem 0 0", lineHeight: 1.5 }}>
                    Uses your annual miles and depreciation timeline to estimate total cost over
                    the time you own the vehicle.
                  </p>
                </div>
              </div>
              <div className="row" style={{ marginBottom: 0 }}>
                <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                  <article style={{ ...cardStyle, padding: compactMetricCardPadding, height: "100%" }}>
                    <span style={compactMetricLabelStyle}>
                      Ownership length
                    </span>
                    <strong style={compactMetricValueStyle}>
                      {formatNumber(calculations.ownershipYears, 1)} years
                    </strong>
                  </article>
                </div>
                <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                  <article style={{ ...cardStyle, padding: compactMetricCardPadding, height: "100%" }}>
                    <span style={compactMetricLabelStyle}>
                      Estimated ownership miles
                    </span>
                    <strong style={compactMetricValueStyle}>
                      {formatNumber(calculations.ownershipMiles)}
                    </strong>
                  </article>
                </div>
                <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                  <article style={{ ...cardStyle, padding: compactMetricCardPadding, height: "100%" }}>
                    <span style={compactMetricLabelStyle}>
                      Net vehicle cost after sale
                    </span>
                    <strong style={compactMetricValueStyle}>
                      {formatCurrency(calculations.netVehicleCostAtSale)}
                    </strong>
                  </article>
                </div>
                <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                  <article style={{ ...cardStyle, padding: compactMetricCardPadding, height: "100%" }}>
                    <span style={compactMetricLabelStyle}>
                      Total estimated ownership cost
                    </span>
                    <strong style={compactMetricValueStyle}>
                      {formatCurrency(calculations.overallCost)}
                    </strong>
                  </article>
                </div>
                {isToggleEnabled(values.includeFinancing) ? (
                  <>
                    <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                      <article
                        style={{
                          ...cardStyle,
                          padding: compactMetricCardPadding,
                          height: "100%",
                          position: "relative",
                        }}
                      >
                        <SeeMoreButton
                          onClick={openLoanDetailsModal}
                          accentColor={palette.accentDark}
                          ariaLabel="See financing details"
                          title="See financing details"
                          iconOnly
                          buttonStyle={{
                            position: "absolute",
                            top: "0.35rem",
                            right: "0.35rem",
                          }}
                          iconStyle={{ fontSize: "1rem" }}
                        />
                        <span style={compactMetricLabelStyle}>
                          Total loan payments made
                        </span>
                        <strong style={compactMetricValueStyle}>
                          {formatCurrency(calculations.totalLoanPaymentsMade)}
                        </strong>
                      </article>
                    </div>
                    <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                      <article
                        style={{
                          ...cardStyle,
                          padding: compactMetricCardPadding,
                          height: "100%",
                          position: "relative",
                        }}
                      >
                        <SeeMoreButton
                          onClick={openLoanDetailsModal}
                          accentColor={palette.accentDark}
                          ariaLabel="See interest details"
                          title="See interest details"
                          iconOnly
                          buttonStyle={{
                            position: "absolute",
                            top: "0.35rem",
                            right: "0.35rem",
                          }}
                          iconStyle={{ fontSize: "1rem" }}
                        />
                        <span style={compactMetricLabelStyle}>
                          Interest paid while owned
                        </span>
                        <strong style={compactMetricValueStyle}>
                          {formatCurrency(calculations.totalInterestPaid)}
                        </strong>
                      </article>
                    </div>
                    <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                      <article style={{ ...cardStyle, padding: compactMetricCardPadding, height: "100%" }}>
                        <span style={compactMetricLabelStyle}>
                          Remaining balance at sale
                        </span>
                        <strong style={compactMetricValueStyle}>
                          {formatCurrency(calculations.remainingLoanBalance)}
                        </strong>
                      </article>
                    </div>
                    <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                      <article style={{ ...cardStyle, padding: compactMetricCardPadding, height: "100%" }}>
                        <span style={compactMetricLabelStyle}>
                          Expected sale price
                        </span>
                        <strong style={compactMetricValueStyle}>
                          {formatCurrency(values.resaleValue)}
                        </strong>
                      </article>
                    </div>
                    <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                      <article style={{ ...cardStyle, padding: compactMetricCardPadding, height: "100%" }}>
                        <span style={compactMetricLabelStyle}>
                          Equity at sale
                        </span>
                        <strong style={compactMetricValueStyle}>
                          {formatCurrency(calculations.equityAtSale)}
                        </strong>
                      </article>
                    </div>
                    <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                      <article style={{ ...cardStyle, padding: compactMetricCardPadding, height: "100%" }}>
                        <span style={compactMetricLabelStyle}>
                          Average cost per year
                        </span>
                        <strong style={compactMetricValueStyle}>
                          {formatCurrency(
                            calculations.ownershipYears > 0
                              ? calculations.overallCost / calculations.ownershipYears
                              : 0,
                          )}
                        </strong>
                      </article>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                      <article style={{ ...cardStyle, padding: compactMetricCardPadding, height: "100%" }}>
                        <span style={compactMetricLabelStyle}>
                          Purchase price
                        </span>
                        <strong style={compactMetricValueStyle}>
                          {formatCurrency(values.purchasePrice)}
                        </strong>
                      </article>
                    </div>
                    <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                      <article style={{ ...cardStyle, padding: compactMetricCardPadding, height: "100%" }}>
                        <span style={compactMetricLabelStyle}>
                          Expected sale price
                        </span>
                        <strong style={compactMetricValueStyle}>
                          {formatCurrency(values.resaleValue)}
                        </strong>
                      </article>
                    </div>
                    <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                      <article style={{ ...cardStyle, padding: compactMetricCardPadding, height: "100%" }}>
                        <span style={compactMetricLabelStyle}>
                          Value change at sale
                        </span>
                        <strong style={compactMetricValueStyle}>
                          {formatCurrency(calculations.depreciationTotal)}
                        </strong>
                      </article>
                    </div>
                    <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                      <article style={{ ...cardStyle, padding: compactMetricCardPadding, height: "100%" }}>
                        <span style={compactMetricLabelStyle}>
                          Average cost per year
                        </span>
                        <strong style={compactMetricValueStyle}>
                          {formatCurrency(
                            calculations.ownershipYears > 0
                              ? calculations.overallCost / calculations.ownershipYears
                              : 0,
                          )}
                        </strong>
                      </article>
                    </div>
                  </>
                )}
              </div>
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
