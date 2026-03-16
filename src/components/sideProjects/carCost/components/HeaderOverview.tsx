import React from "react";
import { formatCurrency } from "../utils/formatters";

type Palette = {
  panelBackground: string;
  muted: string;
  accentDark: string;
  summaryHighlight: string;
  missionShadow: string;
};

type SummaryCard = {
  label: string;
  value: number;
  highlight?: boolean;
};

type HeaderOverviewProps = {
  palette: Palette;
  cardStyle: React.CSSProperties;
  stackedCardStyle: React.CSSProperties;
  isMobileView: boolean;
  primarySummaryCard: SummaryCard;
  secondarySummaryCards: SummaryCard[];
};

const HeaderOverview: React.FC<HeaderOverviewProps> = ({
  palette,
  cardStyle,
  stackedCardStyle,
  isMobileView,
  primarySummaryCard,
  secondarySummaryCards,
}) => {
  return (
    <div className="row" style={{ marginBottom: 0 }}>
      <div className="col s12 l7" style={{ marginBottom: "1rem" }}>
        <p
          style={{
            margin: 0,
            color: palette.accentDark,
            fontSize: "0.85rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Vehicle Cost Calculator
        </p>
        <h2
          style={{
            margin: "0.6rem 0 0",
            fontSize: "clamp(2.2rem, 4vw, 4rem)",
            lineHeight: 1,
          }}
        >
          Estimate what your vehicle really costs per mile.
        </h2>
        <p style={{ color: palette.muted, lineHeight: 1.6 }}>
          Plug in fuel, maintenance, tires, depreciation, and yearly ownership costs to get a clearer picture of what driving really costs.
        </p>
        <div
          style={{
            ...cardStyle,
            marginTop: "1.25rem",
            padding: isMobileView ? "1rem 1.1rem" : "1.25rem 1.5rem",
            background: palette.panelBackground,
            boxShadow: palette.missionShadow,
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: "1.2rem" }}>Why I built this</h3>
          <p style={{ color: palette.muted, lineHeight: 1.65 }}>
            I built this to help people understand the true cost of driving their vehicle. Most people focus on fuel first, and while that is a major part of the equation, it often does not tell the full story.
          </p>
          <p style={{ color: palette.muted, lineHeight: 1.65, marginBottom: 0 }}>
            That gap matters even more in the gig economy, where drivers may overestimate their real profit, and for families deciding whether it makes more sense to take their daily driver or rent a vehicle for a longer trip.
          </p>
        </div>
      </div>

      <div className="col s12 l5" style={{ marginBottom: "1rem" }}>
        <article
          style={{
            ...cardStyle,
            ...stackedCardStyle,
            padding: "1.05rem 1.2rem",
            color: "#fff",
            background: palette.summaryHighlight,
          }}
        >
          <span
            style={{
              display: "block",
              color: "rgba(255,255,255,0.82)",
              marginBottom: "0.3rem",
              fontSize: isMobileView ? "0.82rem" : "1rem",
            }}
          >
            {primarySummaryCard.label}
          </span>
          <strong
            style={{
              fontSize: isMobileView ? "1.7rem" : "2.1rem",
              lineHeight: 1,
            }}
          >
            {formatCurrency(primarySummaryCard.value)}
          </strong>
          <small
            style={{
              display: "block",
              marginTop: "0.3rem",
              color: "rgba(255,255,255,0.82)",
            }}
          >
            per mile
          </small>
        </article>

        {!isMobileView ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "0.8rem",
            }}
          >
            {secondarySummaryCards.map((card) => (
              <article
                key={card.label}
                style={{
                  ...cardStyle,
                  padding: "0.85rem 0.95rem",
                  minHeight: "96px",
                }}
              >
                <span
                  style={{
                    display: "block",
                    color: palette.muted,
                    marginBottom: "0.25rem",
                    fontSize: "0.88rem",
                    lineHeight: 1.25,
                  }}
                >
                  {card.label}
                </span>
                <strong
                  style={{
                    display: "block",
                    fontSize: "1.35rem",
                    lineHeight: 1.05,
                  }}
                >
                  {formatCurrency(card.value)}
                </strong>
                <small
                  style={{
                    display: "block",
                    marginTop: "0.22rem",
                    color: palette.muted,
                    fontSize: "0.82rem",
                  }}
                >
                  per mile
                </small>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default HeaderOverview;
