import React, { useEffect, useRef, useState } from "react";
import { CarCostCalculations } from "../utils/calculations";
import { formatCurrency } from "../utils/formatters";

type VehicleStickyBarProps = {
  palette: {
    panelBackground: string;
    muted: string;
    resultHighlight: string;
    softBorder: string;
  };
  cardStyle: React.CSSProperties;
  inputContainerStyle: React.CSSProperties;
  selectStyle: React.CSSProperties;
  solidSecondaryButtonStyle: React.CSSProperties;
  isMobileView: boolean;
  stickyTop: number;
  currentVehicleLabel: string;
  selectedSource: "default" | "template" | "custom";
  selectedTemplateId: string | null;
  templateOptions: Array<{ id: string; title: string }>;
  handleTemplateSwitch: (value: string) => void;
  handleOpenOwnCarModal: () => void;
  calculations: CarCostCalculations;
};

type BarMetrics = {
  left: number;
  width: number;
  height: number;
};

const HORIZONTAL_INSET = 5;

const VehicleStickyBar: React.FC<VehicleStickyBarProps> = ({
  palette,
  cardStyle,
  inputContainerStyle,
  selectStyle,
  solidSecondaryButtonStyle,
  isMobileView,
  stickyTop,
  currentVehicleLabel,
  selectedSource,
  selectedTemplateId,
  templateOptions,
  handleTemplateSwitch,
  handleOpenOwnCarModal,
  calculations,
}) => {
  const slotRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<BarMetrics | null>(null);

  useEffect(() => {
    const updateMetrics = () => {
      const slotRect = slotRef.current?.getBoundingClientRect();
      const cardRect = cardRef.current?.getBoundingClientRect();

      if (!slotRect) {
        return;
      }

      setMetrics({
        left: slotRect.left + HORIZONTAL_INSET,
        width: Math.max(slotRect.width - HORIZONTAL_INSET * 2, 0),
        height: cardRect?.height ?? metrics?.height ?? 96,
      });
    };

    updateMetrics();
    window.addEventListener("resize", updateMetrics);

    return () => {
      window.removeEventListener("resize", updateMetrics);
    };
  }, [isMobileView, stickyTop, currentVehicleLabel, selectedSource, selectedTemplateId, templateOptions.length, metrics?.height]);

  return (
    <div className="row" style={{ marginBottom: 0 }}>
      <div className="col s12" ref={slotRef}>
        <div
          style={{
            height: metrics?.height ? `${metrics.height + (isMobileView ? 16 : 20)}px` : undefined,
          }}
        />
        <div
          ref={cardRef}
          style={{
            ...cardStyle,
            position: "fixed",
            top: `${stickyTop}px`,
            left: metrics?.left ?? 0,
            width: metrics?.width ?? "100%",
            zIndex: 50,
            padding: isMobileView ? "0.8rem 0.9rem" : "1rem 1.2rem",
            borderRadius: isMobileView ? "22px" : "24px",
            background: palette.panelBackground,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              alignItems: isMobileView ? "center" : "end",
            }}
          >
            {!isMobileView ? (
              <div style={{ flex: "1 1 260px" }}>
                <span
                  style={{
                    display: "block",
                    color: palette.muted,
                    fontSize: "0.85rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  Selected vehicle
                </span>
                <strong style={{ display: "block", fontSize: "1.15rem" }}>
                  {currentVehicleLabel}
                </strong>
              </div>
            ) : null}
            <div style={{ flex: isMobileView ? "1 1 0" : "1 1 280px" }}>
              {!isMobileView ? (
                <label
                  htmlFor="vehicleTemplateSwitcher"
                  style={{ display: "block", fontWeight: 600, marginBottom: "0.45rem" }}
                >
                  Switch vehicle
                </label>
              ) : null}
              <div style={{ ...inputContainerStyle, position: "relative" }}>
                <select
                  id="vehicleTemplateSwitcher"
                  className="browser-default"
                  value={
                    selectedSource === "custom"
                      ? "custom"
                      : (selectedTemplateId ?? templateOptions[0]?.id ?? "")
                  }
                  onChange={(event) => handleTemplateSwitch(event.target.value)}
                  style={{ ...selectStyle, paddingRight: "2.75rem" }}
                >
                  {templateOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
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
            <div style={{ flex: "0 0 auto" }}>
              <button
                type="button"
                className="waves-effect waves-light btn secondaryColor"
                onClick={handleOpenOwnCarModal}
                style={solidSecondaryButtonStyle}
              >
                {isMobileView ? "Use my own" : "Start over"}
              </button>
            </div>
            <div
              style={{
                flex: "0 0 auto",
                padding: "0.32rem 0.65rem",
                borderRadius: "999px",
                background: palette.resultHighlight,
                border: palette.softBorder,
                minWidth: "unset",
              }}
              className="tooltipped"
              data-position="bottom"
              data-tooltip={`True cost per mile: ${formatCurrency(
                calculations.trueCostPerMile,
              )} per mile`}
            >
              <strong
                style={{
                  fontSize: "0.84rem",
                  lineHeight: 1,
                  display: "block",
                  whiteSpace: "nowrap",
                }}
              >
                {formatCurrency(calculations.trueCostPerMile)}/mi
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleStickyBar;
