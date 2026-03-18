import React from "react";
import { CAR_COST_FUTURE_HOME_URL } from "../config/constants";
import {
  CustomVehicleDraft,
  CustomVehicleField,
  DrivingMileageSetting,
  DrivingMileageUnit,
  FuelType,
  SelectedVehicleLookupDetails,
  VehicleLookupOption,
  VehicleLookupSummary,
  VehicleTemplate,
} from "../types";
import { formatCurrency } from "../utils/formatters";
import CustomVehicleSelectionCard from "./CustomVehicleSelectionCard";

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
  startupBannerMessage: string;
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
  handleContinueFromSavedState: () => void;
  handleOpenInstallModal: () => void;
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

const StartupModal: React.FC<StartupModalProps> = ({
  modalRef,
  palette,
  styles,
  startupBannerMessage,
  isMobileView,
  startupMode,
  sharedStartupSummary,
  showInstallAppAction,
  startupTemplateId,
  typedTemplates,
  setStartupTemplateId,
  handleLoadStartupTemplate,
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
  handleContinueFromSavedState,
  handleOpenInstallModal,
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
        {startupBannerMessage.trim().length > 0 ? (
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.8rem 1rem",
              borderRadius: "16px",
              background: "rgba(210, 138, 51, 0.14)",
              border: "1px solid rgba(210, 138, 51, 0.35)",
              color: palette.text,
              display: "flex",
              alignItems: "flex-start",
              gap: "0.65rem",
            }}
          >
            <i
              className="material-icons tiny"
              style={{ color: "#d28a33", marginTop: "0.15rem", flexShrink: 0 }}
            >
              construction
            </i>
            <div style={{ fontSize: "0.92rem", lineHeight: 1.45 }}>
              {startupBannerMessage}{" "}
              <a
                href={CAR_COST_FUTURE_HOME_URL}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: palette.text,
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                New home: truecosttodrive.com
              </a>
            </div>
          </div>
        ) : null}
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
            <CustomVehicleSelectionCard
              palette={palette}
              styles={{
                cardStyle: styles.cardStyle,
                inputContainerStyle: styles.inputContainerStyle,
                invalidInputContainerStyle: styles.invalidInputContainerStyle,
                selectStyle: styles.selectStyle,
                inputStyle: styles.inputStyle,
                solidPrimaryButtonStyle: styles.solidPrimaryButtonStyle,
              }}
              customVehicleDraft={customVehicleDraft}
              customVehicleTouched={customVehicleTouched}
              showCustomVehicleValidation={showCustomVehicleValidation}
              customVehicleFieldErrors={customVehicleFieldErrors}
              customVehicleValidationMessage={customVehicleValidationMessage}
              isCustomVehicleValid={isCustomVehicleValid}
              yearOptions={yearOptions}
              makeOptions={makeOptions}
              modelOptions={modelOptions}
              trimOptions={trimOptions}
              trimNotRequired={trimNotRequired}
              isLoadingMakes={isLoadingMakes}
              isLoadingModels={isLoadingModels}
              isLoadingTrims={isLoadingTrims}
              isLoadingVehicleDetails={isLoadingVehicleDetails}
              lookupError={lookupError}
              requiresManualCategory={requiresManualCategory}
              manualCategoryMessage={manualCategoryMessage}
              selectedVehicleDetails={selectedVehicleDetails}
              selectedVehicleSummary={selectedVehicleSummary}
              setLookupField={setLookupField}
              startupDrivingMileageValue={startupDrivingMileageValue}
              startupDrivingMileageSetting={startupDrivingMileageSetting}
              startupAnnualMileageTouched={startupAnnualMileageTouched}
              startupAnnualMileageError={startupAnnualMileageError}
              startupPurchasePriceValue={startupPurchasePriceValue}
              startupPurchasePriceTouched={startupPurchasePriceTouched}
              startupPurchasePriceError={startupPurchasePriceError}
              startupFuelEfficiencyValue={startupFuelEfficiencyValue}
              startupFuelEfficiencyTouched={startupFuelEfficiencyTouched}
              startupFuelEfficiencyError={startupFuelEfficiencyError}
              handleStartupDrivingMileageUnitChange={
                handleStartupDrivingMileageUnitChange
              }
              handleStartupAnnualMileageChange={handleStartupAnnualMileageChange}
              handleStartupAnnualMileageBlur={handleStartupAnnualMileageBlur}
              handleStartupPurchasePriceChange={handleStartupPurchasePriceChange}
              handleStartupPurchasePriceFocus={handleStartupPurchasePriceFocus}
              handleStartupPurchasePriceBlur={handleStartupPurchasePriceBlur}
              handleStartupFuelEfficiencyChange={handleStartupFuelEfficiencyChange}
              handleStartupFuelEfficiencyBlur={handleStartupFuelEfficiencyBlur}
              handleStartupFuelTypeChange={handleStartupFuelTypeChange}
              setStartupFuelEfficiencyTouched={setStartupFuelEfficiencyTouched}
              setCustomVehicleTouched={setCustomVehicleTouched}
              setShowCustomVehicleValidation={setShowCustomVehicleValidation}
              handleStartWithOwnCar={handleStartWithOwnCar}
            />
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
