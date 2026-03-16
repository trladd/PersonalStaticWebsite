import React from "react";
import { CustomVehicleDraft, CustomVehicleField, FuelType, VehicleTemplate } from "../types";
import { formatCurrency } from "../utils/formatters";

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

type StartupModalProps = {
  modalRef: React.RefObject<HTMLDivElement | null>;
  palette: Palette;
  styles: StyleBundle;
  isMobileView: boolean;
  startupMode: "default" | "resume" | "shared";
  sharedStartupSummary: {
    vehicleLabel: string;
    trueCostPerMile: number;
    overallCost: number;
  } | null;
  showInstallAppAction: boolean;
  startupTemplateId: string;
  typedTemplates: VehicleTemplate[];
  setStartupTemplateId: (value: string) => void;
  handleLoadStartupTemplate: () => void;
  customVehicleDraft: CustomVehicleDraft;
  setCustomVehicleDraft: React.Dispatch<React.SetStateAction<CustomVehicleDraft>>;
  customVehicleTouched: Record<CustomVehicleField, boolean>;
  showCustomVehicleValidation: boolean;
  customVehicleFieldErrors: Record<CustomVehicleField, string>;
  customVehicleValidationMessage: string;
  currentModelYear: number;
  isCustomVehicleValid: boolean;
  handleContinueFromSavedState: () => void;
  handleOpenInstallModal: () => void;
  handleCustomVehicleDraftChange: (
    field: CustomVehicleField,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCustomVehicleFieldBlur: (
    field: CustomVehicleField,
  ) => () => void;
  handleNumericInputFocus: (event: React.FocusEvent<HTMLInputElement>) => void;
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

const fuelOptions: FuelType[] = [
  "regular",
  "midgrade",
  "premium",
  "diesel",
  "e85",
  "cng",
  "lpg",
  "electric",
];

const StartupModal: React.FC<StartupModalProps> = ({
  modalRef,
  palette,
  styles,
  isMobileView,
  startupMode,
  sharedStartupSummary,
  showInstallAppAction,
  startupTemplateId,
  typedTemplates,
  setStartupTemplateId,
  handleLoadStartupTemplate,
  customVehicleDraft,
  setCustomVehicleDraft,
  customVehicleTouched,
  showCustomVehicleValidation,
  customVehicleFieldErrors,
  customVehicleValidationMessage,
  currentModelYear,
  isCustomVehicleValid,
  handleContinueFromSavedState,
  handleOpenInstallModal,
  handleCustomVehicleDraftChange,
  handleCustomVehicleFieldBlur,
  handleNumericInputFocus,
  setCustomVehicleTouched,
  setShowCustomVehicleValidation,
  handleStartWithOwnCar,
}) => {
  return (
    <div id="car-cost-restore-modal" className="modal" ref={modalRef as React.RefObject<HTMLDivElement>}>
      <div
        className="modal-content"
        style={{
          background: palette.panelBackground,
          color: palette.text,
        }}
      >
        <h4>
          {startupMode === "shared"
            ? "Welcome to the vehicle cost calculator"
            : "Choose how you want to get started"}
        </h4>
        <p
          style={{
            color: palette.muted,
            display: isMobileView ? "none" : "block",
          }}
        >
          {startupMode === "shared"
            ? "Someone shared a vehicle estimate with you. You can continue into their setup, then explore or modify any values."
            : "You can load a presaved template, or enter your own car and begin with a fresh calculator state."}
        </p>
        {showInstallAppAction ? (
          <div style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="btn-flat"
              onClick={handleOpenInstallModal}
              style={{
                color: palette.text,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <i className="material-icons tiny">download</i>
              Add this as an app
            </button>
          </div>
        ) : null}
        {startupMode === "shared" && sharedStartupSummary ? (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem 1.1rem",
              borderRadius: "18px",
              background: palette.subtlePanel,
              border: `1px solid ${palette.border}`,
            }}
          >
            <p style={{ margin: 0, fontWeight: 700 }}>
              Shared vehicle: {sharedStartupSummary.vehicleLabel}
            </p>
            <p style={{ margin: "0.5rem 0 0", color: palette.muted }}>
              About {formatCurrency(sharedStartupSummary.trueCostPerMile)} per
              mile and roughly {formatCurrency(sharedStartupSummary.overallCost)}{" "}
              over the full ownership estimate.
            </p>
            <div style={{ marginTop: "0.9rem" }}>
              <button
                type="button"
                className="waves-effect waves-light btn primaryColor"
                onClick={handleContinueFromSavedState}
                style={styles.solidPrimaryButtonStyle}
              >
                Continue to see more or modify values
              </button>
            </div>
          </div>
        ) : null}
        {startupMode === "resume" ? (
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              justifyContent: "flex-start",
            }}
          >
            <button
              type="button"
              className="waves-effect waves-light btn primaryColor"
              onClick={handleContinueFromSavedState}
              style={styles.solidPrimaryButtonStyle}
            >
              Continue where you left off
            </button>
          </div>
        ) : null}
        {startupMode === "shared" ? null : (
        <div className="row" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
          <div className="col s12 l6" style={{ marginBottom: "1rem" }}>
            <div
              style={{
                ...styles.cardStyle,
                padding: "1.25rem",
                height: "100%",
                background: palette.subtlePanel,
              }}
            >
              <h5 style={{ marginTop: 0 }}>Use a presaved template</h5>
              <p style={{ color: palette.muted, fontSize: "0.9rem", lineHeight: 1.45 }}>
                Pick one of the built-in vehicles to see how the calculator behaves with realistic sample values.
              </p>
              <label
                htmlFor="startupTemplate"
                style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
              >
                Example vehicle
              </label>
              <div style={{ ...styles.inputContainerStyle, position: "relative" }}>
                <select
                  id="startupTemplate"
                  className="browser-default"
                  value={startupTemplateId}
                  onChange={(event) => setStartupTemplateId(event.target.value)}
                  style={{ ...styles.selectStyle, paddingRight: "2.75rem" }}
                >
                  {typedTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.year} {template.make} {template.model}
                    </option>
                  ))}
                </select>
                <SelectCaret color={palette.muted} />
              </div>
              <button
                type="button"
                className="waves-effect waves-light btn primaryColor"
                onClick={handleLoadStartupTemplate}
                style={styles.solidPrimaryButtonStyle}
              >
                Use this vehicle
              </button>
            </div>
          </div>

          <div className="col s12 l6" style={{ marginBottom: "1rem" }}>
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
                Enter your vehicle details to begin with a fresh state tied to your own car.
              </p>
              <div className="row" style={{ marginBottom: 0 }}>
                {(["year", "make", "model"] as const).map((field) => (
                  <div
                    key={field}
                    className={field === "year" ? "col s12" : "col s12 m6"}
                  >
                    <label
                      htmlFor={`customVehicle${field[0].toUpperCase()}${field.slice(1)}`}
                      style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
                    >
                      {field[0].toUpperCase() + field.slice(1)}
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
                        id={`customVehicle${field[0].toUpperCase()}${field.slice(1)}`}
                        type={field === "year" ? "number" : "text"}
                        min={field === "year" ? "1886" : undefined}
                        max={field === "year" ? `${currentModelYear}` : undefined}
                        step={field === "year" ? "1" : undefined}
                        value={customVehicleDraft[field]}
                        onChange={handleCustomVehicleDraftChange(field)}
                        onBlur={handleCustomVehicleFieldBlur(field)}
                        onFocus={field === "year" ? handleNumericInputFocus : undefined}
                        placeholder={
                          field === "year" ? "2020" : field === "make" ? "Toyota" : "Camry"
                        }
                        style={styles.inputStyle}
                        className="car-cost-placeholder"
                      />
                    </div>
                    {showCustomVehicleValidation &&
                    customVehicleTouched[field] &&
                    customVehicleFieldErrors[field] ? (
                      <small
                        style={{ display: "block", color: "#c44949", marginTop: "0.35rem" }}
                      >
                        {customVehicleFieldErrors[field]}
                      </small>
                    ) : null}
                  </div>
                ))}
                <div className="col s12">
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
                        setCustomVehicleDraft((current) => ({
                          ...current,
                          fuelType: event.target.value as FuelType,
                        }))
                      }
                      style={{ ...styles.selectStyle, paddingRight: "2.75rem" }}
                    >
                      {fuelOptions.map((fuelType) => (
                        <option key={fuelType} value={fuelType}>
                          {fuelType === "cng"
                            ? "CNG"
                            : fuelType === "e85"
                              ? "E85"
                              : fuelType === "lpg"
                                ? "LPG"
                                : fuelType[0].toUpperCase() + fuelType.slice(1)}
                        </option>
                      ))}
                    </select>
                    <SelectCaret color={palette.muted} />
                  </div>
                </div>
              </div>
              <p style={{ color: palette.muted, fontSize: "0.92rem", margin: "0.5rem 0 0" }}>
                Year must be between 1886 and {currentModelYear}.
              </p>
              {showCustomVehicleValidation && !isCustomVehicleValid ? (
                <p style={{ color: "#c44949", fontSize: "0.88rem", margin: "0.5rem 0 0" }}>
                  {customVehicleValidationMessage}
                </p>
              ) : null}
              <div
                onMouseDown={() => {
                  if (!isCustomVehicleValid) {
                    setCustomVehicleTouched({ year: true, make: true, model: true });
                    setShowCustomVehicleValidation(true);
                  }
                }}
                onTouchStart={() => {
                  if (!isCustomVehicleValid) {
                    setCustomVehicleTouched({ year: true, make: true, model: true });
                    setShowCustomVehicleValidation(true);
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
          </div>
        </div>
        )}
      </div>
      <div
        className="modal-footer"
        style={{ background: palette.panelBackground, borderTop: palette.border }}
      />
    </div>
  );
};

export default StartupModal;
