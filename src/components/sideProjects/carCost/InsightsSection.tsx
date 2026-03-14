import React from "react";
import InsightsCard, { InsightCardData } from "./InsightsCard";

type InsightsSectionProps = {
  insights: InsightCardData[];
  cardStyle: React.CSSProperties;
  isDarkMode: boolean;
  mutedColor: string;
  title?: string;
  description?: string;
};

const InsightsSection: React.FC<InsightsSectionProps> = ({
  insights,
  cardStyle,
  isDarkMode,
  mutedColor,
  title,
  description,
}) => {
  if (insights.length === 0) {
    return null;
  }

  return (
    <>
      {title ? <h3 style={{ marginTop: 0 }}>{title}</h3> : null}
      {description ? <p style={{ color: mutedColor, lineHeight: 1.5 }}>{description}</p> : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1rem",
        }}
      >
        {insights.map((insight) => (
          <div key={insight.id}>
            <InsightsCard
              insight={insight}
              cardStyle={cardStyle}
              isDarkMode={isDarkMode}
              mutedColor={mutedColor}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default InsightsSection;
