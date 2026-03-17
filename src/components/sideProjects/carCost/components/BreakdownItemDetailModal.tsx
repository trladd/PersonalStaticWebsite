import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import BreakdownDetailSections from "./BreakdownDetailSections";

export type BreakdownItemDetailMetric = {
  label: string;
  value: string;
};

export type BreakdownItemDetailSectionRow = {
  label: string;
  value: string;
  hint?: string;
};

export type BreakdownItemDetailSection = {
  title: string;
  eyebrow?: string;
  rows: BreakdownItemDetailSectionRow[];
  fullWidth?: boolean;
  callout?: {
    title: string;
    body: string;
    tone?: "info" | "success";
  };
};

export type BreakdownItemDetailSegment = {
  label: string;
  value: number;
  color: string;
};

export type BreakdownItemDetail = {
  title: string;
  subtitle?: string;
  metrics?: BreakdownItemDetailMetric[];
  sections?: BreakdownItemDetailSection[];
  steps?: string[];
  pieTitle?: string;
  pieSegments?: BreakdownItemDetailSegment[];
  note?: string;
};

type BreakdownItemDetailModalProps = {
  detail: BreakdownItemDetail | null;
  onClose: () => void;
  palette: {
    text: string;
    muted: string;
    border: string;
    cardBackground: string;
    shadow: string;
  };
  cardStyle: React.CSSProperties;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });

const BreakdownItemDetailModal: React.FC<BreakdownItemDetailModalProps> = ({
  detail,
  onClose,
  palette,
  cardStyle,
}) => {
  if (!detail) {
    return null;
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.48)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 1500,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          ...cardStyle,
          width: "min(960px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "1.25rem",
          boxShadow: palette.shadow,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>{detail.title}</h3>
            {detail.subtitle ? (
              <p style={{ margin: "0.4rem 0 0", color: palette.muted, lineHeight: 1.5 }}>
                {detail.subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="btn-flat"
            onClick={onClose}
            style={{
              color: palette.text,
              textTransform: "none",
              minWidth: "unset",
              padding: "0 0.5rem",
            }}
          >
            <i className="material-icons">close</i>
          </button>
        </div>

        {detail.metrics?.length ? (
          <div className="row" style={{ marginBottom: 0 }}>
            {detail.metrics.map((metric) => (
              <div key={metric.label} className="col s12 m6 xl4" style={{ marginBottom: "1rem" }}>
                <article style={{ ...cardStyle, padding: "1rem 1.1rem", height: "100%" }}>
                  <span style={{ display: "block", color: palette.muted, marginBottom: "0.35rem" }}>
                    {metric.label}
                  </span>
                  <strong style={{ fontSize: "1.2rem", lineHeight: 1.2 }}>{metric.value}</strong>
                </article>
              </div>
            ))}
          </div>
        ) : null}

        {detail.sections?.length ? (
          <BreakdownDetailSections
            sections={detail.sections}
            palette={palette}
            cardStyle={cardStyle}
          />
        ) : null}

        {detail.steps?.length ? (
          <article style={{ ...cardStyle, padding: "1rem 1.1rem", marginBottom: "1rem" }}>
            <strong style={{ display: "block", marginBottom: "0.75rem" }}>How this was calculated</strong>
            {detail.steps.map((step) => (
              <p key={step} style={{ margin: "0 0 0.6rem", color: palette.muted, lineHeight: 1.55 }}>
                {step}
              </p>
            ))}
          </article>
        ) : null}

        {detail.pieSegments?.length ? (
          <article style={{ ...cardStyle, padding: "1rem 1.1rem", marginBottom: "1rem" }}>
            <strong style={{ display: "block", marginBottom: "0.75rem" }}>
              {detail.pieTitle ?? "Breakdown"}
            </strong>
            <div className="row" style={{ marginBottom: 0 }}>
              <div className="col s12 l6" style={{ marginBottom: "1rem" }}>
                <div style={{ width: "100%", height: "280px" }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={detail.pieSegments}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={62}
                        outerRadius={98}
                        paddingAngle={2}
                      >
                        {detail.pieSegments.map((segment) => (
                          <Cell key={segment.label} fill={segment.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [formatCurrency(value), name]}
                        contentStyle={{
                          background: palette.cardBackground,
                          border: palette.border,
                          borderRadius: "12px",
                          color: palette.text,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col s12 l6" style={{ marginBottom: "1rem" }}>
                {detail.pieSegments.map((segment) => (
                  <article
                    key={segment.label}
                    style={{
                      ...cardStyle,
                      padding: "0.9rem 1rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "999px",
                          background: segment.color,
                        }}
                      />
                      <strong>{segment.label}</strong>
                    </div>
                    <span style={{ color: palette.muted }}>{formatCurrency(segment.value)}</span>
                  </article>
                ))}
              </div>
            </div>
          </article>
        ) : null}

        {detail.note ? (
          <p style={{ color: palette.muted, lineHeight: 1.55, marginBottom: 0 }}>{detail.note}</p>
        ) : null}
      </div>
    </div>
  );
};

export default BreakdownItemDetailModal;
