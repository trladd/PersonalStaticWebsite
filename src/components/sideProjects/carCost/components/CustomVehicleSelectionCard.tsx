import React from "react";
import {
  CustomVehicleDraft,
  CustomVehicleField,
  DrivingMileageSetting,
  DrivingMileageUnit,
  FuelType,
  SelectedVehicleLookupDetails,
  VehicleClassBucket,
  VehicleLookupOption,
  VehicleLookupSummary,
} from "../types";
import { formatCurrency, formatNumber } from "../utils/formatters";
import {
  getVehicleClassBucketLabel,
  getVehicleClassBucketOptions,
} from "../utils/vehicleClass";
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
  requiresManualCategory: boolean;
  manualCategoryMessage: string | null;
  selectedVehicleDetails: SelectedVehicleLookupDetails | null;
  selectedVehicleSummary: VehicleLookupSummary | null;
  setLookupField: (
    field:
      | "year"
      | "make"
      | "model"
      | "trim"
      | "vehicleClassBucket"
      | "manualVehicleEntry",
    value: string,
  ) => void;
  startupDrivingMileageValue: string;
  startupDrivingMileageSetting: DrivingMileageSetting;
  startupAnnualMileageTouched: boolean;
  startupAnnualMileageError: string;
  startupPurchasePriceValue: string;
  startupPurchasePriceTouched: boolean;
  startupPurchasePriceError: string;
  startupFuelEfficiencyValue: string;
  startupFuelEfficiencyTouched: boolean;
  startupFuelEfficiencyError: string;
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
  handleStartupFuelEfficiencyChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  handleStartupFuelEfficiencyBlur: () => void;
  handleStartupFuelTypeChange: (fuelType: FuelType) => void;
  setStartupFuelEfficiencyTouched: React.Dispatch<React.SetStateAction<boolean>>;
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
  requiresManualCategory,
  manualCategoryMessage,
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
  startupFuelEfficiencyValue,
  startupFuelEfficiencyTouched,
  startupFuelEfficiencyError,
  handleStartupDrivingMileageUnitChange,
  handleStartupAnnualMileageChange,
  handleStartupAnnualMileageBlur,
  handleStartupPurchasePriceChange,
  handleStartupPurchasePriceFocus,
  handleStartupPurchasePriceBlur,
  handleStartupFuelEfficiencyChange,
  handleStartupFuelEfficiencyBlur,
  handleStartupFuelTypeChange,
  setStartupFuelEfficiencyTouched,
  setCustomVehicleTouched,
  setShowCustomVehicleValidation,
  handleStartWithOwnCar,
}) => {
  const manualCategoryOptions = getVehicleClassBucketOptions();
  const fuelTypeOptions: FuelType[] = [
    "regular",
    "midgrade",
    "premium",
    "diesel",
    "e85",
    "cng",
    "lpg",
    "electric",
  ];
  const tooltipIconStyle: React.CSSProperties = {
    fontSize: "0.95rem",
    marginLeft: "0.35rem",
    verticalAlign: "middle",
    cursor: "help",
    color: palette.muted,
  };
  const hasResolvedLookupSelection =
    (!!customVehicleDraft.year &&
      !!customVehicleDraft.make &&
      !!customVehicleDraft.model &&
      !!customVehicleDraft.trim) ||
    (!!customVehicleDraft.year &&
      !!customVehicleDraft.make &&
      !!customVehicleDraft.model &&
      trimNotRequired);
  const showManualVehicleEntryToggle =
    customVehicleDraft.manualVehicleEntry || !hasResolvedLookupSelection;

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

  const renderFreeformField = (
    field: Extract<CustomVehicleField, "make" | "model" | "trim">,
    label: string,
    value: string,
    placeholder: string,
  ) => (
    <div className={field === "trim" ? "col s12" : "col s12 m6"}>
      <label
        htmlFor={`customVehicle${field[0].toUpperCase()}${field.slice(1)}Manual`}
        style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
      >
        {label}
      </label>
      <div
        style={
          showCustomVehicleValidation &&
          customVehicleTouched[field] &&
          customVehicleFieldErrors[field]
            ? styles.invalidInputContainerStyle
            : styles.inputContainerStyle
        }
      >
        <input
          id={`customVehicle${field[0].toUpperCase()}${field.slice(1)}Manual`}
          type="text"
          value={value}
          placeholder={placeholder}
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
          style={styles.inputStyle}
          className="car-cost-placeholder"
        />
      </div>
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
        {customVehicleDraft.manualVehicleEntry
          ? renderFreeformField("make", "Make", customVehicleDraft.make, "Ford")
          : renderSelectField(
              "make",
              "Make",
              customVehicleDraft.make,
              makeOptions,
              !customVehicleDraft.year || isLoadingMakes,
              isLoadingMakes ? "Loading makes..." : "Select a make",
            )}
        {customVehicleDraft.manualVehicleEntry
          ? renderFreeformField("model", "Model", customVehicleDraft.model, "F-550")
          : renderSelectField(
              "model",
              "Model",
              customVehicleDraft.model,
              modelOptions,
              !customVehicleDraft.make || isLoadingModels,
              isLoadingModels ? "Loading models..." : "Select a model",
            )}
        {customVehicleDraft.manualVehicleEntry
          ? renderFreeformField(
              "trim",
              "Trim / engine",
              customVehicleDraft.trim,
              "6.7L Power Stroke / XL",
            )
          : !trimNotRequired
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
        {showManualVehicleEntryToggle ? (
          <div className="col s12">
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "0.8rem",
                color: palette.muted,
                lineHeight: 1.3,
              }}
            >
              <input
                type="checkbox"
                checked={customVehicleDraft.manualVehicleEntry}
                onChange={(event) => {
                  setLookupField(
                    "manualVehicleEntry",
                    event.target.checked ? "1" : "0",
                  );
                  setShowCustomVehicleValidation(false);
                }}
              />
              <span>I can&apos;t find my Year/Make/Model/Trim in the options above</span>
            </label>
            {customVehicleDraft.manualVehicleEntry ? (
              <div
                style={{
                  marginTop: "0.55rem",
                  padding: "0.85rem 1rem",
                  borderRadius: "14px",
                  background: "rgba(64, 146, 168, 0.11)",
                  border: "1px solid rgba(64, 146, 168, 0.24)",
                  color: palette.text,
                  fontSize: "0.88rem",
                  lineHeight: 1.45,
                }}
              >
                That is okay. You can enter the vehicle manually here. It just means
                we will lean more on the category and the fuel economy you enter, so
                you should double-check the defaults after loading the calculator.
              </div>
            ) : null}
          </div>
        ) : null}
        {requiresManualCategory ? (
          <div className="col s12">
            <div
              style={{
                marginBottom: "0.85rem",
                padding: "0.85rem 1rem",
                borderRadius: "14px",
                background: "rgba(210, 138, 51, 0.12)",
                border: "1px solid rgba(210, 138, 51, 0.28)",
                color: palette.text,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  alignItems: "flex-start",
                }}
              >
                <i
                  className="material-icons tiny"
                  style={{ color: "#d28a33", marginTop: "0.1rem" }}
                >
                  warning_amber
                </i>
                <div style={{ fontSize: "0.88rem", lineHeight: 1.45 }}>
                  {manualCategoryMessage ??
                    "This vehicle is not fully covered by the free EPA fuel-economy data set. We'll use the category you choose to set rough defaults, and the calculator will still work well, but it will need more manual attention to detail."}
                </div>
              </div>
            </div>
            <label
              htmlFor="customVehicleCategory"
              style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
            >
              Vehicle category
            </label>
            <div
              style={{
                ...(showCustomVehicleValidation &&
                customVehicleTouched.vehicleClassBucket &&
                customVehicleFieldErrors.vehicleClassBucket
                  ? styles.invalidInputContainerStyle
                  : styles.inputContainerStyle),
                position: "relative",
              }}
            >
              <select
                id="customVehicleCategory"
                className="browser-default"
                value={customVehicleDraft.vehicleClassBucket}
                onChange={(event) => {
                  setLookupField(
                    "vehicleClassBucket",
                    event.target.value as VehicleClassBucket,
                  );
                  setCustomVehicleTouched((current) => ({
                    ...current,
                    vehicleClassBucket: true,
                  }));
                }}
                onBlur={() => {
                  setCustomVehicleTouched((current) => ({
                    ...current,
                    vehicleClassBucket: true,
                  }));
                  setShowCustomVehicleValidation(true);
                }}
                style={{ ...styles.selectStyle, paddingRight: "2.75rem" }}
              >
                <option value="">Select the closest category</option>
                {manualCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <SelectCaret color={palette.muted} />
            </div>
            {showCustomVehicleValidation &&
            customVehicleTouched.vehicleClassBucket &&
            customVehicleFieldErrors.vehicleClassBucket ? (
              <small style={{ display: "block", color: "#c44949", marginTop: "0.35rem" }}>
                {customVehicleFieldErrors.vehicleClassBucket}
              </small>
            ) : null}
          </div>
        ) : null}
        {requiresManualCategory ? (
          <>
            <div className="col s12 m6">
              <label
                htmlFor="customVehicleFuelType"
                style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
              >
                Fuel type
              </label>
              <div style={{ ...styles.inputContainerStyle, position: "relative" }}>
                <select
                  id="customVehicleFuelType"
                  className="browser-default"
                  value={customVehicleDraft.fuelType}
                  onChange={(event) =>
                    handleStartupFuelTypeChange(event.target.value as FuelType)
                  }
                  style={{ ...styles.selectStyle, paddingRight: "2.75rem" }}
                >
                  {fuelTypeOptions.map((fuelType) => (
                    <option key={fuelType} value={fuelType}>
                      {fuelType === "cng"
                        ? "CNG"
                        : fuelType.charAt(0).toUpperCase() + fuelType.slice(1)}
                    </option>
                  ))}
                </select>
                <SelectCaret color={palette.muted} />
              </div>
            </div>
            <div className="col s12 m6">
              {renderTooltipLabel(
                "startupFuelEfficiency",
                "Fuel mileage",
                "Enter the fuel economy you expect in real use. For trucks and manually entered vehicles, this becomes one of the most important assumptions in the calculator.",
              )}
              <div
                style={
                  startupFuelEfficiencyTouched && startupFuelEfficiencyError
                    ? styles.invalidInputContainerStyle
                    : styles.inputContainerStyle
                }
              >
                <input
                  id="startupFuelEfficiency"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.1"
                  value={startupFuelEfficiencyValue}
                  onChange={handleStartupFuelEfficiencyChange}
                  onBlur={handleStartupFuelEfficiencyBlur}
                  placeholder={customVehicleDraft.fuelType === "electric" ? "3.0" : "14"}
                  style={styles.inputStyle}
                  className="car-cost-placeholder"
                />
              </div>
              {startupFuelEfficiencyTouched && startupFuelEfficiencyError ? (
                <small style={{ display: "block", color: "#c44949", marginTop: "0.35rem" }}>
                  {startupFuelEfficiencyError}
                </small>
              ) : null}
            </div>
          </>
        ) : null}
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
          {selectedVehicleSummary.vehicleClass ? (
            <p
              style={{
                margin: "0.35rem 0 0",
                color: palette.muted,
                fontSize: "0.92rem",
              }}
            >
              Vehicle category: {selectedVehicleSummary.vehicleClass}
            </p>
          ) : null}
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
      ) : requiresManualCategory &&
        customVehicleDraft.vehicleClassBucket &&
        customVehicleDraft.year &&
        customVehicleDraft.make &&
        customVehicleDraft.model ? (
        <div
          style={{
            marginTop: "0.9rem",
            padding: "0.85rem 1rem",
            borderRadius: "16px",
            border: `1px solid ${palette.border}`,
            background: palette.panelBackground,
          }}
        >
          <p style={{ margin: 0, fontWeight: 700 }}>
            {customVehicleDraft.year} {customVehicleDraft.make} {customVehicleDraft.model}
          </p>
          <p style={{ margin: "0.35rem 0 0", color: palette.muted, fontSize: "0.92rem" }}>
            Vehicle category: {getVehicleClassBucketLabel(customVehicleDraft.vehicleClassBucket)}
          </p>
          <p style={{ margin: "0.35rem 0 0", color: palette.muted, fontSize: "0.92rem" }}>
            Fuel economy and trim-level EPA data were not available for this vehicle, so
            the calculator will start with generic defaults for this category and leave
            the detailed values editable.
          </p>
        </div>
      ) : null}
      {showCustomVehicleValidation && !isCustomVehicleValid ? (
        <p style={{ color: "#c44949", fontSize: "0.88rem", margin: "0.6rem 0 0" }}>
          {customVehicleValidationMessage}
        </p>
      ) : null}
      <p
        style={{
          color: palette.muted,
          fontSize: "0.84rem",
          lineHeight: 1.45,
          margin: "0.75rem 0 0.6rem",
        }}
      >
        This will generically fill some maintenance and ownership values based on
        the vehicle category when available. Check all values afterward.
      </p>
      <div
        onMouseDown={() => {
          if (!isCustomVehicleValid) {
            setCustomVehicleTouched({
              year: true,
              make: true,
              model: true,
              trim: true,
              vehicleClassBucket: true,
              manualVehicleEntry: true,
            });
            setShowCustomVehicleValidation(true);
            handleStartupAnnualMileageBlur();
            handleStartupPurchasePriceBlur();
            setStartupFuelEfficiencyTouched(true);
          }
        }}
        onTouchStart={() => {
          if (!isCustomVehicleValid) {
            setCustomVehicleTouched({
              year: true,
              make: true,
              model: true,
              trim: true,
              vehicleClassBucket: true,
              manualVehicleEntry: true,
            });
            setShowCustomVehicleValidation(true);
            handleStartupAnnualMileageBlur();
            handleStartupPurchasePriceBlur();
            setStartupFuelEfficiencyTouched(true);
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
