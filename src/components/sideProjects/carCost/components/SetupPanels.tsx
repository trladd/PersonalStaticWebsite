import React from "react";
import { CarCostCalculations } from "../utils/calculations";
import { formatCurrency, formatNumber, isToggleEnabled } from "../utils/formatters";
import { CarCostValues } from "../types";

type Palette = {
  text: string;
  muted: string;
};

type StyleBundle = {
  cardStyle: React.CSSProperties;
  inputContainerStyle: React.CSSProperties;
  invalidInputContainerStyle: React.CSSProperties;
  prefixStyle: React.CSSProperties;
  selectStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
  sectionDescriptionStyle: React.CSSProperties;
  fieldLabelStyle: React.CSSProperties;
  subFieldLabelStyle: React.CSSProperties;
};

type SetupPanelsProps = {
  values: CarCostValues;
  calculations: CarCostCalculations;
  palette: Palette;
  styles: StyleBundle;
  isMobileView: boolean;
  fuelEfficiencyLabel: string;
  fuelEfficiencyTooltip?: string | null;
  fuelPriceLabel: string;
  fuelPriceTooltip: string;
  handleFuelTypeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  depreciationIntervalTooltip: string;
  parkingTooltip: string;
  resaleWarningTooltip: string;
  getNumericDraftValue: (key: string, actualValue: number) => string;
  handleNumericFieldChange: (
    name: keyof CarCostValues,
    draftKey?: string,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleNumericFieldBlur: (
    name: keyof CarCostValues,
    draftKey?: string,
  ) => (event: React.FocusEvent<HTMLInputElement>) => void;
  handleNumericInputFocus: (event: React.FocusEvent<HTMLInputElement>) => void;
  handleToggleChange: (
    name:
      | "includeVehicleCost"
      | "includeDepreciation"
      | "includeAnnualOwnership"
      | "includeFinancing",
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleMiscMaintenanceBasisChange: (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => void;
  handleDepreciationBasisChange: (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => void;
  handleLoanPaymentModeChange: (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => void;
  handleAnnualMileageDraftChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  handleAnnualMileageBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
};

const runningFields: Array<{
  label: string;
  name: keyof CarCostValues;
  step: string;
  prefix?: string;
}> = [
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
];

const annualOwnershipFields: Array<{
  label: string;
  name: keyof CarCostValues;
  step: string;
  prefix?: string;
  tooltip?: string;
}> = [
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
];

const SelectCaret = ({ color }: { color: string }) => (
  <span
    aria-hidden="true"
    style={{
      position: "absolute",
      right: "1rem",
      top: "50%",
      transform: "translateY(-50%)",
      color,
      fontSize: "0.85rem",
      pointerEvents: "none",
    }}
  >
    ▼
  </span>
);

const NumericField = ({
  id,
  label,
  value,
  step,
  prefix,
  disabled,
  tooltip,
  warningTooltip,
  styles,
  onChange,
  onBlur,
  onFocus,
}: {
  id: string;
  label: string;
  value: string;
  step: string;
  prefix?: string;
  disabled?: boolean;
  tooltip?: string;
  warningTooltip?: string;
  styles: StyleBundle;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus: (event: React.FocusEvent<HTMLInputElement>) => void;
}) => (
  <div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.5rem",
      }}
    >
      <label htmlFor={id} style={styles.fieldLabelStyle}>
        {label}
      </label>
      {tooltip ? (
        <i
          className="material-icons tiny tooltipped"
          data-position="top"
          data-tooltip={tooltip}
          style={{ color: "var(--text-color)", cursor: "help" }}
        >
          info_outline
        </i>
      ) : null}
      {warningTooltip ? (
        <i
          className="material-icons tiny tooltipped"
          data-position="top"
          data-tooltip={warningTooltip}
          style={{ color: "#d28a33", cursor: "help" }}
        >
          warning_amber
        </i>
      ) : null}
    </div>
    <div style={styles.inputContainerStyle}>
      {prefix ? <span style={styles.prefixStyle}>{prefix}</span> : null}
      <input
        id={id}
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        disabled={disabled}
        style={styles.inputStyle}
      />
    </div>
  </div>
);

const SetupPanels: React.FC<SetupPanelsProps> = ({
  values,
  calculations,
  palette,
  styles,
  isMobileView,
  fuelEfficiencyLabel,
  fuelEfficiencyTooltip,
  fuelPriceLabel,
  fuelPriceTooltip,
  handleFuelTypeChange,
  depreciationIntervalTooltip,
  parkingTooltip,
  resaleWarningTooltip,
  getNumericDraftValue,
  handleNumericFieldChange,
  handleNumericFieldBlur,
  handleNumericInputFocus,
  handleToggleChange,
  handleMiscMaintenanceBasisChange,
  handleDepreciationBasisChange,
  handleLoanPaymentModeChange,
  handleAnnualMileageDraftChange,
  handleAnnualMileageBlur,
}) => {
  return (
    <div className="row" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
      <div className="col s12 m6 xl4" style={{ marginBottom: "1rem" }}>
        <section style={{ ...styles.cardStyle, padding: "1.5rem", height: "100%" }}>
          <h3 style={{ marginTop: 0 }}>Running costs</h3>
          <p style={styles.sectionDescriptionStyle}>
            Enter the costs and service intervals you want to spread across each mile.
          </p>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label htmlFor="fuelType" style={styles.fieldLabelStyle}>
                Fuel type
              </label>
              <div style={{ ...styles.inputContainerStyle, position: "relative" }}>
                <select
                  id="fuelType"
                  className="browser-default"
                  value={values.fuelType}
                  onChange={handleFuelTypeChange}
                  style={{ ...styles.selectStyle, paddingRight: "2.75rem" }}
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
                <SelectCaret color={palette.muted} />
              </div>
            </div>
            <NumericField
              id="fuelEfficiency"
              label={fuelEfficiencyLabel}
              tooltip={fuelEfficiencyTooltip ?? undefined}
              value={getNumericDraftValue("fuelEfficiency", values.fuelEfficiency)}
              step="0.1"
              styles={styles}
              onChange={handleNumericFieldChange("fuelEfficiency")}
              onBlur={handleNumericFieldBlur("fuelEfficiency")}
              onFocus={handleNumericInputFocus}
            />
            <NumericField
              id="fuelUnitPrice"
              label={fuelPriceLabel}
              value={getNumericDraftValue("fuelUnitPrice", values.fuelUnitPrice)}
              step="0.01"
              prefix="$"
              tooltip={fuelPriceTooltip}
              styles={styles}
              onChange={handleNumericFieldChange("fuelUnitPrice")}
              onBlur={handleNumericFieldBlur("fuelUnitPrice")}
              onFocus={handleNumericInputFocus}
            />
            {runningFields.map((field) =>
              field.name === "miscMaintenanceCost" ? (
                <React.Fragment key={field.name}>
                  <NumericField
                    id={field.name}
                    label={field.label}
                    value={getNumericDraftValue(field.name, Number(values[field.name]))}
                    step={field.step}
                    prefix={field.prefix}
                    styles={styles}
                    onChange={handleNumericFieldChange(field.name)}
                    onBlur={handleNumericFieldBlur(field.name)}
                    onFocus={handleNumericInputFocus}
                  />
                  <div>
                    <label htmlFor="miscMaintenanceBasis" style={styles.fieldLabelStyle}>
                      Misc. maintenance interval
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
                        gap: "0.75rem",
                      }}
                    >
                      <div>
                        <label htmlFor="miscMaintenanceBasis" style={styles.subFieldLabelStyle}>
                          Based on
                        </label>
                        <div style={{ ...styles.inputContainerStyle, position: "relative" }}>
                          <select
                            id="miscMaintenanceBasis"
                            className="browser-default"
                            value={values.miscMaintenanceBasis}
                            onChange={handleMiscMaintenanceBasisChange}
                            style={{ ...styles.selectStyle, paddingRight: "2.75rem" }}
                          >
                            <option value="miles">Miles</option>
                            <option value="month">Months</option>
                            <option value="year">Years</option>
                          </select>
                          <SelectCaret color={palette.muted} />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="miscMaintenanceInterval"
                          style={styles.subFieldLabelStyle}
                        >
                          Every
                        </label>
                        <div style={styles.inputContainerStyle}>
                          <input
                            id="miscMaintenanceInterval"
                            type="number"
                            min="0"
                            step="1"
                            value={getNumericDraftValue(
                              "miscMaintenanceInterval",
                              values.miscMaintenanceInterval,
                            )}
                            onChange={handleNumericFieldChange("miscMaintenanceInterval")}
                            onBlur={handleNumericFieldBlur("miscMaintenanceInterval")}
                            onFocus={handleNumericInputFocus}
                            style={styles.inputStyle}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ) : (
                <NumericField
                  key={field.name}
                  id={field.name}
                  label={field.label}
                  value={getNumericDraftValue(field.name, Number(values[field.name]))}
                  step={field.step}
                  prefix={field.prefix}
                  styles={styles}
                  onChange={handleNumericFieldChange(field.name)}
                  onBlur={handleNumericFieldBlur(field.name)}
                  onFocus={handleNumericInputFocus}
                />
              ),
            )}
          </div>
        </section>
      </div>

      <div className="col s12 m6 xl4" style={{ marginBottom: "1rem" }}>
        <section style={{ ...styles.cardStyle, padding: "1.5rem", height: "100%" }}>
          <h3 style={{ marginTop: 0 }}>Vehicle cost</h3>
          <p style={styles.sectionDescriptionStyle}>
            Estimate depreciation and, if applicable, financing costs tied to the vehicle itself.
          </p>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                cursor: "pointer",
                fontWeight: 500,
                color: palette.text,
              }}
            >
              <input
                type="checkbox"
                checked={isToggleEnabled(values.includeVehicleCost)}
                onChange={handleToggleChange("includeVehicleCost")}
              />
              <span>Include vehicle cost</span>
            </label>
          </div>
          <div
            style={{
              display: "grid",
              gap: "1rem",
              opacity: isToggleEnabled(values.includeVehicleCost) ? 1 : 0.62,
            }}
          >
            <NumericField
              id="purchasePrice"
              label="Purchase price"
              value={getNumericDraftValue("purchasePrice", values.purchasePrice)}
                step="0.01"
                prefix="$"
                styles={styles}
                disabled={!isToggleEnabled(values.includeVehicleCost)}
                onChange={handleNumericFieldChange("purchasePrice")}
                onBlur={handleNumericFieldBlur("purchasePrice")}
                onFocus={handleNumericInputFocus}
            />
            <div
              style={{
                marginTop: "-0.15rem",
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
                  disabled={!isToggleEnabled(values.includeVehicleCost)}
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
                  <NumericField
                    id="loanDownPayment"
                    label="Down payment"
                    value={getNumericDraftValue("loanDownPayment", values.loanDownPayment)}
                    step="0.01"
                    prefix="$"
                    styles={styles}
                    onChange={handleNumericFieldChange("loanDownPayment")}
                    onBlur={handleNumericFieldBlur("loanDownPayment")}
                    onFocus={handleNumericInputFocus}
                  />
                  <NumericField
                    id="loanApr"
                    label="APR (%)"
                    value={getNumericDraftValue("loanApr", values.loanApr)}
                    step="0.01"
                    styles={styles}
                    onChange={handleNumericFieldChange("loanApr")}
                    onBlur={handleNumericFieldBlur("loanApr")}
                    onFocus={handleNumericInputFocus}
                  />
                  <div>
                    <label htmlFor="loanPaymentMode" style={styles.subFieldLabelStyle}>
                      Based on
                    </label>
                    <div style={{ ...styles.inputContainerStyle, position: "relative" }}>
                      <select
                        id="loanPaymentMode"
                        className="browser-default"
                        value={values.loanPaymentMode}
                        onChange={handleLoanPaymentModeChange}
                        style={{ ...styles.selectStyle, paddingRight: "2.75rem" }}
                      >
                        <option value="months">Months financed</option>
                        <option value="payment">Monthly payment</option>
                      </select>
                      <SelectCaret color={palette.muted} />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor={
                        values.loanPaymentMode === "months"
                          ? "loanTermMonths"
                          : "loanMonthlyPayment"
                      }
                      style={styles.subFieldLabelStyle}
                    >
                      {values.loanPaymentMode === "months"
                        ? "Months financed"
                        : "Monthly payment"}
                    </label>
                    <div style={styles.inputContainerStyle}>
                      {values.loanPaymentMode === "payment" ? (
                        <span style={styles.prefixStyle}>$</span>
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
                            ? getNumericDraftValue("loanTermMonths", values.loanTermMonths)
                            : getNumericDraftValue(
                                "loanMonthlyPayment",
                                values.loanMonthlyPayment,
                              )
                        }
                        onChange={
                          values.loanPaymentMode === "months"
                            ? handleNumericFieldChange("loanTermMonths")
                            : handleNumericFieldChange("loanMonthlyPayment")
                        }
                        onBlur={
                          values.loanPaymentMode === "months"
                            ? handleNumericFieldBlur("loanTermMonths")
                            : handleNumericFieldBlur("loanMonthlyPayment")
                        }
                        onFocus={handleNumericInputFocus}
                        style={styles.inputStyle}
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
            <NumericField
              id="resaleValue"
              label="Expected resale value"
              value={getNumericDraftValue("resaleValue", values.resaleValue)}
              step="0.01"
              prefix="$"
                warningTooltip={
                  values.resaleValue > values.purchasePrice ? resaleWarningTooltip : undefined
                }
                styles={styles}
                disabled={!isToggleEnabled(values.includeVehicleCost)}
                onChange={handleNumericFieldChange("resaleValue")}
                onBlur={handleNumericFieldBlur("resaleValue")}
                onFocus={handleNumericInputFocus}
            />
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                }}
              >
                <label htmlFor="depreciationInterval" style={styles.fieldLabelStyle}>
                  Ownership length (years)
                </label>
                <i
                  className="material-icons tiny tooltipped"
                  data-position="top"
                  data-tooltip={depreciationIntervalTooltip}
                  style={{ color: "var(--text-color)", cursor: "help" }}
                >
                  info_outline
                </i>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <label htmlFor="depreciationBasis" style={styles.subFieldLabelStyle}>
                    Based on
                  </label>
                  <div style={{ ...styles.inputContainerStyle, position: "relative" }}>
                    <select
                      id="depreciationBasis"
                      className="browser-default"
                      value={values.depreciationBasis}
                      onChange={handleDepreciationBasisChange}
                      disabled={!isToggleEnabled(values.includeVehicleCost)}
                      style={{ ...styles.selectStyle, paddingRight: "2.75rem" }}
                    >
                      <option value="miles">Miles</option>
                      <option value="years">Years owned</option>
                    </select>
                    <SelectCaret color={palette.muted} />
                  </div>
                </div>
                <div>
                  <label htmlFor="depreciationInterval" style={styles.subFieldLabelStyle}>
                    {values.depreciationBasis === "miles" ? "Every" : "For"}
                  </label>
                  <div style={styles.inputContainerStyle}>
                    <input
                      id="depreciationInterval"
                      type="number"
                      min="0"
                      step="1"
                      value={getNumericDraftValue(
                        "depreciationInterval",
                        values.depreciationInterval,
                      )}
                      onChange={handleNumericFieldChange("depreciationInterval")}
                      onBlur={handleNumericFieldBlur("depreciationInterval")}
                      onFocus={handleNumericInputFocus}
                      disabled={!isToggleEnabled(values.includeVehicleCost)}
                      style={styles.inputStyle}
                    />
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "0.75rem" }}>
                <label
                  htmlFor="annualMileageVehicleCost"
                  style={styles.subFieldLabelStyle}
                >
                  Annual miles driven
                </label>
                <div style={styles.inputContainerStyle}>
                  <input
                    id="annualMileageVehicleCost"
                    type="number"
                    min="0"
                    step="1"
                    value={getNumericDraftValue(
                      "annualMileageVehicleCost",
                      Math.round(calculations.annualMileage),
                    )}
                      onChange={handleAnnualMileageDraftChange}
                      onBlur={handleAnnualMileageBlur}
                      onFocus={handleNumericInputFocus}
                      disabled={!isToggleEnabled(values.includeVehicleCost)}
                      style={styles.inputStyle}
                    />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="col s12 m6 xl4" style={{ marginBottom: "1rem" }}>
        <section style={{ ...styles.cardStyle, padding: "1.5rem", height: "100%" }}>
          <h3 style={{ marginTop: 0 }}>Annual ownership costs</h3>
          <p style={styles.sectionDescriptionStyle}>
            Add fixed yearly costs that happen whether you drive a lot or a little.
          </p>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                cursor: "pointer",
                fontWeight: 500,
                color: palette.text,
              }}
            >
              <input
                type="checkbox"
                checked={isToggleEnabled(values.includeAnnualOwnership)}
                onChange={handleToggleChange("includeAnnualOwnership")}
              />
              <span>Include annual ownership costs</span>
            </label>
          </div>
          <div
            style={{
              display: "grid",
              gap: "1rem",
              opacity: isToggleEnabled(values.includeAnnualOwnership) ? 1 : 0.62,
            }}
          >
            {annualOwnershipFields.map((field) => (
              <NumericField
                key={field.name}
                id={field.name}
                label={field.label}
                value={getNumericDraftValue(field.name, Number(values[field.name]))}
                step={field.step}
                prefix={field.prefix}
                tooltip={field.name === "annualParking" ? parkingTooltip : undefined}
                disabled={!isToggleEnabled(values.includeAnnualOwnership)}
                styles={styles}
                onChange={handleNumericFieldChange(field.name)}
                onBlur={handleNumericFieldBlur(field.name)}
                onFocus={handleNumericInputFocus}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SetupPanels;
