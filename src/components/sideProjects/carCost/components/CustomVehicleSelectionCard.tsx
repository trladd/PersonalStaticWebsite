import React from "react";
import {
  CustomVehicleDraft,
  CustomVehicleField,
  DrivingMileageSetting,
  DrivingMileageUnit,
  SelectedVehicleLookupDetails,
  VehicleLookupOption,
} from "../types";
import { formatCurrency, formatNumber } from "../utils/formatters";
import DrivingMileageField from "./DrivingMileageField";

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
    vehicleClass: string | null;
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
  startupDrivingMileageValue: string;
  startupDrivingMileageSetting: DrivingMileageSetting;
  startupAnnualMileageTouched: boolean;
  startupAnnualMileageError: string;
  startupPurchasePriceValue: string;
  startupPurchasePriceTouched: boolean;
  startupPurchasePriceError: string;
  handleStartupDrivingMileageUnitChange: (unit: DrivingMileageUnit) => void;
  handleStartupAnnualMileageChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  handleStartupAnnualMileageBlur: (
    event?: React.FocusEvent<HTMLInputElement>,
  ) => void;
  handleStartupPurchasePriceChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  handleStartupPurchasePriceFocus: () => void;
  handleStartupPurchasePriceBlur: () => void;
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
  startupDrivingMileageValue,
  startupDrivingMileageSetting,
  startupAnnualMileageTouched,
  startupAnnualMileageError,
  startupPurchasePriceValue,
  startupPurchasePriceTouched,
  startupPurchasePriceError,
  handleStartupDrivingMileageUnitChange,
  handleStartupAnnualMileageChange,
  handleStartupAnnualMileageBlur,
  handleStartupPurchasePriceChange,
  handleStartupPurchasePriceFocus,
  handleStartupPurchasePriceBlur,
  setCustomVehicleTouched,
  setShowCustomVehicleValidation,
  handleStartWithOwnCar,
}) => {
  const tooltipIconStyle: React.CSSProperties = {
    fontSize: "0.95rem",
    marginLeft: "0.35rem",
    verticalAlign: "middle",
    cursor: "help",
    color: palette.muted,
  };

  const renderTooltipLabel = (
    htmlFor: string,
    label: string,
    tooltip: string,
  ) => (
    <label
      htmlFor={htmlFor}
      style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
    >
      {label}
      <i
        className="material-icons tiny tooltipped"
        data-tooltip={tooltip}
        style={tooltipIconStyle}
      >
        info_outline
      </i>
    </label>
  );

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
          {renderTooltipLabel(
            "startupPurchasePrice",
            "Purchase price",
            "Why do we need this? It helps us estimate depreciation and overall ownership cost. You can change it later.",
          )}
          <div
            style={
              startupPurchasePriceTouched && startupPurchasePriceError
                ? styles.invalidInputContainerStyle
                : styles.inputContainerStyle
            }
          >
            <input
              id="startupPurchasePrice"
              type="text"
              inputMode="decimal"
              value={startupPurchasePriceValue}
              onChange={handleStartupPurchasePriceChange}
              onFocus={handleStartupPurchasePriceFocus}
              onBlur={handleStartupPurchasePriceBlur}
              placeholder="$32,000.00"
              style={styles.inputStyle}
              className="car-cost-placeholder"
            />
          </div>
          {startupPurchasePriceTouched && startupPurchasePriceError ? (
            <small style={{ display: "block", color: "#c44949", marginTop: "0.35rem" }}>
              {startupPurchasePriceError}
            </small>
          ) : null}
        </div>
        <div className="col s12">
          <DrivingMileageField
            idPrefix="startupAnnualMiles"
            label="Vehicle mileage"
            valueText={startupDrivingMileageValue}
            mileageSetting={startupDrivingMileageSetting}
            palette={{ muted: palette.muted }}
            styles={{
              ...styles,
              fieldLabelStyle: {
                display: "block",
                fontWeight: 600,
                marginBottom: "0.45rem",
              },
              subFieldLabelStyle: {
                display: "block",
                fontWeight: 500,
                fontSize: "0.84rem",
                color: palette.muted,
                marginBottom: "0.35rem",
              },
            }}
            placeholder="Enter your miles"
            invalid={startupAnnualMileageTouched && Boolean(startupAnnualMileageError)}
            onUnitChange={handleStartupDrivingMileageUnitChange}
            onValueChange={handleStartupAnnualMileageChange}
            onValueBlur={(event) => handleStartupAnnualMileageBlur(event)}
            onFocus={() => undefined}
          />
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
            handleStartupPurchasePriceBlur();
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
            handleStartupPurchasePriceBlur();
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
