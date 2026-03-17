import React from "react";
import { DrivingMileageSetting, DrivingMileageUnit } from "../types";
import { DRIVING_MILEAGE_OPTIONS } from "../utils/drivingMileage";

type Palette = {
  muted: string;
};

type StyleBundle = {
  inputContainerStyle: React.CSSProperties;
  invalidInputContainerStyle?: React.CSSProperties;
  selectStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
  fieldLabelStyle: React.CSSProperties;
  subFieldLabelStyle: React.CSSProperties;
};

type DrivingMileageFieldProps = {
  idPrefix: string;
  label: string;
  valueText: string;
  mileageSetting: DrivingMileageSetting;
  palette: Palette;
  styles: StyleBundle;
  disabled?: boolean;
  placeholder?: string;
  invalid?: boolean;
  onUnitChange: (unit: DrivingMileageUnit) => void;
  onValueChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onValueBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus: (event: React.FocusEvent<HTMLInputElement>) => void;
};

const DrivingMileageField: React.FC<DrivingMileageFieldProps> = ({
  idPrefix,
  label,
  valueText,
  mileageSetting,
  palette,
  styles,
  disabled = false,
  placeholder,
  invalid = false,
  onUnitChange,
  onValueChange,
  onValueBlur,
  onFocus,
}) => (
  <div>
    <label htmlFor={`${idPrefix}Value`} style={styles.fieldLabelStyle}>
      {label}
    </label>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 1.4fr)",
        gap: "0.75rem",
      }}
    >
      <div>
        <label htmlFor={`${idPrefix}Unit`} style={styles.subFieldLabelStyle}>
          Based on
        </label>
        <div style={{ ...styles.inputContainerStyle, position: "relative" }}>
          <select
            id={`${idPrefix}Unit`}
            className="browser-default"
            value={mileageSetting.u}
            disabled={disabled}
            onChange={(event) => onUnitChange(event.target.value as DrivingMileageUnit)}
            style={{ ...styles.selectStyle, paddingRight: "2.75rem" }}
          >
            {DRIVING_MILEAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
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
      <div>
        <label htmlFor={`${idPrefix}Value`} style={styles.subFieldLabelStyle}>
          Miles
        </label>
        <div
          style={
            invalid && styles.invalidInputContainerStyle
              ? styles.invalidInputContainerStyle
              : styles.inputContainerStyle
          }
        >
          <input
            id={`${idPrefix}Value`}
            type="number"
            min="0"
            step="0.01"
            value={valueText}
            disabled={disabled}
            placeholder={placeholder}
            onChange={onValueChange}
            onBlur={onValueBlur}
            onFocus={onFocus}
            style={styles.inputStyle}
            className={placeholder ? "car-cost-placeholder" : undefined}
          />
        </div>
      </div>
    </div>
  </div>
);

export default DrivingMileageField;
