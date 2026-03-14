import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import M from "materialize-css";
import { ThemeContext } from "../../../utility/ThemeContext";

interface CarCostProps {
  navWrapperRef?: React.RefObject<HTMLDivElement>;
}

type CarCostValues = {
  fuelMileage: number;
  fuelCostPerGallon: number;
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
};

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
  values: CarCostValues;
  recurringType: RecurringType;
};

const defaultValues: CarCostValues = {
  fuelMileage: 25,
  fuelCostPerGallon: 3.5,
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
};

const sections: { title: string; description: string; items: FieldDefinition[] }[] = [
  {
    title: "Running costs",
    description:
      "Enter the costs and service intervals you want to spread across each mile.",
    items: [
      { label: "Fuel mileage (MPG)", name: "fuelMileage", step: "0.1" },
      {
        label: "Fuel cost per gallon",
        name: "fuelCostPerGallon",
        step: "0.01",
        prefix: "$",
      },
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

const CarCost: React.FC<CarCostProps> = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const [values, setValues] = useState<CarCostValues>(defaultValues);
  const [recurringType, setRecurringType] = useState<RecurringType>("day");
  const [hasResolvedRestore, setHasResolvedRestore] = useState(false);
  const [activeBreakdownLabel, setActiveBreakdownLabel] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalInstanceRef = useRef<M.Modal | null>(null);
  const pendingSavedStateRef = useRef<PersistedCarCostState | null>(null);

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
  }, [values, recurringType]);

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

    if (!savedState) {
      setHasResolvedRestore(true);
      return () => {
        modalInstanceRef.current?.destroy();
      };
    }

    try {
      const parsedState = JSON.parse(savedState) as PersistedCarCostState;
      if (parsedState?.values && parsedState?.recurringType) {
        pendingSavedStateRef.current = parsedState;
        modalInstanceRef.current.open();
      } else {
        localStorage.removeItem(CAR_COST_STORAGE_KEY);
        setHasResolvedRestore(true);
      }
    } catch (error) {
      localStorage.removeItem(CAR_COST_STORAGE_KEY);
      setHasResolvedRestore(true);
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.width = "";
      modalInstanceRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!hasResolvedRestore) {
      return;
    }

    const nextState: PersistedCarCostState = {
      values,
      recurringType,
    };

    localStorage.setItem(CAR_COST_STORAGE_KEY, JSON.stringify(nextState));
  }, [hasResolvedRestore, recurringType, values]);

  const handleChange =
    (name: keyof CarCostValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number(event.target.value);
      setValues((current) => ({
        ...current,
        [name]: Number.isNaN(nextValue) ? 0 : nextValue,
      }));
    };

  const handleRestoreSavedState = () => {
    if (pendingSavedStateRef.current) {
      setValues(pendingSavedStateRef.current.values);
      setRecurringType(pendingSavedStateRef.current.recurringType);
    }

    setHasResolvedRestore(true);
    modalInstanceRef.current?.close();
  };

  const handleUseDefaults = () => {
    pendingSavedStateRef.current = null;
    setValues(defaultValues);
    setRecurringType("day");
    localStorage.setItem(
      CAR_COST_STORAGE_KEY,
      JSON.stringify({ values: defaultValues, recurringType: "day" })
    );
    setHasResolvedRestore(true);
    modalInstanceRef.current?.close();
  };

  const calculations = useMemo(() => {
    const fuelCostPerMile =
      values.fuelMileage > 0 ? values.fuelCostPerGallon / values.fuelMileage : 0;
    const oilCostPerMile =
      values.oilChangeInterval > 0 ? values.oilChangeCost / values.oilChangeInterval : 0;
    const tireCostPerMile =
      values.tireInterval > 0 ? values.tireCost / values.tireInterval : 0;
    const miscCostPerMile =
      values.miscMaintenanceInterval > 0
        ? values.miscMaintenanceCost / values.miscMaintenanceInterval
        : 0;
    const depreciationCostPerMile =
      values.depreciationInterval > 0
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
      values.annualInsurance +
      values.annualRegistration +
      values.annualParking +
      values.annualInspection +
      values.annualRoadside;
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
          <h4>Restore saved calculator values?</h4>
          <p style={{ color: palette.muted }}>
            I found a previous `carCostState` in local storage. Would you like to
            restore your saved selections or start over with the default values?
          </p>
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
            className="modal-close waves-effect waves-light btn-flat"
            onClick={handleUseDefaults}
            style={{ color: palette.text }}
          >
            Use defaults
          </button>
          <button
            type="button"
            className="modal-close waves-effect waves-light btn primaryColor"
            onClick={handleRestoreSavedState}
            style={{ marginLeft: "0.75rem" }}
          >
            Restore saved
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
              <section style={{ ...cardStyle, padding: "1.5rem", height: "100%" }}>
                <h3 style={{ marginTop: 0 }}>{section.title}</h3>
                <p style={{ color: palette.muted, lineHeight: 1.5 }}>{section.description}</p>
                <div style={{ display: "grid", gap: "1rem" }}>
                  {section.items.map((field) => (
                    <div key={field.name}>
                      <label
                        htmlFor={field.name}
                        style={{
                          display: "block",
                          fontWeight: 600,
                          marginBottom: "0.45rem",
                        }}
                      >
                        {field.label}
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
                          onMouseMove={(event) => handleBreakdownHover(slice.label, event)}
                          onMouseEnter={(event) => handleBreakdownHover(slice.label, event)}
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
