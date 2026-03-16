import React from "react";
import CostBreakdownViewer, { BreakdownMode, CostBreakdownViewerMode } from "./CostBreakdownViewer";
import InsightsSection from "./InsightsSection";
import LoanPaydownDetails from "./LoanPaydownDetails";
import { CarCostCalculations } from "../utils/calculations";
import { InsightCardData } from "./InsightsCard";
import { CarCostValues } from "../types";

type BreakdownModalProps = {
  breakdownModalRef: React.RefObject<HTMLDivElement | null>;
  palette: {
    panelBackground: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
    accentDark: string;
    chartBase: string;
    chartCenter: string;
    tooltipBackground: string;
    shadow: string;
    cardBackground: string;
  };
  cardStyle: React.CSSProperties;
  breakdownModalMode: BreakdownMode;
  breakdownModalModes: BreakdownMode[];
  breakdownModalTitle: string;
  filteredBreakdownModalModes: CostBreakdownViewerMode[];
  modalInsights: InsightCardData[];
  isDarkMode: boolean;
};

export const BreakdownModal: React.FC<BreakdownModalProps> = ({
  breakdownModalRef,
  palette,
  cardStyle,
  breakdownModalMode,
  breakdownModalModes,
  breakdownModalTitle,
  filteredBreakdownModalModes,
  modalInsights,
  isDarkMode,
}) => (
  <div
    id="car-cost-breakdown-modal"
    className="modal modal-fixed-footer"
    ref={breakdownModalRef as React.RefObject<HTMLDivElement>}
  >
    <div className="modal-content" style={{ background: palette.panelBackground, color: palette.text }}>
      <CostBreakdownViewer
        key={`${breakdownModalMode}-${breakdownModalModes.join("-")}`}
        title={breakdownModalTitle}
        subtitle="Use the interval controls to compare how the same costs allocate across a mile, trip, or recurring driving window."
        modes={filteredBreakdownModalModes}
        initialMode={breakdownModalMode}
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
        autoCycle={false}
        subtitleFontSize="0.92rem"
      />
      {modalInsights.length > 0 ? (
        <div style={{ marginTop: "1.5rem" }}>
          <InsightsSection
            insights={modalInsights}
            cardStyle={cardStyle}
            isDarkMode={isDarkMode}
            mutedColor={palette.muted}
            title="Related insights"
          />
        </div>
      ) : null}
    </div>
    <div className="modal-footer" style={{ background: palette.panelBackground, borderTop: palette.border }}>
      <button
        type="button"
        className="modal-close waves-effect btn-flat"
        style={{ color: palette.accentDark, fontWeight: 700, textTransform: "none" }}
      >
        Close
      </button>
    </div>
  </div>
);

type LoanDetailsModalProps = {
  loanDetailsModalRef: React.RefObject<HTMLDivElement | null>;
  palette: {
    panelBackground: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
    accentDark: string;
    chartBase: string;
    cardBackground: string;
  };
  cardStyle: React.CSSProperties;
  values: CarCostValues;
  calculations: CarCostCalculations;
};

export const LoanDetailsModal: React.FC<LoanDetailsModalProps> = ({
  loanDetailsModalRef,
  palette,
  cardStyle,
  values,
  calculations,
}) => (
  <div
    id="car-cost-loan-details-modal"
    className="modal modal-fixed-footer"
    ref={loanDetailsModalRef as React.RefObject<HTMLDivElement>}
  >
    <div className="modal-content" style={{ background: palette.panelBackground, color: palette.text }}>
      <h4 style={{ marginTop: 0 }}>Financing details</h4>
      <p style={{ color: palette.muted, lineHeight: 1.5 }}>
        This view shows how the loan is paid down during the time you expect to own the vehicle, including payments made, interest paid, and the remaining principal balance at sale.
      </p>
      <LoanPaydownDetails
        purchasePrice={values.purchasePrice}
        downPayment={values.loanDownPayment}
        financedAmount={calculations.financedAmount}
        apr={values.loanApr}
        monthlyPayment={calculations.effectiveMonthlyPayment}
        loanTermMonths={calculations.effectiveLoanTermMonths}
        monthsOwned={calculations.monthsOwned}
        payoffMonth={calculations.payoffMonth}
        remainingBalance={calculations.remainingLoanBalance}
        totalInterestPaid={calculations.totalInterestPaid}
        totalLoanPaymentsMade={calculations.totalLoanPaymentsMade}
        points={calculations.loanPaydownPoints}
        palette={{
          text: palette.text,
          muted: palette.muted,
          accent: palette.accent,
          border: palette.border,
          chartBase: palette.chartBase,
          cardBackground: palette.cardBackground,
        }}
        cardStyle={cardStyle}
      />
    </div>
    <div className="modal-footer" style={{ background: palette.panelBackground, borderTop: palette.border }}>
      <button
        type="button"
        className="modal-close waves-effect btn-flat"
        style={{ color: palette.accentDark, fontWeight: 700, textTransform: "none" }}
      >
        Close
      </button>
    </div>
  </div>
);
