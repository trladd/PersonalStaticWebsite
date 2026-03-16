import React from "react";
import SeeMoreButton from "./SeeMoreButton";
import { BreakdownMode } from "./CostBreakdownViewer";
import { CarCostCalculations } from "../utils/calculations";
import { formatCurrency, formatNumber, isToggleEnabled } from "../utils/formatters";
import { CarCostValues, RecurringType, TripType } from "../types";

type Palette = {
  muted: string;
  accentDark: string;
  resultHighlight: string;
  yearlyHighlight: string;
  cardBackground: string;
  text: string;
  softBorder: string;
};

type PlanningPanelsProps = {
  values: CarCostValues;
  calculations: CarCostCalculations;
  palette: Palette;
  cardStyle: React.CSSProperties;
  inputContainerStyle: React.CSSProperties;
  selectStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
  compactMetricCardPadding: string;
  compactMetricLabelStyle: React.CSSProperties;
  compactMetricValueStyle: React.CSSProperties;
  isMobileView: boolean;
  tripType: TripType;
  recurringType: RecurringType;
  recurringBreakdownMode: BreakdownMode;
  tripTypeButtonStyle: (isActive: boolean) => React.CSSProperties;
  setTripType: React.Dispatch<React.SetStateAction<TripType>>;
  setRecurringType: React.Dispatch<React.SetStateAction<RecurringType>>;
  getNumericDraftValue: (key: string, actualValue: number) => string;
  handleNumericFieldChange: (
    name: keyof CarCostValues,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleNumericFieldBlur: (
    name: keyof CarCostValues,
  ) => (event: React.FocusEvent<HTMLInputElement>) => void;
  handleNumericInputFocus: (event: React.FocusEvent<HTMLInputElement>) => void;
  openBreakdownModal: (
    mode: BreakdownMode,
    title: string,
    allowedModes: BreakdownMode[],
    category: "tripEstimate" | "recurringDrivingTotals",
  ) => void;
};

const PlanningPanels: React.FC<PlanningPanelsProps> = ({
  values,
  calculations,
  palette,
  cardStyle,
  inputContainerStyle,
  selectStyle,
  inputStyle,
  compactMetricCardPadding,
  compactMetricLabelStyle,
  compactMetricValueStyle,
  isMobileView,
  tripType,
  recurringType,
  recurringBreakdownMode,
  tripTypeButtonStyle,
  setTripType,
  setRecurringType,
  getNumericDraftValue,
  handleNumericFieldChange,
  handleNumericFieldBlur,
  handleNumericInputFocus,
  openBreakdownModal,
}) => {
  return (
    <div className="row" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
      <div className="col s12 xl6" style={{ marginBottom: "1rem" }}>
        <section style={{ ...cardStyle, padding: "1.5rem", height: "100%" }}>
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
                openBreakdownModal("trip", "Trip cost breakdown", ["mile", "trip"], "tripEstimate")
              }
              accentColor={palette.accentDark}
              ariaLabel="See more about the trip cost breakdown"
            />
          </div>
          <p style={{ color: palette.muted, lineHeight: 1.5 }}>
            Multiply your true cost per mile by a route distance to estimate the total cost of the trip.
          </p>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", marginBottom: "1rem" }}>
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
            style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
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
              value={getNumericDraftValue("tripDistance", values.tripDistance)}
              onChange={handleNumericFieldChange("tripDistance")}
              onBlur={handleNumericFieldBlur("tripDistance")}
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
            <span style={{ display: "block", color: palette.muted }}>Total trip cost</span>
            <strong style={{ display: "block", fontSize: "2rem", lineHeight: 1.1 }}>
              {formatCurrency(calculations.tripCost)}
            </strong>
            <small style={{ display: "block", color: palette.muted, marginTop: "0.4rem" }}>
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
                calculations.selectedTripDistance * calculations.variableCostPerMile,
              )}
            </p>
          </div>
        </section>
      </div>

      <div className="col s12 xl6" style={{ marginBottom: "1rem" }}>
        <section style={{ ...cardStyle, padding: "1.5rem", height: "100%" }}>
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
            Enter miles by day, week, month, or year to see equivalent cost across every timeframe.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ flex: "1 1 220px" }}>
              <label
                htmlFor="recurringMiles"
                style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
              >
                Miles
              </label>
              <div style={inputContainerStyle}>
                <input
                  id="recurringMiles"
                  type="number"
                  min="0"
                  step="1"
                  value={getNumericDraftValue("recurringMiles", values.recurringMiles)}
                  onChange={handleNumericFieldChange("recurringMiles")}
                  onBlur={handleNumericFieldBlur("recurringMiles")}
                  onFocus={handleNumericInputFocus}
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

          <div className="row" style={{ marginTop: "1.25rem", marginBottom: 0 }}>
            {(["day", "week", "month", "year"] as const).map((key) => (
              <div key={key} className="col s6 m6" style={{ marginBottom: "1rem" }}>
                <article
                  style={{
                    ...cardStyle,
                    position: "relative",
                    padding: compactMetricCardPadding,
                    height: "100%",
                    background:
                      key === "year" ? palette.yearlyHighlight : palette.cardBackground,
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
                    buttonStyle={{ position: "absolute", top: "0.35rem", right: "0.35rem" }}
                    iconStyle={{ fontSize: "1rem" }}
                  />
                  <span style={compactMetricLabelStyle}>Per {key}</span>
                  <strong
                    style={{ fontSize: isMobileView ? "1.25rem" : "1.6rem", lineHeight: 1 }}
                  >
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
                    Driving: {formatCurrency(calculations.recurringDrivingCosts[key])}
                  </small>
                </article>
              </div>
            ))}
          </div>

          <div className="row" style={{ marginTop: "1rem", marginBottom: 0 }}>
            <div
              className={`col s6 ${
                isToggleEnabled(values.includeVehicleCost) &&
                isToggleEnabled(values.includeFinancing)
                  ? "m4"
                  : "m6"
              }`}
              style={{ marginBottom: "1rem" }}
            >
              <article style={{ ...cardStyle, padding: compactMetricCardPadding, height: "100%" }}>
                <span style={compactMetricLabelStyle}>Annual fixed ownership costs</span>
                <strong style={compactMetricValueStyle}>
                  {formatCurrency(calculations.annualFixedCosts)}
                </strong>
              </article>
            </div>
            {isToggleEnabled(values.includeVehicleCost) &&
            isToggleEnabled(values.includeFinancing) ? (
              <div className="col s6 m4" style={{ marginBottom: "1rem" }}>
                <article style={{ ...cardStyle, padding: compactMetricCardPadding, height: "100%" }}>
                  <span style={compactMetricLabelStyle}>Annual financing cost</span>
                  <strong style={compactMetricValueStyle}>
                    {formatCurrency(calculations.annualFinanceCost)}
                  </strong>
                </article>
              </div>
            ) : null}
            <div
              className={`col s6 ${
                isToggleEnabled(values.includeVehicleCost) &&
                isToggleEnabled(values.includeFinancing)
                  ? "m4"
                  : "m6"
              }`}
              style={{ marginBottom: "1rem" }}
            >
              <article style={{ ...cardStyle, padding: compactMetricCardPadding, height: "100%" }}>
                <span style={compactMetricLabelStyle}>Annual miles assumed</span>
                <strong style={compactMetricValueStyle}>
                  {formatNumber(calculations.annualMileage)}
                </strong>
              </article>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PlanningPanels;
