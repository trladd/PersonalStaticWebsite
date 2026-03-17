import React from "react";
import { CAR_COST_FIELD_TOOLTIPS } from "../config/constants";
import { CarCostCalculations } from "../utils/calculations";
import { formatCurrency, formatNumber, isToggleEnabled } from "../utils/formatters";
import { CarCostValues, DrivingMileageUnit, IntervalSetting } from "../types";
import IntervalSettingField from "./IntervalSettingField";
import DrivingMileageField from "./DrivingMileageField";

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
  fuelEfficiencyWarningTooltip?: string | null;
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
      | "showAdvancedMaintenance"
      | "includeWinterTires"
      | "includeTripFuelOverride"
      | "includeVehicleCost"
      | "includeDepreciation"
      | "includeAnnualOwnership"
      | "includeFinancing",
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleIntervalSettingSelectionChange: (
    name:
      | "miscMaintenanceSchedule"
      | "brakeServiceSchedule"
      | "batteryReplacementSchedule"
      | "majorServiceSchedule"
      | "repairBufferSchedule",
  ) => (selection: "mile" | "month" | "year") => void;
  handleIntervalSettingValueChange: (
    name:
      | "miscMaintenanceSchedule"
      | "brakeServiceSchedule"
      | "batteryReplacementSchedule"
      | "majorServiceSchedule"
      | "repairBufferSchedule",
    draftKey?: string,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleIntervalSettingValueBlur: (
    name:
      | "miscMaintenanceSchedule"
      | "brakeServiceSchedule"
      | "batteryReplacementSchedule"
      | "majorServiceSchedule"
      | "repairBufferSchedule",
    draftKey?: string,
  ) => (event: React.FocusEvent<HTMLInputElement>) => void;
  handleDepreciationBasisChange: (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => void;
  handleLoanPaymentModeChange: (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => void;
  onDrivingMileageUnitChange: (unit: DrivingMileageUnit) => void;
  onDrivingMileageValueChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrivingMileageValueBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
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
];

const advancedMaintenanceFields: Array<{
  key:
    | "brakeService"
    | "batteryReplacement"
    | "majorService"
    | "repairBuffer";
  label: string;
  costName:
    | "brakeServiceCost"
    | "batteryReplacementCost"
    | "majorServiceCost"
    | "repairBufferCost";
  scheduleName:
    | "brakeServiceSchedule"
    | "batteryReplacementSchedule"
    | "majorServiceSchedule"
    | "repairBufferSchedule";
}> = [
  {
    key: "brakeService",
    label: "Brakes",
    costName: "brakeServiceCost",
    scheduleName: "brakeServiceSchedule",
  },
  {
    key: "batteryReplacement",
    label: "Battery",
    costName: "batteryReplacementCost",
    scheduleName: "batteryReplacementSchedule",
  },
  {
    key: "majorService",
    label: "Major service",
    costName: "majorServiceCost",
    scheduleName: "majorServiceSchedule",
  },
  {
    key: "repairBuffer",
    label: "Repair buffer",
    costName: "repairBufferCost",
    scheduleName: "repairBufferSchedule",
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

const CostPill = ({
  value,
  palette,
}: {
  value: number;
  palette: Palette;
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      borderRadius: "999px",
      padding: "0.18rem 0.55rem",
      fontSize: "0.78rem",
      fontWeight: 700,
      lineHeight: 1,
      background: "rgba(184, 92, 56, 0.12)",
      color: palette.text,
      border: "1px solid rgba(184, 92, 56, 0.18)",
      whiteSpace: "nowrap",
    }}
  >
    {formatCurrency(value)}/mi
  </span>
);

const ToggleField = ({
  label,
  checked,
  onChange,
  palette,
  tooltip,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  palette: Palette;
  tooltip?: string;
  disabled?: boolean;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem",
      flexWrap: "wrap",
    }}
  >
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.45rem",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 500,
        color: palette.text,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span>{label}</span>
    </label>
    {tooltip ? (
      <i
        className="material-icons tiny tooltipped"
        data-position="top"
        data-tooltip={tooltip}
        style={{ color: "var(--text-color)", cursor: "help", flex: "0 0 auto" }}
      >
        info_outline
      </i>
    ) : null}
  </div>
);

const AccordionSection = ({
  title,
  costPerMile,
  palette,
  defaultOpen = false,
  children,
}: {
  title: string;
  costPerMile: number;
  palette: Palette;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div
      style={{
        borderRadius: "16px",
        border: "1px solid rgba(79, 109, 122, 0.14)",
        background: isOpen ? "rgba(255, 255, 255, 0.36)" : "rgba(255, 255, 255, 0.28)",
        overflow: "hidden",
        transition: "background 180ms ease, border-color 180ms ease",
      }}
    >
      <button
        type="button"
        className="btn-flat"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        style={{
          width: "100%",
          minHeight: "unset",
          height: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          padding: "0.8rem 0.85rem",
          color: palette.text,
          textTransform: "none",
          borderBottom: isOpen ? "1px solid rgba(79, 109, 122, 0.1)" : "none",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            fontWeight: 700,
            color: palette.text,
          }}
        >
          {title}
          <i
            className="material-icons tiny"
            style={{
              color: palette.muted,
              transition: "transform 180ms ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            expand_more
          </i>
        </span>
        <CostPill value={costPerMile} palette={palette} />
      </button>
      <div
        style={{
          display: "grid",
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          transition: "grid-template-rows 220ms ease",
        }}
      >
        <div
          style={{
            overflow: "hidden",
            opacity: isOpen ? 1 : 0,
            transition: "opacity 180ms ease",
          }}
        >
          <div
            style={{
              padding: "0.15rem 0.3rem 0.8rem",
              display: "grid",
              gap: "0.85rem",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const SetupPanels: React.FC<SetupPanelsProps> = ({
  values,
  calculations,
  palette,
  styles,
  isMobileView,
  fuelEfficiencyLabel,
  fuelEfficiencyTooltip,
  fuelEfficiencyWarningTooltip,
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
  handleIntervalSettingSelectionChange,
  handleIntervalSettingValueChange,
  handleIntervalSettingValueBlur,
  handleDepreciationBasisChange,
  handleLoanPaymentModeChange,
  onDrivingMileageUnitChange,
  onDrivingMileageValueChange,
  onDrivingMileageValueBlur,
}) => {
  const maintenanceCostPerMile =
    calculations.oilCostPerMile + calculations.miscCostPerMile;

  return (
    <div className="row" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
      <div className="col s12 m6 xl4" style={{ marginBottom: "1rem" }}>
        <section style={{ ...styles.cardStyle, padding: "1.5rem", height: "100%" }}>
          <h3 style={{ marginTop: 0 }}>Running costs</h3>
          <p style={styles.sectionDescriptionStyle}>
            Enter the costs and service intervals you want to spread across each mile.
          </p>
          <div style={{ display: "grid", gap: "0.85rem" }}>
            <AccordionSection
              title="Fuel"
              costPerMile={calculations.fuelCostPerMile}
              palette={palette}
              defaultOpen
            >
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
                warningTooltip={fuelEfficiencyWarningTooltip ?? undefined}
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
            </AccordionSection>

            <AccordionSection
              title="Tires"
              costPerMile={calculations.tireCostPerMile}
              palette={palette}
            >
              <div
                style={{
                  display: "grid",
                  gap: "1rem",
                  padding: "0.75rem",
                  borderRadius: "16px",
                  background: "rgba(184, 92, 56, 0.04)",
                  border: "1px solid rgba(184, 92, 56, 0.1)",
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, color: palette.text }}>
                  All-season or summer tires
                </p>
                {runningFields
                  .filter((field) => field.name === "tireCost" || field.name === "tireInterval")
                  .map((field) => (
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
                  ))}
                <NumericField
                  id="tireMaxAgeYears"
                  label="Tire max age (years)"
                  tooltip={CAR_COST_FIELD_TOOLTIPS.tireMaxAgeYears}
                  value={getNumericDraftValue("tireMaxAgeYears", values.tireMaxAgeYears)}
                  step="1"
                  styles={styles}
                  onChange={handleNumericFieldChange("tireMaxAgeYears")}
                  onBlur={handleNumericFieldBlur("tireMaxAgeYears")}
                  onFocus={handleNumericInputFocus}
                />
                <ToggleField
                  label="Add winter tires"
                  checked={isToggleEnabled(values.includeWinterTires)}
                  onChange={handleToggleChange("includeWinterTires")}
                  palette={palette}
                  tooltip={CAR_COST_FIELD_TOOLTIPS.includeWinterTires}
                />
              </div>
              {isToggleEnabled(values.includeWinterTires) ? (
                <div
                  style={{
                    display: "grid",
                    gap: "1rem",
                    padding: "0.85rem",
                    borderRadius: "16px",
                    background: "rgba(111, 143, 114, 0.08)",
                    border: "1px solid rgba(111, 143, 114, 0.14)",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 700, color: palette.text }}>
                    Winter tires
                  </p>
                  <NumericField
                    id="winterTireCost"
                    label="Winter tire set cost"
                    value={getNumericDraftValue("winterTireCost", values.winterTireCost)}
                    step="0.01"
                    prefix="$"
                    styles={styles}
                    onChange={handleNumericFieldChange("winterTireCost")}
                    onBlur={handleNumericFieldBlur("winterTireCost")}
                    onFocus={handleNumericInputFocus}
                  />
                  <NumericField
                    id="winterTireInterval"
                    label="Winter tire tread life (miles)"
                    value={getNumericDraftValue(
                      "winterTireInterval",
                      values.winterTireInterval,
                    )}
                    step="1"
                    styles={styles}
                    onChange={handleNumericFieldChange("winterTireInterval")}
                    onBlur={handleNumericFieldBlur("winterTireInterval")}
                    onFocus={handleNumericInputFocus}
                  />
                  <NumericField
                    id="winterTireMaxAgeYears"
                    label="Winter tire max age (years)"
                    tooltip={CAR_COST_FIELD_TOOLTIPS.winterTireMaxAgeYears}
                    value={getNumericDraftValue(
                      "winterTireMaxAgeYears",
                      values.winterTireMaxAgeYears,
                    )}
                    step="1"
                    styles={styles}
                    onChange={handleNumericFieldChange("winterTireMaxAgeYears")}
                    onBlur={handleNumericFieldBlur("winterTireMaxAgeYears")}
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
                      <label htmlFor="winterTireMonths" style={styles.fieldLabelStyle}>
                        Months winter tires are used
                      </label>
                      <i
                        className="material-icons tiny tooltipped"
                        data-position="top"
                        data-tooltip={CAR_COST_FIELD_TOOLTIPS.winterTireMonths}
                        style={{ color: "var(--text-color)", cursor: "help" }}
                      >
                        info_outline
                      </i>
                    </div>
                    <div style={{ ...styles.inputContainerStyle, position: "relative" }}>
                      <select
                        id="winterTireMonths"
                        className="browser-default"
                        value={values.winterTireMonths}
                        onChange={(event) =>
                          handleNumericFieldChange("winterTireMonths")({
                            ...event,
                            target: {
                              ...event.target,
                              value: event.target.value,
                            },
                          } as unknown as React.ChangeEvent<HTMLInputElement>)
                        }
                        style={{ ...styles.selectStyle, paddingRight: "2.75rem" }}
                      >
                        {Array.from({ length: 11 }, (_, index) => index + 1).map(
                          (monthCount) => (
                            <option key={monthCount} value={monthCount}>
                              {monthCount}
                            </option>
                          ),
                        )}
                      </select>
                      <SelectCaret color={palette.muted} />
                    </div>
                  </div>
                </div>
              ) : null}
            </AccordionSection>

            <AccordionSection
              title="Maintenance"
              costPerMile={maintenanceCostPerMile}
              palette={palette}
            >
              {runningFields
                .filter(
                  (field) =>
                    field.name === "oilChangeCost" || field.name === "oilChangeInterval",
                )
                  .map((field) => (
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
                ))}
              <NumericField
                id="oilChangeMaxMonths"
                label="Oil change max time (months)"
                tooltip={CAR_COST_FIELD_TOOLTIPS.oilChangeMaxMonths}
                value={getNumericDraftValue(
                  "oilChangeMaxMonths",
                  values.oilChangeMaxMonths,
                )}
                step="1"
                styles={styles}
                onChange={handleNumericFieldChange("oilChangeMaxMonths")}
                onBlur={handleNumericFieldBlur("oilChangeMaxMonths")}
                onFocus={handleNumericInputFocus}
              />
              <NumericField
                id="miscMaintenanceCost"
                label="Additional maintenance cost"
                value={getNumericDraftValue(
                  "miscMaintenanceCost",
                  values.miscMaintenanceCost,
                )}
                step="0.01"
                prefix="$"
                styles={styles}
                onChange={handleNumericFieldChange("miscMaintenanceCost")}
                onBlur={handleNumericFieldBlur("miscMaintenanceCost")}
                onFocus={handleNumericInputFocus}
              />
              <IntervalSettingField
                idPrefix="miscMaintenanceSchedule"
                label="Additional maintenance interval"
                tooltip={CAR_COST_FIELD_TOOLTIPS.miscMaintenanceSchedule}
                schedule={values.miscMaintenanceSchedule}
                valueText={getNumericDraftValue(
                  "miscMaintenanceScheduleValue",
                  values.miscMaintenanceSchedule.v.n,
                )}
                palette={palette}
                styles={styles}
                onSelectionChange={handleIntervalSettingSelectionChange(
                  "miscMaintenanceSchedule",
                )}
                onValueChange={handleIntervalSettingValueChange(
                  "miscMaintenanceSchedule",
                  "miscMaintenanceScheduleValue",
                )}
                onValueBlur={handleIntervalSettingValueBlur(
                  "miscMaintenanceSchedule",
                  "miscMaintenanceScheduleValue",
                )}
                onFocus={handleNumericInputFocus}
              />
              <ToggleField
                label="Show advanced maintenance options"
                checked={isToggleEnabled(values.showAdvancedMaintenance)}
                onChange={handleToggleChange("showAdvancedMaintenance")}
                palette={palette}
                tooltip={CAR_COST_FIELD_TOOLTIPS.showAdvancedMaintenance}
              />
              {isToggleEnabled(values.showAdvancedMaintenance) ? (
                <div
                  style={{
                    display: "grid",
                    gap: "1rem",
                    padding: "0.85rem",
                    borderRadius: "16px",
                    background: "rgba(79, 109, 122, 0.06)",
                    border: "1px solid rgba(79, 109, 122, 0.12)",
                  }}
                >
                  {advancedMaintenanceFields.map((field) => (
                    <React.Fragment key={field.key}>
                      <NumericField
                        id={field.costName}
                        label={`${field.label} cost`}
                        tooltip={
                          CAR_COST_FIELD_TOOLTIPS[
                            field.costName as keyof typeof CAR_COST_FIELD_TOOLTIPS
                          ]
                        }
                        value={getNumericDraftValue(
                          field.costName,
                          Number(values[field.costName]),
                        )}
                        step="0.01"
                        prefix="$"
                        styles={styles}
                        onChange={handleNumericFieldChange(field.costName)}
                        onBlur={handleNumericFieldBlur(field.costName)}
                        onFocus={handleNumericInputFocus}
                      />
                      <IntervalSettingField
                        idPrefix={field.scheduleName}
                        label={`${field.label} interval`}
                        tooltip={
                          CAR_COST_FIELD_TOOLTIPS[
                            field.scheduleName as keyof typeof CAR_COST_FIELD_TOOLTIPS
                          ]
                        }
                        schedule={values[field.scheduleName] as IntervalSetting}
                        valueText={getNumericDraftValue(
                          `${field.scheduleName}Value`,
                          (values[field.scheduleName] as IntervalSetting).v.n,
                        )}
                        palette={palette}
                        styles={styles}
                        onSelectionChange={handleIntervalSettingSelectionChange(
                          field.scheduleName,
                        )}
                        onValueChange={handleIntervalSettingValueChange(
                          field.scheduleName,
                          `${field.scheduleName}Value`,
                        )}
                        onValueBlur={handleIntervalSettingValueBlur(
                          field.scheduleName,
                          `${field.scheduleName}Value`,
                        )}
                        onFocus={handleNumericInputFocus}
                      />
                    </React.Fragment>
                  ))}
                </div>
              ) : null}
            </AccordionSection>
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
                <DrivingMileageField
                  idPrefix="annualMileageVehicleCost"
                  label="Vehicle mileage"
                  valueText={getNumericDraftValue(
                    "drivingMileageVehicleCost",
                    values.drivingMileage.n,
                  )}
                  mileageSetting={values.drivingMileage}
                  palette={{ muted: palette.muted }}
                  styles={styles}
                  disabled={!isToggleEnabled(values.includeVehicleCost)}
                  onUnitChange={onDrivingMileageUnitChange}
                  onValueChange={onDrivingMileageValueChange}
                  onValueBlur={onDrivingMileageValueBlur}
                  onFocus={handleNumericInputFocus}
                />
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
                tooltip={
                  field.name === "annualParking"
                    ? `${CAR_COST_FIELD_TOOLTIPS.annualParking} ${parkingTooltip}`
                    : undefined
                }
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
