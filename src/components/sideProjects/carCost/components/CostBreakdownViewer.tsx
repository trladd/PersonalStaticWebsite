import React, { useEffect, useMemo, useState } from "react";
import BreakdownItemDetailModal, {
  BreakdownItemDetail,
} from "./BreakdownItemDetailModal";
import SeeMoreButton from "./SeeMoreButton";

export type BreakdownMode =
  | "mile"
  | "trip"
  | "day"
  | "week"
  | "month"
  | "year"
  | "overall";

export type CostBreakdownViewerItem = {
  label: string;
  value: number;
  color: string;
  detail?: BreakdownItemDetail;
};

export type CostBreakdownViewerMode = {
  key: BreakdownMode;
  label: string;
  description: string;
  total: number;
  unitLabel: string;
  items: CostBreakdownViewerItem[];
};

type CostBreakdownViewerPalette = {
  text: string;
  muted: string;
  accent: string;
  border: string;
  chartBase: string;
  chartCenter: string;
  tooltipBackground: string;
  shadow: string;
  cardBackground: string;
};

type CostBreakdownViewerProps = {
  title: string;
  subtitle: string;
  modes: CostBreakdownViewerMode[];
  initialMode?: BreakdownMode;
  palette: CostBreakdownViewerPalette;
  cardStyle: React.CSSProperties;
  autoCycle?: boolean;
  showModeTabs?: boolean;
  subtitleFontSize?: string;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });
const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const buildPieSlice = (
  percentage: number,
  cumulativePercentage: number,
  radius: number
) => {
  if (percentage <= 0) {
    return "";
  }

  const startAngle = cumulativePercentage * Math.PI * 2 - Math.PI / 2;
  const endAngle = (cumulativePercentage + percentage) * Math.PI * 2 - Math.PI / 2;
  const x1 = 50 + radius * Math.cos(startAngle);
  const y1 = 50 + radius * Math.sin(startAngle);
  const x2 = 50 + radius * Math.cos(endAngle);
  const y2 = 50 + radius * Math.sin(endAngle);
  const largeArcFlag = percentage > 0.5 ? 1 : 0;

  return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
};

const CostBreakdownViewer: React.FC<CostBreakdownViewerProps> = ({
  title,
  subtitle,
  modes,
  initialMode,
  palette,
  cardStyle,
  autoCycle = true,
  showModeTabs = true,
  subtitleFontSize = "1rem",
}) => {
  const [selectedModeKey, setSelectedModeKey] = useState<BreakdownMode>(
    initialMode ?? modes[0]?.key ?? "mile"
  );
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAutoCycleEnabled, setIsAutoCycleEnabled] = useState(autoCycle);
  const [activeDetail, setActiveDetail] = useState<BreakdownItemDetail | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobileView(window.innerWidth < 700);
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);

    return () => {
      window.removeEventListener("resize", updateIsMobile);
    };
  }, []);

  useEffect(() => {
    setIsAutoCycleEnabled(autoCycle);
  }, [autoCycle]);

  useEffect(() => {
    if (!modes.some((mode) => mode.key === selectedModeKey) && modes[0]) {
      setSelectedModeKey(modes[0].key);
    }
  }, [modes, selectedModeKey]);

  useEffect(() => {
    if (initialMode) {
      setSelectedModeKey(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    setIsTransitioning(true);
    const timeout = window.setTimeout(() => setIsTransitioning(false), 180);
    return () => window.clearTimeout(timeout);
  }, [selectedModeKey]);

  useEffect(() => {
    if (!autoCycle || !isAutoCycleEnabled || isInteracting || modes.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setSelectedModeKey((current) => {
        const currentIndex = modes.findIndex((mode) => mode.key === current);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % modes.length : 0;
        return modes[nextIndex].key;
      });
      setActiveLabel(null);
      setTooltipPosition(null);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [autoCycle, isAutoCycleEnabled, isInteracting, modes]);

  const handleModeSelect = (mode: BreakdownMode) => {
    setSelectedModeKey(mode);
    if (autoCycle) {
      setIsAutoCycleEnabled(false);
    }
  };

  const currentMode = useMemo(
    () => modes.find((mode) => mode.key === selectedModeKey) ?? modes[0],
    [modes, selectedModeKey]
  );

  const pieSlices = useMemo(() => {
    if (!currentMode) {
      return [];
    }

    const magnitudeTotal = currentMode.items.reduce(
      (sum, item) => sum + Math.abs(item.value),
      0
    );
    let cumulativePercentage = 0;

    return currentMode.items
      .filter((item) => item.value !== 0)
      .map((item) => {
        const percentage = magnitudeTotal > 0 ? Math.abs(item.value) / magnitudeTotal : 0;
        const path = buildPieSlice(percentage, cumulativePercentage, 44);
        const midpointPercentage = cumulativePercentage + percentage / 2;
        const midAngle = midpointPercentage * Math.PI * 2 - Math.PI / 2;
        const offsetDistance = activeLabel === item.label ? 5 : 0;
        const offsetX = Math.cos(midAngle) * offsetDistance;
        const offsetY = Math.sin(midAngle) * offsetDistance;
        cumulativePercentage += percentage;

        return {
          ...item,
          percentage,
          path,
          offsetX,
          offsetY,
        };
      });
  }, [activeLabel, currentMode]);

  const activeSlice =
    activeLabel !== null ? pieSlices.find((slice) => slice.label === activeLabel) ?? null : null;

  const handlePieHover = (
    label: string,
    event: React.MouseEvent<SVGPathElement | HTMLElement>
  ) => {
    setActiveLabel(label);
    setTooltipPosition({
      x: event.clientX + 18,
      y: event.clientY + 18,
    });
  };

  const handleCardHover = (label: string) => {
    setActiveLabel(label);
    setTooltipPosition(null);
  };

  const handleHoverLeave = () => {
    setActiveLabel(null);
    setTooltipPosition(null);
  };

  if (!currentMode) {
    return null;
  }

  return (
    <div
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => {
        setIsInteracting(false);
        handleHoverLeave();
      }}
      onFocus={() => setIsInteracting(true)}
      onBlur={() => setIsInteracting(false)}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "flex-start",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        <div style={{ flex: "1 1 320px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "0.4rem" }}>{title}</h3>
          <p
            style={{
              color: palette.muted,
              lineHeight: 1.5,
              margin: 0,
              fontSize: subtitleFontSize,
            }}
          >
            {subtitle}
          </p>
        </div>
        {showModeTabs ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.55rem",
              alignItems: "center",
            }}
          >
            {autoCycle && !isAutoCycleEnabled ? (
              <button
                type="button"
                className="btn-flat"
                onClick={() => setIsAutoCycleEnabled(true)}
                style={{
                  borderRadius: "999px",
                  border: palette.border,
                  background: "transparent",
                  color: palette.text,
                  textTransform: "none",
                  fontWeight: 600,
                  minWidth: "unset",
                  padding: "0 0.85rem",
                  boxShadow: "none",
                }}
                aria-label="Resume auto cycle"
                title="Resume auto cycle"
              >
                <i
                  className="material-icons"
                  style={{ fontSize: "1rem", lineHeight: "inherit", verticalAlign: "middle" }}
                >
                  play_arrow
                </i>
              </button>
            ) : null}
            {modes.map((mode) => {
              const isActive = mode.key === currentMode.key;
              return (
                <button
                  key={mode.key}
                  type="button"
                  className="btn-flat"
                  onClick={() => handleModeSelect(mode.key)}
                  style={{
                    borderRadius: "999px",
                    border: isActive ? "none" : palette.border,
                    background: isActive ? palette.accent : "transparent",
                    color: isActive ? "#ffffff" : palette.text,
                    textTransform: "none",
                    fontWeight: 600,
                    minWidth: "unset",
                    padding: "0 1rem",
                    boxShadow: "none",
                  }}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div
        style={{
          opacity: isTransitioning ? 0.58 : 1,
          transition: "opacity 180ms ease",
        }}
      >
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.95rem 1rem",
            borderRadius: "18px",
            background: palette.cardBackground,
            border: palette.border,
          }}
        >
          <strong style={{ display: "block", marginBottom: "0.3rem" }}>{currentMode.label}</strong>
          <span style={{ display: "block", color: palette.muted, lineHeight: 1.5 }}>
            {currentMode.description}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5rem",
            alignItems: "center",
          }}
        >
          <div
            style={{
              flex: "0 1 280px",
              width: "100%",
              maxWidth: "320px",
              margin: "0 auto",
              position: "relative",
            }}
          >
            <svg viewBox="0 0 100 100" style={{ width: "100%", display: "block" }}>
              <circle cx="50" cy="50" r="44" fill={palette.chartBase} />
              {pieSlices.map((slice) => (
                <path
                  key={slice.label}
                  d={slice.path}
                  fill={slice.color}
                  transform={`translate(${slice.offsetX} ${slice.offsetY})`}
                  style={{
                    cursor: "pointer",
                    transition: "transform 180ms ease, filter 180ms ease",
                    filter:
                      activeLabel === slice.label
                        ? "drop-shadow(0 0 6px rgba(0, 0, 0, 0.24))"
                        : "none",
                  }}
                  onMouseEnter={(event) => handlePieHover(slice.label, event)}
                  onMouseMove={(event) => handlePieHover(slice.label, event)}
                  onMouseLeave={handleHoverLeave}
                />
              ))}
              <circle cx="50" cy="50" r="23" fill={palette.chartCenter} />
              <text
                x="50"
                y="45"
                textAnchor="middle"
                style={{ fontSize: "5px", fill: palette.muted, fontWeight: 600 }}
              >
                Total
              </text>
              <text
                x="50"
                y="53"
                textAnchor="middle"
                style={{ fontSize: "7px", fill: palette.text, fontWeight: 700 }}
              >
                {formatCurrency(currentMode.total)}
              </text>
              <text
                x="50"
                y="59"
                textAnchor="middle"
                style={{ fontSize: "4.2px", fill: palette.muted }}
              >
                {currentMode.unitLabel}
              </text>
            </svg>
          </div>

          <div style={{ flex: "1 1 320px" }}>
            <div className="row" style={{ marginBottom: 0 }}>
              {pieSlices.map((slice) => (
                <div key={slice.label} className="col s6 m6" style={{ marginBottom: "1rem" }}>
                  <article
                    style={{
                      ...cardStyle,
                      position: "relative",
                      padding: isMobileView ? "0.8rem 0.85rem" : "1rem 1.1rem",
                      height: "100%",
                      cursor: "pointer",
                      transform: activeLabel === slice.label ? "translateY(-2px)" : "none",
                      boxShadow:
                        activeLabel === slice.label
                          ? "0 18px 38px rgba(0, 0, 0, 0.18)"
                          : cardStyle.boxShadow,
                      transition: "transform 180ms ease, box-shadow 180ms ease",
                    }}
                    onMouseEnter={() => handleCardHover(slice.label)}
                    onMouseMove={() => handleCardHover(slice.label)}
                    onMouseLeave={handleHoverLeave}
                  >
                    {slice.detail ? (
                      <SeeMoreButton
                        onClick={(event) => {
                          event.stopPropagation();
                          setActiveDetail(slice.detail ?? null);
                        }}
                        accentColor={palette.accent}
                        ariaLabel={`See more about ${slice.label}`}
                        buttonStyle={{
                          position: "absolute",
                          top: "0.35rem",
                          right: "0.35rem",
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.7rem",
                        marginBottom: "0.45rem",
                      }}
                    >
                      <span
                        style={{
                          width: isMobileView ? "11px" : "14px",
                          height: isMobileView ? "11px" : "14px",
                          borderRadius: "999px",
                          background: slice.color,
                          flex: "0 0 auto",
                        }}
                      />
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: isMobileView ? "0.92rem" : "1rem",
                          lineHeight: 1.25,
                        }}
                      >
                        {slice.label}
                      </span>
                    </div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: isMobileView ? "1.1rem" : "1.4rem",
                        lineHeight: 1.1,
                      }}
                    >
                      {formatCurrency(slice.value)}
                    </strong>
                    <small
                      style={{
                        display: "block",
                        marginTop: "0.32rem",
                        color: palette.muted,
                        fontSize: isMobileView ? "0.74rem" : "0.82rem",
                        lineHeight: 1.3,
                      }}
                    >
                      {formatPercent(slice.percentage * 100)} of impact
                    </small>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeSlice && tooltipPosition ? (
        <div
          style={{
            position: "fixed",
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            minWidth: "220px",
            maxWidth: "260px",
            padding: "0.9rem 1rem",
            borderRadius: "16px",
            background: palette.tooltipBackground,
            border: palette.border,
            boxShadow: palette.shadow,
            color: palette.text,
            pointerEvents: "none",
            zIndex: 1200,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              marginBottom: "0.35rem",
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "999px",
                background: activeSlice.color,
                flex: "0 0 auto",
              }}
            />
            <strong style={{ fontSize: "0.98rem", lineHeight: 1.2 }}>{activeSlice.label}</strong>
          </div>
          <div style={{ fontSize: "1.15rem", fontWeight: 700, lineHeight: 1.2 }}>
            {formatCurrency(activeSlice.value)}
          </div>
          <small style={{ display: "block", marginTop: "0.3rem", color: palette.muted }}>
            {formatPercent(activeSlice.percentage * 100)} of {currentMode.label.toLowerCase()}
          </small>
        </div>
      ) : null}

      <BreakdownItemDetailModal
        detail={activeDetail}
        onClose={() => setActiveDetail(null)}
        palette={{
          text: palette.text,
          muted: palette.muted,
          border: palette.border,
          cardBackground: palette.cardBackground,
          shadow: palette.shadow,
        }}
        cardStyle={cardStyle}
      />
    </div>
  );
};

export default CostBreakdownViewer;
