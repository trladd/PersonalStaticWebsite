import React from "react";
import {
  CustomVehicleDraft,
  CustomVehicleField,
  SelectedVehicleLookupDetails,
  VehicleLookupOption,
} from "../types";
import { formatCurrency, formatNumber } from "../utils/formatters";

type Palette = {
  panelBackground: string;
  text: string;
  muted: string;
  border: string;
  subtlePanel: string;
};

type StyleBundle = {
  cardStyle: React.CSSProperties;
  inputContainerStyle: React.CSSProperties;
  invalidInputContainerStyle: React.CSSProperties;
  selectStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
  solidPrimaryButtonStyle: React.CSSProperties;
};

type Props = {
  palette: Palette;
  styles: StyleBundle;
  customVehicleDraft: CustomVehicleDraft;
  customVehicleTouched: Record<CustomVehicleField, boolean>;
  showCustomVehicleValidation: boolean;
  customVehicleFieldErrors: Record<CustomVehicleField, string>;
  customVehicleValidationMessage: string;
  isCustomVehicleValid: boolean;
  yearOptions: VehicleLookupOption[];
  makeOptions: VehicleLookupOption[];
  modelOptions: VehicleLookupOption[];
  trimOptions: VehicleLookupOption[];
  trimNotRequired: boolean;
  isLoadingMakes: boolean;
  isLoadingModels: boolean;
  isLoadingTrims: boolean;
  isLoadingVehicleDetails: boolean;
  lookupError: string | null;
  selectedVehicleDetails: SelectedVehicleLookupDetails | null;
  selectedVehicleSummary: {
    fuelType: string;
    annualFuelCost: number | null;
    city: number | null;
    combined: number | null;
    highway: number | null;
    unitLabel: "MPG" | "mi/kWh";
    purchasePrice: number | null;
  } | null;
  setLookupField: (
    field: Extract<CustomVehicleField, "year" | "make" | "model" | "trim">,
    value: string,
  ) => void;
  startupAnnualMileageValue: string;
  startupAnnualMileageTouched: boolean;
  startupAnnualMileageError: string;
  handleStartupAnnualMileageChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  handleStartupAnnualMileageBlur: () => void;
  setCustomVehicleTouched: React.Dispatch<
    React.SetStateAction<Record<CustomVehicleField, boolean>>
  >;
  setShowCustomVehicleValidation: React.Dispatch<React.SetStateAction<boolean>>;
  handleStartWithOwnCar: () => void;
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

const CustomVehicleSelectionCard: React.FC<Props> = ({
  palette,
  styles,
  customVehicleDraft,
  customVehicleTouched,
  showCustomVehicleValidation,
  customVehicleFieldErrors,
  customVehicleValidationMessage,
  isCustomVehicleValid,
  yearOptions,
  makeOptions,
  modelOptions,
  trimOptions,
  trimNotRequired,
  isLoadingMakes,
  isLoadingModels,
  isLoadingTrims,
  isLoadingVehicleDetails,
  lookupError,
  selectedVehicleDetails,
  selectedVehicleSummary,
  setLookupField,
  startupAnnualMileageValue,
  startupAnnualMileageTouched,
  startupAnnualMileageError,
  handleStartupAnnualMileageChange,
  handleStartupAnnualMileageBlur,
  setCustomVehicleTouched,
  setShowCustomVehicleValidation,
  handleStartWithOwnCar,
}) => {
  const renderSelectField = (
    field: Extract<CustomVehicleField, "year" | "make" | "model" | "trim">,
    label: string,
    value: string,
    options: VehicleLookupOption[],
    disabled: boolean,
    placeholder: string,
    helperText?: string,
  ) => (
    <div className={field === "year" ? "col s12" : "col s12 m6"}>
      <label
        htmlFor={`customVehicle${field[0].toUpperCase()}${field.slice(1)}`}
        style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
      >
        {label}
      </label>
      <div
        style={{
          ...(showCustomVehicleValidation &&
          customVehicleTouched[field] &&
          customVehicleFieldErrors[field]
            ? styles.invalidInputContainerStyle
            : styles.inputContainerStyle),
          position: "relative",
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <select
          id={`customVehicle${field[0].toUpperCase()}${field.slice(1)}`}
          className="browser-default"
          value={value}
          disabled={disabled}
          onChange={(event) => {
            setLookupField(field, event.target.value);
            setCustomVehicleTouched((current) => ({
              ...current,
              [field]: true,
            }));
          }}
          onBlur={() => {
            setCustomVehicleTouched((current) => ({
              ...current,
              [field]: true,
            }));
            setShowCustomVehicleValidation(true);
          }}
          style={{ ...styles.selectStyle, paddingRight: "2.75rem" }}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <SelectCaret color={palette.muted} />
      </div>
      {helperText ? (
        <small style={{ display: "block", color: palette.muted, marginTop: "0.35rem" }}>
          {helperText}
        </small>
      ) : null}
      {showCustomVehicleValidation &&
      customVehicleTouched[field] &&
      customVehicleFieldErrors[field] ? (
        <small style={{ display: "block", color: "#c44949", marginTop: "0.35rem" }}>
          {customVehicleFieldErrors[field]}
        </small>
      ) : null}
    </div>
  );

  return (
    <div
      style={{
        ...styles.cardStyle,
        padding: "1.25rem",
        height: "100%",
        background: palette.subtlePanel,
      }}
    >
      <h5 style={{ marginTop: 0 }}>Check with my own car</h5>
      <p style={{ color: palette.muted, fontSize: "0.9rem", lineHeight: 1.45 }}>
        Pick your year, make, model, and trim so we can prefill fuel economy from EPA data.
      </p>
      <div className="row" style={{ marginBottom: 0 }}>
        {renderSelectField(
          "year",
          "Year",
          customVehicleDraft.year,
          yearOptions,
          false,
          "Select a year",
        )}
        {renderSelectField(
          "make",
          "Make",
          customVehicleDraft.make,
          makeOptions,
          !customVehicleDraft.year || isLoadingMakes,
          isLoadingMakes ? "Loading makes..." : "Select a make",
        )}
        {renderSelectField(
          "model",
          "Model",
          customVehicleDraft.model,
          modelOptions,
          !customVehicleDraft.make || isLoadingModels,
          isLoadingModels ? "Loading models..." : "Select a model",
        )}
        {!trimNotRequired
          ? renderSelectField(
              "trim",
              "Trim",
              customVehicleDraft.trim,
              trimOptions,
              !customVehicleDraft.model || isLoadingTrims,
              isLoadingTrims ? "Loading trims..." : "Select a trim",
              trimOptions.length === 0 && customVehicleDraft.model
                ? "We look up trim-level EPA vehicles after you choose a model."
                : undefined,
            )
          : null}
        <div className="col s12">
          <label
            htmlFor="startupAnnualMiles"
            style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
          >
            Annual miles driven
          </label>
          <div
            style={
              startupAnnualMileageTouched && startupAnnualMileageError
                ? styles.invalidInputContainerStyle
                : styles.inputContainerStyle
            }
          >
            <input
              id="startupAnnualMiles"
              type="number"
              min="0"
              step="1"
              value={startupAnnualMileageValue}
              onChange={handleStartupAnnualMileageChange}
              onBlur={handleStartupAnnualMileageBlur}
              placeholder="12000"
              style={styles.inputStyle}
              className="car-cost-placeholder"
            />
          </div>
          <small style={{ display: "block", color: palette.muted, marginTop: "0.35rem" }}>
            This uses the same annual driving assumption as the main calculator.
          </small>
          {startupAnnualMileageTouched && startupAnnualMileageError ? (
            <small style={{ display: "block", color: "#c44949", marginTop: "0.35rem" }}>
              {startupAnnualMileageError}
            </small>
          ) : null}
        </div>
      </div>
      {trimNotRequired && customVehicleDraft.model ? (
        <p style={{ color: palette.muted, fontSize: "0.88rem", margin: "0.5rem 0 0" }}>
          This model does not expose a separate trim choice in the free EPA data, so
          we'll start from your selected year / make / model and keep the remaining
          values editable.
        </p>
      ) : null}
      {lookupError ? (
        <p style={{ color: "#c44949", fontSize: "0.88rem", margin: "0.4rem 0 0" }}>
          {lookupError}
        </p>
      ) : null}
      {isLoadingVehicleDetails ? (
        <p style={{ color: palette.muted, fontSize: "0.88rem", margin: "0.4rem 0 0" }}>
          Loading EPA fuel economy details...
        </p>
      ) : null}
      {selectedVehicleDetails && selectedVehicleSummary ? (
        <div
          style={{
            marginTop: "0.9rem",
            padding: "0.85rem 1rem",
            borderRadius: "16px",
            border: `1px solid ${palette.border}`,
            background: palette.panelBackground,
          }}
        >
          <p style={{ margin: 0, fontWeight: 700 }}>{selectedVehicleDetails.title}</p>
          <p style={{ margin: "0.35rem 0 0", color: palette.muted, fontSize: "0.92rem" }}>
            {selectedVehicleSummary.city !== null &&
            selectedVehicleSummary.combined !== null &&
            selectedVehicleSummary.highway !== null
              ? `${formatNumber(selectedVehicleSummary.city)} city / ${formatNumber(
                  selectedVehicleSummary.combined,
                )} combined / ${formatNumber(
                  selectedVehicleSummary.highway,
                )} highway ${selectedVehicleSummary.unitLabel}`
              : "Fuel economy is available but incomplete for this trim."}
          </p>
          <p style={{ margin: "0.35rem 0 0", color: palette.muted, fontSize: "0.92rem" }}>
            Fuel type: {selectedVehicleSummary.fuelType}
            {selectedVehicleSummary.annualFuelCost !== null
              ? ` • EPA annual fuel cost: ${formatCurrency(
                  selectedVehicleSummary.annualFuelCost,
                )}`
              : ""}
          </p>
          <p style={{ margin: "0.35rem 0 0", color: palette.muted, fontSize: "0.92rem" }}>
            {selectedVehicleSummary.purchasePrice !== null
              ? `MSRP defaulted to ${formatCurrency(
                  selectedVehicleSummary.purchasePrice,
                )}.`
              : "MSRP was not available from the free data source, so purchase price will stay on the calculator default."}
          </p>
        </div>
      ) : null}
      {showCustomVehicleValidation && !isCustomVehicleValid ? (
        <p style={{ color: "#c44949", fontSize: "0.88rem", margin: "0.6rem 0 0" }}>
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
              trim: true,
            });
            setShowCustomVehicleValidation(true);
            handleStartupAnnualMileageBlur();
          }
        }}
        onTouchStart={() => {
          if (!isCustomVehicleValid) {
            setCustomVehicleTouched({
              year: true,
              make: true,
              model: true,
              trim: true,
            });
            setShowCustomVehicleValidation(true);
            handleStartupAnnualMileageBlur();
          }
        }}
      >
        <button
          type="button"
          className="waves-effect waves-light btn primaryColor"
          onClick={handleStartWithOwnCar}
          disabled={!isCustomVehicleValid}
          style={{
            ...styles.solidPrimaryButtonStyle,
            opacity: isCustomVehicleValid ? 1 : 0.65,
          }}
        >
          Use my vehicle
        </button>
      </div>
    </div>
  );
};

export default CustomVehicleSelectionCard;
