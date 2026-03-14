import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import M from "materialize-css";
import { ThemeContext } from "../../../utility/ThemeContext";
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
  includeDepreciation: number;
  includeAnnualOwnership: number;
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

type RecurringType = "day" | "week" | "month" | "year";

type FieldDefinition = {
  label: string;
  name: keyof CarCostValues;
  step: string;
  prefix?: string;
};

type CostBreakdownItem = {
  label: string;
  value: number;
  color: string;
};

type PersistedCarCostState = {
  selectedSource: "default" | "template" | "custom";
  selectedTemplateId: string | null;
  values: CarCostValues;
  recurringType: RecurringType;
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

type PlannerValues = Pick<CarCostValues, "tripDistance" | "recurringMiles">;

const defaultValues: CarCostValues = {
  fuelType: "regular",
  fuelEfficiency: 25,
  fuelUnitPrice: 3.49,
  oilChangeCost: 75,
  oilChangeInterval: 5000,
  tireCost: 900,
  tireInterval: 50000,
  miscMaintenanceCost: 400,
  miscMaintenanceInterval: 12000,
  purchasePrice: 32000,
  resaleValue: 18000,
  depreciationInterval: 60000,
  tripDistance: 250,
  recurringMiles: 40,
  annualInsurance: 1800,
  annualRegistration: 180,
  annualParking: 0,
  annualInspection: 75,
  annualRoadside: 120,
  includeDepreciation: 1,
  includeAnnualOwnership: 1,
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

const getPlannerValues = (values: CarCostValues): PlannerValues => ({
  tripDistance: values.tripDistance,
  recurringMiles: values.recurringMiles,
});

const applyPlannerValues = (
  baseValues: CarCostValues,
  plannerValues: PlannerValues
): CarCostValues => ({
  ...baseValues,
  ...plannerValues,
});

const sections: { title: string; description: string; items: FieldDefinition[] }[] = [
  {
    title: "Running costs",
    description:
      "Enter the costs and service intervals you want to spread across each mile.",
    items: [
      { label: "Oil change cost", name: "oilChangeCost", step: "0.01", prefix: "$" },
      { label: "Oil change interval (miles)", name: "oilChangeInterval", step: "1" },
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
    title: "Depreciation",
    description:
      "Estimate how much value the vehicle loses over a given number of miles.",
    items: [
      { label: "Purchase price", name: "purchasePrice", step: "0.01", prefix: "$" },
      { label: "Expected resale value", name: "resaleValue", step: "0.01", prefix: "$" },
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
      { label: "Insurance per year", name: "annualInsurance", step: "0.01", prefix: "$" },
      {
        label: "Registration per year",
        name: "annualRegistration",
        step: "0.01",
        prefix: "$",
      },
      { label: "Parking per year", name: "annualParking", step: "0.01", prefix: "$" },
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
const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const buildPieSlice = (
  percentage: number,
  cumulativePercentage: number,
  radius: number
) => {
  if (percentage <= 0) {
    return "";
  }

  const startAngle = cumulativePercentage * Math.PI * 2 - Math.PI / 2;
  const endAngle = (cumulativePercentage + percentage) * Math.PI * 2 - Math.PI / 2;
  const x1 = 50 + radius * Math.cos(startAngle);
  const y1 = 50 + radius * Math.sin(startAngle);
  const x2 = 50 + radius * Math.cos(endAngle);
  const y2 = 50 + radius * Math.sin(endAngle);
  const largeArcFlag = percentage > 0.5 ? 1 : 0;

  return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
};

const isToggleEnabled = (value: number) => value === 1;

const CarCost: React.FC<CarCostProps> = ({ navWrapperRef }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const typedTemplates = useMemo(
    () =>
      (vehicleTemplates as Array<VehicleTemplate & { values: Partial<CarCostValues> }>).map(
        (template) => ({
          ...template,
          values: {
            ...defaultValues,
            ...template.values,
            fuelType: template.values.fuelType ?? defaultValues.fuelType,
            fuelEfficiency:
              template.values.fuelEfficiency ?? (template.values as any).fuelMileage ?? defaultValues.fuelEfficiency,
            fuelUnitPrice:
              DEFAULT_FUEL_PRICES[
                (template.values.fuelType ?? defaultValues.fuelType) as FuelType
              ],
            includeDepreciation: template.values.includeDepreciation ?? 1,
            includeAnnualOwnership: template.values.includeAnnualOwnership ?? 1,
          },
        })
      ),
    []
  );
  const [values, setValues] = useState<CarCostValues>(defaultValues);
  const [recurringType, setRecurringType] = useState<RecurringType>("day");
  const [hasResolvedStartupChoice, setHasResolvedStartupChoice] = useState(false);
  const [selectedSource, setSelectedSource] = useState<"default" | "template" | "custom">(
    "default"
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [startupTemplateId, setStartupTemplateId] = useState<string>(
    typedTemplates[0]?.id ?? ""
  );
  const [savedCustomVehicle, setSavedCustomVehicle] = useState<CustomVehicle | null>(null);
  const [customVehicleDraft, setCustomVehicleDraft] = useState<CustomVehicleDraft>({
    year: "",
    make: "",
    model: "",
    fuelType: "regular",
  });
  const [stickyTop, setStickyTop] = useState(72);
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeBreakdownLabel, setActiveBreakdownLabel] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalInstanceRef = useRef<M.Modal | null>(null);

  const palette = useMemo(
    () => ({
      shellBackground: isDarkMode
        ? "radial-gradient(circle at top left, rgba(184, 92, 56, 0.18), transparent 24%), linear-gradient(180deg, #191511 0%, #110e0b 100%)"
        : "radial-gradient(circle at top left, rgba(184, 92, 56, 0.18), transparent 24%), linear-gradient(180deg, #f8f4ec 0%, #f2eadf 100%)",
      cardBackground: isDarkMode ? "rgba(31, 25, 20, 0.96)" : "rgba(255, 252, 247, 0.96)",
      panelBackground: isDarkMode ? "rgba(39, 32, 24, 0.92)" : "rgba(255, 252, 247, 0.98)",
      subtlePanel: isDarkMode ? "rgba(44, 36, 27, 0.94)" : "rgba(255, 252, 247, 0.96)",
      border: isDarkMode ? "1px solid rgba(202, 202, 202, 0.12)" : "1px solid rgba(77, 55, 34, 0.12)",
      softBorder: isDarkMode ? "1px solid rgba(202, 202, 202, 0.16)" : "1px solid rgba(77, 55, 34, 0.15)",
      text: "var(--text-color)",
      muted: isDarkMode ? "rgba(202, 202, 202, 0.76)" : "#6b625b",
      accent: "#b85c38",
      accentDark: isDarkMode ? "#d79a7f" : "#7f351b",
      chartBase: isDarkMode ? "#2f261d" : "#f3e8da",
      chartCenter: isDarkMode ? "rgba(26, 22, 18, 0.98)" : "rgba(255, 252, 247, 0.98)",
      summaryHighlight: "linear-gradient(135deg, #b85c38 0%, #d47a4d 100%)",
      yearlyHighlight: isDarkMode
        ? "linear-gradient(135deg, rgba(184, 92, 56, 0.34) 0%, rgba(212, 122, 77, 0.28) 100%)"
        : "linear-gradient(135deg, #f0c59d 0%, #f7ddbd 100%)",
      resultHighlight: isDarkMode
        ? "linear-gradient(135deg, rgba(184, 92, 56, 0.26), rgba(212, 122, 77, 0.18))"
        : "linear-gradient(135deg, rgba(184, 92, 56, 0.12), rgba(212, 122, 77, 0.18))",
      tooltipBackground: isDarkMode ? "rgba(31, 25, 20, 0.98)" : "rgba(255, 252, 247, 0.98)",
      shadow: isDarkMode ? "0 24px 60px rgba(0, 0, 0, 0.34)" : "0 24px 60px rgba(91, 60, 34, 0.12)",
      missionShadow: isDarkMode ? "0 14px 34px rgba(0, 0, 0, 0.28)" : "0 14px 34px rgba(91, 60, 34, 0.08)",
    }),
    [isDarkMode]
  );

  const cardStyle: React.CSSProperties = useMemo(
    () => ({
      background: palette.cardBackground,
      border: palette.border,
      borderRadius: "24px",
      boxShadow: palette.shadow,
      color: palette.text,
    }),
    [palette]
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
    [palette]
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
    [palette]
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
    [palette]
  );

  useEffect(() => {
    M.updateTextFields();
  }, [values, recurringType, customVehicleDraft]);

  useEffect(() => {
    const tooltipElements = document.querySelectorAll(".tooltipped");
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
          : { ...current, fuelUnitPrice: DEFAULT_FUEL_PRICES[current.fuelType] }
      );
    };

    const fetchFuelPrice = async () => {
      try {
        const response = await fetch("https://www.fueleconomy.gov/ws/rest/fuelprices", {
          signal: controller.signal,
        });

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
        const priceNode = xml.querySelector(nodeNameByFuelType[values.fuelType]);
        const parsedPrice = Number(priceNode?.textContent ?? "");

        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
          throw new Error("Fuel price unavailable");
        }

        setValues((current) =>
          current.fuelType === values.fuelType
            ? { ...current, fuelUnitPrice: parsedPrice }
            : current
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
      preventScrolling: false,
      onCloseEnd: () => {
        document.body.style.overflow = "";
        document.body.style.width = "";
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
              fuelUnitPrice:
                parsedCustom.values.fuelUnitPrice ??
                DEFAULT_FUEL_PRICES[
                  (parsedCustom.values.fuelType ?? defaultValues.fuelType) as FuelType
                ],
            },
          } as CustomVehicle;
          setSavedCustomVehicle(normalizedCustomVehicle);
          setCustomVehicleDraft({
            year: String(normalizedCustomVehicle.year || ""),
            make: normalizedCustomVehicle.make || "",
            model: normalizedCustomVehicle.model || "",
            fuelType: normalizedCustomVehicle.values.fuelType || "regular",
          });
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
            fuelUnitPrice:
              parsedState.values.fuelUnitPrice ??
              DEFAULT_FUEL_PRICES[
                (parsedState.values.fuelType ?? defaultValues.fuelType) as FuelType
              ],
          });
          setRecurringType(parsedState.recurringType);
          setSelectedSource(parsedState.selectedSource ?? "default");
          setSelectedTemplateId(parsedState.selectedTemplateId ?? null);
          if (parsedState.selectedSource === "template" && parsedState.selectedTemplateId) {
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
      document.body.style.overflow = "";
      document.body.style.width = "";
      modalInstanceRef.current?.destroy();
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
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(CAR_COST_STORAGE_KEY, JSON.stringify(nextState));
  }, [hasResolvedStartupChoice, recurringType, selectedSource, selectedTemplateId, values]);

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
    (name: "includeDepreciation" | "includeAnnualOwnership") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({
        ...current,
        [name]: event.target.checked ? 1 : 0,
      }));
    };

  const applySelection = (
    source: "default" | "template" | "custom",
    nextValues: CarCostValues,
    nextRecurringType: RecurringType,
    nextTemplateId: string | null
  ) => {
    setSelectedSource(source);
    setSelectedTemplateId(nextTemplateId);
    setValues(nextValues);
    setRecurringType(nextRecurringType);
    if (source === "default") {
      setCustomVehicleDraft({ year: "", make: "", model: "", fuelType: "regular" });
    }
    setHasResolvedStartupChoice(true);
    modalInstanceRef.current?.close();
  };

  const handleLoadStartupTemplate = () => {
    const matchingTemplate = typedTemplates.find((template) => template.id === startupTemplateId);
    if (!matchingTemplate) {
      M.toast({ html: "Choose a template to get started", displayLength: 2500 });
      return;
    }

    const plannerValues = getPlannerValues(values);
    applySelection(
      "template",
      applyPlannerValues(matchingTemplate.values, plannerValues),
      recurringType,
      matchingTemplate.id
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

  const handleFuelTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextFuelType = event.target.value as FuelType;
    setValues((current) => ({
      ...current,
      fuelType: nextFuelType,
      fuelUnitPrice: DEFAULT_FUEL_PRICES[nextFuelType],
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

  const parsedCustomVehicleYear = Number(customVehicleDraft.year);
  const currentModelYear = new Date().getFullYear() + 1;
  const isCustomVehicleValid =
    Number.isInteger(parsedCustomVehicleYear) &&
    parsedCustomVehicleYear >= 1886 &&
    parsedCustomVehicleYear <= currentModelYear &&
    customVehicleDraft.make.trim().length > 0 &&
    customVehicleDraft.model.trim().length > 0;

  const handleStartWithOwnCar = () => {
    if (!isCustomVehicleValid) {
      M.toast({ html: "Enter a valid year, make, and model", displayLength: 2500 });
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
    localStorage.setItem(CAR_COST_CUSTOM_KEY, JSON.stringify(nextCustomVehicle));
    applySelection("custom", nextCustomVehicle.values, "day", "custom");
    M.toast({ html: `Loaded ${nextCustomVehicle.title}`, displayLength: 2500 });
  };

  const handleOpenOwnCarModal = () => {
    setCustomVehicleDraft({ year: "", make: "", model: "", fuelType: "regular" });
    modalInstanceRef.current?.open();
  };

  const calculations = useMemo(() => {
    const fuelCostPerMile =
      values.fuelEfficiency > 0 ? values.fuelUnitPrice / values.fuelEfficiency : 0;
    const oilCostPerMile =
      values.oilChangeInterval > 0 ? values.oilChangeCost / values.oilChangeInterval : 0;
    const tireCostPerMile =
      values.tireInterval > 0 ? values.tireCost / values.tireInterval : 0;
    const miscCostPerMile =
      values.miscMaintenanceInterval > 0
        ? values.miscMaintenanceCost / values.miscMaintenanceInterval
        : 0;
    const depreciationCostPerMile =
      isToggleEnabled(values.includeDepreciation) && values.depreciationInterval > 0
        ? Math.max(values.purchasePrice - values.resaleValue, 0) /
          values.depreciationInterval
        : 0;
    const variableCostPerMile =
      fuelCostPerMile +
      oilCostPerMile +
      tireCostPerMile +
      miscCostPerMile +
      depreciationCostPerMile;

    const annualMileageByType: Record<RecurringType, number> = {
      day: values.recurringMiles * 365,
      week: values.recurringMiles * 52,
      month: values.recurringMiles * 12,
      year: values.recurringMiles,
    };

    const annualMileage = annualMileageByType[recurringType];
    const annualFixedCosts =
      isToggleEnabled(values.includeAnnualOwnership)
        ? values.annualInsurance +
          values.annualRegistration +
          values.annualParking +
          values.annualInspection +
          values.annualRoadside
        : 0;
    const fixedCostPerMile = annualMileage > 0 ? annualFixedCosts / annualMileage : 0;
    const trueCostPerMile = variableCostPerMile + fixedCostPerMile;
    const tripCost = values.tripDistance * trueCostPerMile;
    const recurringDrivingCosts = {
      day: (annualMileage * variableCostPerMile) / 365,
      week: (annualMileage * variableCostPerMile) / 52,
      month: (annualMileage * variableCostPerMile) / 12,
      year: annualMileage * variableCostPerMile,
    };
    const recurringTrueCosts = {
      day: recurringDrivingCosts.day + annualFixedCosts / 365,
      week: recurringDrivingCosts.week + annualFixedCosts / 52,
      month: recurringDrivingCosts.month + annualFixedCosts / 12,
      year: recurringDrivingCosts.year + annualFixedCosts,
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
      fixedCostPerMile,
      trueCostPerMile,
      tripCost,
      recurringDrivingCosts,
      recurringTrueCosts,
    };
  }, [recurringType, values]);

  const breakdownItems: CostBreakdownItem[] = [
    { label: "Fuel", value: calculations.fuelCostPerMile, color: "#b85c38" },
    { label: "Oil changes", value: calculations.oilCostPerMile, color: "#d47a4d" },
    { label: "Tires", value: calculations.tireCostPerMile, color: "#8f633c" },
    { label: "Misc. maintenance", value: calculations.miscCostPerMile, color: "#d9a15d" },
    { label: "Depreciation", value: calculations.depreciationCostPerMile, color: "#6f8f72" },
    { label: "Ownership overhead", value: calculations.fixedCostPerMile, color: "#4f6d7a" },
  ].filter((item) => item.value > 0);

  let cumulativePercentage = 0;
  const pieSlices = breakdownItems.map((item) => {
    const percentage =
      calculations.trueCostPerMile > 0 ? item.value / calculations.trueCostPerMile : 0;
    const path = buildPieSlice(percentage, cumulativePercentage, 44);
    const midpointPercentage = cumulativePercentage + percentage / 2;
    const midAngle = midpointPercentage * Math.PI * 2 - Math.PI / 2;
    const offsetDistance = activeBreakdownLabel === item.label ? 5 : 0;
    const offsetX = Math.cos(midAngle) * offsetDistance;
    const offsetY = Math.sin(midAngle) * offsetDistance;
    cumulativePercentage += percentage;

    return {
      ...item,
      percentage,
      path,
      offsetX,
      offsetY,
    };
  });

  const activeBreakdown =
    activeBreakdownLabel !== null
      ? pieSlices.find((slice) => slice.label === activeBreakdownLabel) ?? null
      : null;

  const handleBreakdownHover = (
    label: string,
    event: React.MouseEvent<SVGPathElement | HTMLElement>
  ) => {
    setActiveBreakdownLabel(label);
    setTooltipPosition({
      x: event.clientX + 18,
      y: event.clientY + 18,
    });
  };

  const handleBreakdownCardHover = (label: string) => {
    setActiveBreakdownLabel(label);
    setTooltipPosition(null);
  };

  const handleBreakdownLeave = () => {
    setActiveBreakdownLabel(null);
    setTooltipPosition(null);
  };

  const summaryCards = [
    { label: "Fuel", value: calculations.fuelCostPerMile },
    { label: "Oil changes", value: calculations.oilCostPerMile },
    { label: "Tires", value: calculations.tireCostPerMile },
    { label: "Misc. maintenance", value: calculations.miscCostPerMile },
    { label: "Depreciation", value: calculations.depreciationCostPerMile },
    { label: "Ownership overhead", value: calculations.fixedCostPerMile },
    {
      label: "True cost per mile",
      value: calculations.trueCostPerMile,
      highlight: true,
    },
  ];

  const templateOptions = [
    ...typedTemplates.map((template) => ({
      id: template.id,
      title: `${template.year} ${template.make} ${template.model}`,
    })),
    ...(savedCustomVehicle
      ? [{ id: "custom", title: `${savedCustomVehicle.title} (Saved custom)` }]
      : []),
  ];

  const currentVehicleLabel =
    selectedSource === "custom"
      ? savedCustomVehicle?.title ?? "Your vehicle"
      : (() => {
          const matchingTemplate = typedTemplates.find(
            (template) => template.id === selectedTemplateId
          );
          return matchingTemplate
            ? `${matchingTemplate.year} ${matchingTemplate.make} ${matchingTemplate.model}`
            : "Vehicle template";
        })();

  const fuelEfficiencyLabel =
    values.fuelType === "electric" ? "Efficiency (mi/kWh)" : "Fuel mileage (MPG)";
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

  return (
    <div className="container flow-text" style={{ paddingBottom: "3rem" }}>
      <div id="car-cost-restore-modal" className="modal" ref={modalRef}>
        <div
          className="modal-content"
          style={{
            background: palette.panelBackground,
            color: palette.text,
          }}
        >
          <h4>Choose how you want to get started</h4>
          <p style={{ color: palette.muted }}>
            You can load a realistic starter example, or enter your own car and
            begin with a fresh calculator state.
          </p>
          <div className="row" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
            <div className="col s12 l6" style={{ marginBottom: "1rem" }}>
              <div style={{ ...cardStyle, padding: "1.25rem", height: "100%", background: palette.subtlePanel }}>
                <h5 style={{ marginTop: 0 }}>Use a starter example</h5>
                <p style={{ color: palette.muted }}>
                  Pick one of the built-in vehicles to see how the calculator behaves
                  with realistic sample values.
                </p>
                <label
                  htmlFor="startupTemplate"
                  style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
                >
                  Example vehicle
                </label>
                <div style={{ ...inputContainerStyle, position: "relative" }}>
                  <select
                    id="startupTemplate"
                    className="browser-default"
                    value={startupTemplateId}
                    onChange={(event) => setStartupTemplateId(event.target.value)}
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
                  Load example
                </button>
              </div>
            </div>

            <div className="col s12 l6" style={{ marginBottom: "1rem" }}>
              <div style={{ ...cardStyle, padding: "1.25rem", height: "100%", background: palette.subtlePanel }}>
                <h5 style={{ marginTop: 0 }}>Check with my own car</h5>
                <p style={{ color: palette.muted }}>
                  Enter your vehicle details to begin with a fresh state tied to your
                  own car.
                </p>
                <div className="row" style={{ marginBottom: 0 }}>
                  <div className="col s12">
                    <label
                      htmlFor="customVehicleYear"
                      style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
                    >
                      Year
                    </label>
                    <div style={inputContainerStyle}>
                      <input
                        id="customVehicleYear"
                        type="number"
                        min="1886"
                        max={`${currentModelYear}`}
                        step="1"
                        value={customVehicleDraft.year}
                        onChange={handleCustomVehicleDraftChange("year")}
                        placeholder="2020"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div className="col s12 m6">
                    <label
                      htmlFor="customVehicleMake"
                      style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
                    >
                      Make
                    </label>
                    <div style={inputContainerStyle}>
                      <input
                        id="customVehicleMake"
                        type="text"
                        value={customVehicleDraft.make}
                        onChange={handleCustomVehicleDraftChange("make")}
                        placeholder="Toyota"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div className="col s12 m6">
                    <label
                      htmlFor="customVehicleModel"
                      style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
                    >
                      Model
                    </label>
                    <div style={inputContainerStyle}>
                      <input
                        id="customVehicleModel"
                        type="text"
                        value={customVehicleDraft.model}
                        onChange={handleCustomVehicleDraftChange("model")}
                        placeholder="Camry"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div className="col s12">
                    <label
                      htmlFor="customVehicleFuelType"
                      style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
                    >
                      Fuel type
                    </label>
                    <div style={{ ...inputContainerStyle, position: "relative" }}>
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
                <p style={{ color: palette.muted, fontSize: "0.92rem", margin: "0.5rem 0 0" }}>
                  Year must be between 1886 and {currentModelYear}.
                </p>
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
                  Calculate with this vehicle
                </button>
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
                <strong style={{ display: "block", fontSize: "1.15rem" }}>{currentVehicleLabel}</strong>
              </div>
            ) : null}
            <div style={{ flex: isMobileView ? "1 1 0" : "1 1 280px" }}>
              {!isMobileView ? (
                <label
                  htmlFor="vehicleTemplateSwitcher"
                  style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
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
                      : selectedTemplateId ?? typedTemplates[0]?.id ?? ""
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
                {isMobileView ? "Use my own" : "Use one of my cars"}
              </button>
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
              Plug in fuel, maintenance, tires, depreciation, and yearly ownership
              costs to get a clearer picture of what driving really costs.
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
              <h3 style={{ marginTop: 0, fontSize: "1.2rem" }}>Why I built this</h3>
              <p style={{ color: palette.muted, lineHeight: 1.65 }}>
                I built this to help people understand the true cost of driving
                their vehicle. Most people focus on fuel first, and while that is a
                major part of the equation, it often does not tell the full story.
              </p>
              <p style={{ color: palette.muted, lineHeight: 1.65, marginBottom: 0 }}>
                That gap matters even more in the gig economy, where drivers may
                overestimate their real profit, and for families deciding whether it
                makes more sense to take their daily driver or rent a vehicle for a
                longer trip.
              </p>
            </div>
          </div>

          <div className="col s12 l5" style={{ marginBottom: "1rem" }}>
            {summaryCards.map((card) => (
              <article
                key={card.label}
                style={{
                  ...cardStyle,
                  ...stackedCardStyle,
                  padding: "1rem 1.2rem",
                  color: card.highlight ? "#fff" : palette.text,
                  background: card.highlight
                    ? palette.summaryHighlight
                    : palette.cardBackground,
                }}
              >
                <span
                  style={{
                    display: "block",
                    color: card.highlight ? "rgba(255,255,255,0.82)" : palette.muted,
                    marginBottom: "0.35rem",
                  }}
                >
                  {card.label}
                </span>
                <strong style={{ fontSize: "1.9rem", lineHeight: 1 }}>
                  {formatCurrency(card.value)}
                </strong>
                <small
                  style={{
                    display: "block",
                    marginTop: "0.35rem",
                    color: card.highlight ? "rgba(255,255,255,0.82)" : palette.muted,
                  }}
                >
                  per mile
                </small>
              </article>
            ))}
          </div>
        </div>

        <div className="row" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
          {sections.map((section) => (
            <div key={section.title} className="col s12 m6 xl4" style={{ marginBottom: "1rem" }}>
              <section
                style={{
                  ...cardStyle,
                  padding: "1.5rem",
                  height: "100%",
                  opacity:
                    section.title === "Depreciation" && !isToggleEnabled(values.includeDepreciation)
                      ? 0.58
                      : section.title === "Annual ownership costs" &&
                          !isToggleEnabled(values.includeAnnualOwnership)
                        ? 0.58
                        : 1,
                }}
              >
                <h3 style={{ marginTop: 0 }}>{section.title}</h3>
                <p style={{ color: palette.muted, lineHeight: 1.5 }}>{section.description}</p>
                {section.title === "Depreciation" ? (
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
                      <span style={{ color: palette.text }}>Include depreciation</span>
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
                      <span style={{ color: palette.text }}>Include annual ownership costs</span>
                    </label>
                  </div>
                ) : null}
                {section.title === "Running costs" ? (
                  <div style={{ display: "grid", gap: "1rem", marginBottom: "1rem" }}>
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
                      <div style={{ ...inputContainerStyle, position: "relative" }}>
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
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
                <div style={{ display: "grid", gap: "1rem" }}>
                  {section.items.map((field) => (
                    <div key={field.name}>
                      <label
                        htmlFor={field.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.45rem",
                          fontWeight: 600,
                          marginBottom: "0.45rem",
                        }}
                      >
                        <span>{field.label}</span>
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
                      </label>
                      <div
                        style={inputContainerStyle}
                      >
                        {field.prefix ? (
                          <span style={prefixStyle}>
                            {field.prefix}
                          </span>
                        ) : null}
                        <input
                          id={field.name}
                          type="number"
                          min="0"
                          step={field.step}
                          value={values[field.name]}
                          onChange={handleChange(field.name)}
                          disabled={
                            (section.title === "Depreciation" &&
                              !isToggleEnabled(values.includeDepreciation)) ||
                            (section.title === "Annual ownership costs" &&
                              !isToggleEnabled(values.includeAnnualOwnership))
                          }
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ))}
        </div>

        <div className="row" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
          <div className="col s12 xl6" style={{ marginBottom: "1rem" }}>
            <section style={{ ...cardStyle, padding: "1.5rem", height: "100%" }}>
              <h3 style={{ marginTop: 0 }}>Trip estimate</h3>
              <p style={{ color: palette.muted, lineHeight: 1.5 }}>
                Multiply your true cost per mile by a route distance to estimate the
                total cost of the trip.
              </p>
              <label
                htmlFor="tripDistance"
                style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
              >
                Trip distance (miles)
              </label>
              <div
                style={inputContainerStyle}
              >
                <input
                  id="tripDistance"
                  type="number"
                  min="0"
                  step="1"
                  value={values.tripDistance}
                  onChange={handleChange("tripDistance")}
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
                <span style={{ display: "block", color: palette.muted }}>Total trip cost</span>
                <strong style={{ display: "block", fontSize: "2rem", lineHeight: 1.1 }}>
                  {formatCurrency(calculations.tripCost)}
                </strong>
                <small style={{ display: "block", color: palette.muted, marginTop: "0.4rem" }}>
                  {values.tripDistance.toFixed(0)} miles at{" "}
                  {formatCurrency(calculations.trueCostPerMile)} per mile
                </small>
                <p style={{ margin: "0.6rem 0 0", color: palette.muted }}>
                  Variable-only trip cost:{" "}
                  {formatCurrency(values.tripDistance * calculations.variableCostPerMile)}
                </p>
              </div>
            </section>
          </div>

          <div className="col s12 xl6" style={{ marginBottom: "1rem" }}>
            <section style={{ ...cardStyle, padding: "1.5rem", height: "100%" }}>
              <h3 style={{ marginTop: 0 }}>Recurring driving totals</h3>
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
                    style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
                  >
                    Miles
                  </label>
                  <div
                    style={inputContainerStyle}
                  >
                    <input
                      id="recurringMiles"
                      type="number"
                      min="0"
                      step="1"
                      value={values.recurringMiles}
                      onChange={handleChange("recurringMiles")}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ flex: "1 1 220px" }}>
                  <label
                    htmlFor="recurringType"
                    style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
                  >
                    Based on
                  </label>
                  <div style={{ ...inputContainerStyle, position: "relative" }}>
                    <select
                      id="recurringType"
                      className="browser-default"
                      value={recurringType}
                      onChange={(event) => setRecurringType(event.target.value as RecurringType)}
                      style={{ ...selectStyle, paddingRight: "2.75rem" }}
                    >
                      <option value="day">Miles per day</option>
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

              <div className="row" style={{ marginTop: "1.25rem", marginBottom: 0 }}>
                {(["day", "week", "month", "year"] as RecurringType[]).map((key) => (
                  <div key={key} className="col s12 m6" style={{ marginBottom: "1rem" }}>
                    <article
                      style={{
                        ...cardStyle,
                        padding: "1rem 1.1rem",
                        height: "100%",
                        background:
                          key === "year"
                            ? palette.yearlyHighlight
                            : palette.cardBackground,
                      }}
                    >
                      <span style={{ display: "block", color: palette.muted, marginBottom: "0.4rem" }}>
                        Per {key}
                      </span>
                      <strong style={{ fontSize: "1.6rem", lineHeight: 1 }}>
                        {formatCurrency(calculations.recurringTrueCosts[key])}
                      </strong>
                      <small
                        style={{ display: "block", marginTop: "0.45rem", color: palette.muted }}
                      >
                        Driving: {formatCurrency(calculations.recurringDrivingCosts[key])}
                      </small>
                    </article>
                  </div>
                ))}
              </div>

              <div className="row" style={{ marginTop: "1rem", marginBottom: 0 }}>
                <div className="col s12 m6" style={{ marginBottom: "1rem" }}>
                  <article style={{ ...cardStyle, padding: "1rem 1.1rem", height: "100%" }}>
                    <span style={{ display: "block", color: palette.muted, marginBottom: "0.4rem" }}>
                      Annual fixed ownership costs
                    </span>
                    <strong style={{ fontSize: "1.5rem", lineHeight: 1 }}>
                      {formatCurrency(calculations.annualFixedCosts)}
                    </strong>
                  </article>
                </div>
                <div className="col s12 m6" style={{ marginBottom: "1rem" }}>
                  <article style={{ ...cardStyle, padding: "1rem 1.1rem", height: "100%" }}>
                    <span style={{ display: "block", color: palette.muted, marginBottom: "0.4rem" }}>
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
              <h3 style={{ marginTop: 0 }}>True cost per mile breakdown</h3>
              <p style={{ color: palette.muted, lineHeight: 1.5 }}>
                This shows how much each category contributes to your true cost per mile,
                including annual ownership overhead.
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1.5rem",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    flex: "0 1 280px",
                    width: "100%",
                    maxWidth: "320px",
                    margin: "0 auto",
                    position: "relative",
                  }}
                >
                  <svg viewBox="0 0 100 100" style={{ width: "100%", display: "block" }}>
                    <circle cx="50" cy="50" r="44" fill={palette.chartBase} />
                    {pieSlices.map((slice) => (
                      <path
                        key={slice.label}
                        d={slice.path}
                        fill={slice.color}
                        transform={`translate(${slice.offsetX} ${slice.offsetY})`}
                        style={{
                          cursor: "pointer",
                          transition: "transform 180ms ease, filter 180ms ease",
                          filter:
                            activeBreakdownLabel === slice.label
                              ? "drop-shadow(0 0 6px rgba(0, 0, 0, 0.24))"
                              : "none",
                        }}
                        onMouseEnter={(event) => handleBreakdownHover(slice.label, event)}
                        onMouseMove={(event) => handleBreakdownHover(slice.label, event)}
                        onMouseLeave={handleBreakdownLeave}
                      />
                    ))}
                    <circle cx="50" cy="50" r="23" fill={palette.chartCenter} />
                    <text
                      x="50"
                      y="47"
                      textAnchor="middle"
                      style={{ fontSize: "5px", fill: palette.muted, fontWeight: 600 }}
                    >
                      True cost
                    </text>
                    <text
                      x="50"
                      y="54"
                      textAnchor="middle"
                      style={{ fontSize: "7px", fill: palette.text, fontWeight: 700 }}
                    >
                      {formatCurrency(calculations.trueCostPerMile)}
                    </text>
                    <text
                      x="50"
                      y="60"
                      textAnchor="middle"
                      style={{ fontSize: "4.3px", fill: palette.muted }}
                    >
                      per mile
                    </text>
                  </svg>
                </div>

                <div style={{ flex: "1 1 320px" }}>
                  <div className="row" style={{ marginBottom: 0 }}>
                    {pieSlices.map((slice) => (
                      <div key={slice.label} className="col s12 m6" style={{ marginBottom: "1rem" }}>
                        <article
                          style={{
                            ...cardStyle,
                            padding: "1rem 1.1rem",
                            height: "100%",
                            cursor: "pointer",
                            transform:
                              activeBreakdownLabel === slice.label ? "translateY(-2px)" : "none",
                            boxShadow:
                              activeBreakdownLabel === slice.label
                                ? isDarkMode
                                  ? "0 18px 38px rgba(0, 0, 0, 0.4)"
                                  : "0 18px 38px rgba(91, 60, 34, 0.18)"
                                : cardStyle.boxShadow,
                            transition: "transform 180ms ease, box-shadow 180ms ease",
                          }}
                          onMouseMove={() => handleBreakdownCardHover(slice.label)}
                          onMouseEnter={() => handleBreakdownCardHover(slice.label)}
                          onMouseLeave={handleBreakdownLeave}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.7rem",
                              marginBottom: "0.45rem",
                            }}
                          >
                            <span
                              style={{
                                width: "14px",
                                height: "14px",
                                borderRadius: "999px",
                                background: slice.color,
                                flex: "0 0 auto",
                              }}
                            />
                            <span style={{ fontWeight: 600 }}>{slice.label}</span>
                          </div>
                          <strong style={{ display: "block", fontSize: "1.4rem", lineHeight: 1.1 }}>
                            {formatCurrency(slice.value)}
                          </strong>
                          <small
                            style={{ display: "block", marginTop: "0.4rem", color: palette.muted }}
                          >
                            {formatPercent(slice.percentage * 100)} of true cost per mile
                          </small>
                        </article>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      {activeBreakdown && tooltipPosition ? (
        <div
          style={{
            position: "fixed",
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            minWidth: "220px",
            maxWidth: "260px",
            padding: "0.9rem 1rem",
            borderRadius: "16px",
            background: palette.tooltipBackground,
            border: palette.border,
            boxShadow: palette.shadow,
            color: palette.text,
            pointerEvents: "none",
            zIndex: 1200,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              marginBottom: "0.35rem",
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "999px",
                background: activeBreakdown.color,
                flex: "0 0 auto",
              }}
            />
            <strong style={{ fontSize: "0.98rem", lineHeight: 1.2 }}>
              {activeBreakdown.label}
            </strong>
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: 700, lineHeight: 1.2 }}>
            {formatCurrency(activeBreakdown.value)}
          </div>
          <small style={{ display: "block", marginTop: "0.3rem", color: palette.muted }}>
            {formatPercent(activeBreakdown.percentage * 100)} of true cost per mile
          </small>
        </div>
      ) : null}
    </div>
  );
};

export default CarCost;
