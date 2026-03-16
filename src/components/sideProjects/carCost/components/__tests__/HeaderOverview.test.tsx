import React from "react";
import { render, screen } from "@testing-library/react";
import HeaderOverview from "../HeaderOverview";

describe("HeaderOverview", () => {
  it("renders hero copy and primary summary card", () => {
    render(
      <HeaderOverview
        palette={{
          panelBackground: "#fff",
          muted: "#666",
          accentDark: "#7f351b",
          summaryHighlight: "linear-gradient(#000, #111)",
          missionShadow: "none",
        }}
        cardStyle={{ border: "1px solid #ddd" }}
        stackedCardStyle={{ marginBottom: "1rem" }}
        isMobileView={false}
        primarySummaryCard={{ label: "True cost per mile", value: 0.79, highlight: true }}
        secondarySummaryCards={[
          { label: "Fuel", value: 0.15 },
          { label: "Tires", value: 0.04 },
        ]}
      />,
    );

    expect(
      screen.getByText(/Estimate what your vehicle really costs per mile/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Why I built this/i)).toBeInTheDocument();
    expect(screen.getByText(/True cost per mile/i)).toBeInTheDocument();
    expect(screen.getByText(/\$0.79/i)).toBeInTheDocument();
  });
});
