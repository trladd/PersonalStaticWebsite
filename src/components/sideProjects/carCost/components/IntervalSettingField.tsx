import React from "react";
import { INTERVAL_MEASURE_OPTIONS } from "../config/constants";
import { IntervalSetting } from "../types";
import { getIntervalSelectionValue } from "../utils/intervals";

type Palette = {
  muted: string;
};

type StyleBundle = {
  inputContainerStyle: React.CSSProperties;
  selectStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
  fieldLabelStyle: React.CSSProperties;
  subFieldLabelStyle: React.CSSProperties;
};

type Props = {
  idPrefix: string;
  label: string;
  tooltip?: string;
  schedule: IntervalSetting;
  valueText: string;
  palette: Palette;
  styles: StyleBundle;
  disabled?: boolean;
  onSelectionChange: (selection: "mile" | "month" | "year") => void;
  onValueChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onValueBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus: (event: React.FocusEvent<HTMLInputElement>) => void;
};

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

const IntervalSettingField: React.FC<Props> = ({
  idPrefix,
  label,
  tooltip,
  schedule,
  valueText,
  palette,
  styles,
  disabled = false,
  onSelectionChange,
  onValueChange,
  onValueBlur,
  onFocus,
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
      <label htmlFor={`${idPrefix}Type`} style={styles.fieldLabelStyle}>
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
    </div>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
        gap: "0.75rem",
      }}
    >
      <div>
        <label htmlFor={`${idPrefix}Type`} style={styles.subFieldLabelStyle}>
          Based on
        </label>
        <div style={{ ...styles.inputContainerStyle, position: "relative" }}>
          <select
            id={`${idPrefix}Type`}
            className="browser-default"
            value={getIntervalSelectionValue(schedule)}
            onChange={(event) =>
              onSelectionChange(event.target.value as "mile" | "month" | "year")
            }
            disabled={disabled}
            style={{ ...styles.selectStyle, paddingRight: "2.75rem" }}
          >
            {INTERVAL_MEASURE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <SelectCaret color={palette.muted} />
        </div>
      </div>
      <div>
        <label htmlFor={`${idPrefix}Value`} style={styles.subFieldLabelStyle}>
          Every
        </label>
        <div style={styles.inputContainerStyle}>
          <input
            id={`${idPrefix}Value`}
            type="number"
            min="0"
            step="1"
            value={valueText}
            onChange={onValueChange}
            onBlur={onValueBlur}
            onFocus={onFocus}
            disabled={disabled}
            style={styles.inputStyle}
          />
        </div>
      </div>
    </div>
  </div>
);

export default IntervalSettingField;
