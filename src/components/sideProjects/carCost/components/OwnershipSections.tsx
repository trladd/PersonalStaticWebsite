import React from "react";
import CostBreakdownViewer, {
  CostBreakdownViewerMode,
} from "./CostBreakdownViewer";
import InsightsSection from "./InsightsSection";
import SeeMoreButton from "./SeeMoreButton";
import { InsightCardData } from "./InsightsCard";
import { CarCostCalculations } from "../utils/calculations";
import {
  formatCurrency,
  formatNumber,
  isToggleEnabled,
} from "../utils/formatters";
import { CarCostValues } from "../types";

type Palette = {
  text: string;
  muted: string;
  accent: string;
  accentDark: string;
  border: string;
  chartBase: string;
  chartCenter: string;
  tooltipBackground: string;
  shadow: string;
  cardBackground: string;
};

type OwnershipSectionsProps = {
  values: CarCostValues;
  calculations: CarCostCalculations;
  palette: Palette;
  cardStyle: React.CSSProperties;
  compactMetricCardPadding: string;
  compactMetricLabelStyle: React.CSSProperties;
  compactMetricValueStyle: React.CSSProperties;
  breakdownModes: CostBreakdownViewerMode[];
  insights: InsightCardData[];
  isDarkMode: boolean;
  openLoanDetailsModal: () => void;
};

const OwnershipSections: React.FC<OwnershipSectionsProps> = ({
  values,
  calculations,
  palette,
  cardStyle,
  compactMetricCardPadding,
  compactMetricLabelStyle,
  compactMetricValueStyle,
  breakdownModes,
  insights,
  isDarkMode,
  openLoanDetailsModal,
}) => {
  const averageCostPerYear =
    calculations.ownershipYears > 0
      ? calculations.overallCost / calculations.ownershipYears
      : 0;

  return (
    <>
      <div className="row" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
        <div className="col s12" style={{ marginBottom: "1rem" }}>
          <section style={{ ...cardStyle, padding: "1.5rem" }}>
            <CostBreakdownViewer
              title="Cost breakdown explorer"
              subtitle="Compare how each category allocates across a mile, a trip, recurring driving windows, or your full ownership horizon. When you stop interacting, it cycles through the views automatically."
              modes={breakdownModes}
              initialMode="mile"
              palette={{
                text: palette.text,
                muted: palette.muted,
                accent: palette.accent,
                border: palette.border,
                chartBase: palette.chartBase,
                chartCenter: palette.chartCenter,
                tooltipBackground: palette.tooltipBackground,
                shadow: palette.shadow,
                cardBackground: palette.cardBackground,
              }}
              cardStyle={cardStyle}
            />
          </section>
        </div>
      </div>

      <div className="row" style={{ marginTop: "0.25rem", marginBottom: 0 }}>
        <div className="col s12" style={{ marginBottom: "1rem" }}>
          <section style={{ ...cardStyle, padding: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
                marginBottom: "1rem",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>Overall ownership estimate</h3>
                <p
                  style={{
                    color: palette.muted,
                    margin: "0.35rem 0 0",
                    lineHeight: 1.5,
                  }}
                >
                  Uses your annual miles and depreciation timeline to estimate
                  total cost over the time you own the vehicle.
                </p>
              </div>
            </div>
            <div className="row" style={{ marginBottom: 0 }}>
              <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                <article
                  style={{
                    ...cardStyle,
                    padding: compactMetricCardPadding,
                    height: "100%",
                  }}
                >
                  <span style={compactMetricLabelStyle}>Ownership length</span>
                  <strong style={compactMetricValueStyle}>
                    {formatNumber(calculations.ownershipYears, 1)} years
                  </strong>
                </article>
              </div>
              <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                <article
                  style={{
                    ...cardStyle,
                    padding: compactMetricCardPadding,
                    height: "100%",
                  }}
                >
                  <span style={compactMetricLabelStyle}>
                    Estimated ownership miles
                  </span>
                  <strong style={compactMetricValueStyle}>
                    {formatNumber(calculations.ownershipMiles)}
                  </strong>
                </article>
              </div>
              <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                <article
                  style={{
                    ...cardStyle,
                    padding: compactMetricCardPadding,
                    height: "100%",
                  }}
                >
                  <span style={compactMetricLabelStyle}>
                    Net vehicle cost after sale
                  </span>
                  <strong style={compactMetricValueStyle}>
                    {formatCurrency(calculations.netVehicleCostAtSale)}
                  </strong>
                </article>
              </div>
              <div className="col s6 m6 xl3" style={{ marginBottom: "1rem" }}>
                <article
                  style={{
                    ...cardStyle,
                    padding: compactMetricCardPadding,
                    height: "100%",
                  }}
                >
                  <span style={compactMetricLabelStyle}>
                    Total estimated ownership cost
                  </span>
                  <strong style={compactMetricValueStyle}>
                    {formatCurrency(calculations.overallCost)}
                  </strong>
                </article>
              </div>
              {isToggleEnabled(values.includeFinancing) ? (
                <>
                  <div
                    className="col s6 m6 xl3"
                    style={{ marginBottom: "1rem" }}
                  >
                    <article
                      style={{
                        ...cardStyle,
                        padding: compactMetricCardPadding,
                        height: "100%",
                        position: "relative",
                      }}
                    >
                      <SeeMoreButton
                        onClick={openLoanDetailsModal}
                        accentColor={palette.accentDark}
                        ariaLabel="See financing details"
                        title="See financing details"
                        iconOnly
                        buttonStyle={{
                          position: "absolute",
                          top: "0.35rem",
                          right: "0.35rem",
                        }}
                        iconStyle={{ fontSize: "1rem" }}
                      />
                      <span style={compactMetricLabelStyle}>
                        Total loan payments made
                      </span>
                      <strong style={compactMetricValueStyle}>
                        {formatCurrency(calculations.totalLoanPaymentsMade)}
                      </strong>
                    </article>
                  </div>
                  <div
                    className="col s6 m6 xl3"
                    style={{ marginBottom: "1rem" }}
                  >
                    <article
                      style={{
                        ...cardStyle,
                        padding: compactMetricCardPadding,
                        height: "100%",
                        position: "relative",
                      }}
                    >
                      <SeeMoreButton
                        onClick={openLoanDetailsModal}
                        accentColor={palette.accentDark}
                        ariaLabel="See interest details"
                        title="See interest details"
                        iconOnly
                        buttonStyle={{
                          position: "absolute",
                          top: "0.35rem",
                          right: "0.35rem",
                        }}
                        iconStyle={{ fontSize: "1rem" }}
                      />
                      <span style={compactMetricLabelStyle}>
                        Interest paid while owned
                      </span>
                      <strong style={compactMetricValueStyle}>
                        {formatCurrency(calculations.totalInterestPaid)}
                      </strong>
                    </article>
                  </div>
                  <div
                    className="col s6 m6 xl3"
                    style={{ marginBottom: "1rem" }}
                  >
                    <article
                      style={{
                        ...cardStyle,
                        padding: compactMetricCardPadding,
                        height: "100%",
                      }}
                    >
                      <span style={compactMetricLabelStyle}>
                        Remaining balance at sale
                      </span>
                      <strong style={compactMetricValueStyle}>
                        {formatCurrency(calculations.remainingLoanBalance)}
                      </strong>
                    </article>
                  </div>
                  <div
                    className="col s6 m6 xl3"
                    style={{ marginBottom: "1rem" }}
                  >
                    <article
                      style={{
                        ...cardStyle,
                        padding: compactMetricCardPadding,
                        height: "100%",
                      }}
                    >
                      <span style={compactMetricLabelStyle}>
                        Expected sale price
                      </span>
                      <strong style={compactMetricValueStyle}>
                        {formatCurrency(values.resaleValue)}
                      </strong>
                    </article>
                  </div>
                  <div
                    className="col s6 m6 xl3"
                    style={{ marginBottom: "1rem" }}
                  >
                    <article
                      style={{
                        ...cardStyle,
                        padding: compactMetricCardPadding,
                        height: "100%",
                      }}
                    >
                      <span style={compactMetricLabelStyle}>
                        Equity at sale
                      </span>
                      <strong style={compactMetricValueStyle}>
                        {formatCurrency(calculations.equityAtSale)}
                      </strong>
                    </article>
                  </div>
                  <div
                    className="col s6 m6 xl3"
                    style={{ marginBottom: "1rem" }}
                  >
                    <article
                      style={{
                        ...cardStyle,
                        padding: compactMetricCardPadding,
                        height: "100%",
                      }}
                    >
                      <span style={compactMetricLabelStyle}>
                        Average cost per year
                      </span>
                      <strong style={compactMetricValueStyle}>
                        {formatCurrency(averageCostPerYear)}
                      </strong>
                    </article>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="col s6 m6 xl3"
                    style={{ marginBottom: "1rem" }}
                  >
                    <article
                      style={{
                        ...cardStyle,
                        padding: compactMetricCardPadding,
                        height: "100%",
                      }}
                    >
                      <span style={compactMetricLabelStyle}>
                        Purchase price
                      </span>
                      <strong style={compactMetricValueStyle}>
                        {formatCurrency(values.purchasePrice)}
                      </strong>
                    </article>
                  </div>
                  <div
                    className="col s6 m6 xl3"
                    style={{ marginBottom: "1rem" }}
                  >
                    <article
                      style={{
                        ...cardStyle,
                        padding: compactMetricCardPadding,
                        height: "100%",
                      }}
                    >
                      <span style={compactMetricLabelStyle}>
                        Expected sale price
                      </span>
                      <strong style={compactMetricValueStyle}>
                        {formatCurrency(values.resaleValue)}
                      </strong>
                    </article>
                  </div>
                  <div
                    className="col s6 m6 xl3"
                    style={{ marginBottom: "1rem" }}
                  >
                    <article
                      style={{
                        ...cardStyle,
                        padding: compactMetricCardPadding,
                        height: "100%",
                      }}
                    >
                      <span style={compactMetricLabelStyle}>
                        Value change at sale
                      </span>
                      <strong style={compactMetricValueStyle}>
                        {formatCurrency(calculations.depreciationTotal)}
                      </strong>
                    </article>
                  </div>
                  <div
                    className="col s6 m6 xl3"
                    style={{ marginBottom: "1rem" }}
                  >
                    <article
                      style={{
                        ...cardStyle,
                        padding: compactMetricCardPadding,
                        height: "100%",
                      }}
                    >
                      <span style={compactMetricLabelStyle}>
                        Average cost per year
                      </span>
                      <strong style={compactMetricValueStyle}>
                        {formatCurrency(averageCostPerYear)}
                      </strong>
                    </article>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="row" style={{ marginTop: "1.5rem", marginBottom: 0 }}>
        <div className="col s12" style={{ marginBottom: "1rem" }}>
          <section style={{ ...cardStyle, padding: "1.5rem" }}>
            <InsightsSection
              insights={insights}
              cardStyle={cardStyle}
              isDarkMode={isDarkMode}
              mutedColor={palette.muted}
              title="Insights"
              description="These benchmarks help frame whether your vehicle is inexpensive or expensive to operate compared with common reimbursement, rental, and gig-work reference points."
            />
          </section>
        </div>
      </div>
    </>
  );
};

export default OwnershipSections;
