import React from "react";
import type { BreakdownItemDetailSection } from "./BreakdownItemDetailModal";

type BreakdownDetailSectionsProps = {
  sections: BreakdownItemDetailSection[];
  palette: {
    text: string;
    muted: string;
    border: string;
  };
  cardStyle: React.CSSProperties;
};

const BreakdownDetailSections: React.FC<BreakdownDetailSectionsProps> = ({
  sections,
  palette,
  cardStyle,
}) => (
  <div className="row" style={{ marginBottom: 0 }}>
    {sections.map((section) => (
      <div
        key={section.title}
        className={section.fullWidth ? "col s12" : "col s12 l6"}
        style={{ marginBottom: "1rem" }}
      >
        <article style={{ ...cardStyle, padding: "1rem 1.1rem", height: "100%" }}>
          {section.eyebrow ? (
            <span
              style={{
                display: "block",
                marginBottom: "0.3rem",
                fontSize: "0.76rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: palette.muted,
              }}
            >
              {section.eyebrow}
            </span>
          ) : null}
          <strong
            style={{
              display: "block",
              marginBottom: "0.8rem",
              fontSize: "1.05rem",
              lineHeight: 1.25,
              color: palette.text,
            }}
          >
            {section.title}
          </strong>
          <div style={{ display: "grid", gap: "0.7rem" }}>
            {section.rows.map((row, index) => (
              <div
                key={`${section.title}-${row.label}`}
                style={{
                  display: "grid",
                  gap: "0.25rem",
                  paddingBottom: index === section.rows.length - 1 ? 0 : "0.7rem",
                  borderBottom:
                    index === section.rows.length - 1
                      ? "none"
                      : `1px solid ${palette.border}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ color: palette.muted }}>{row.label}</span>
                  <strong style={{ textAlign: "right", color: palette.text }}>
                    {row.value}
                  </strong>
                </div>
                {row.hint ? (
                  <p
                    style={{
                      margin: 0,
                      color: palette.muted,
                      lineHeight: 1.45,
                      fontSize: "0.9rem",
                    }}
                  >
                    {row.hint}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          {section.callout ? (
            <div
              style={{
                marginTop: "0.9rem",
                padding: "0.85rem 0.95rem",
                borderRadius: "14px",
                border: `1px solid ${
                  section.callout.tone === "success"
                    ? "rgba(111, 143, 114, 0.24)"
                    : "rgba(79, 109, 122, 0.16)"
                }`,
                background:
                  section.callout.tone === "success"
                    ? "rgba(111, 143, 114, 0.08)"
                    : "rgba(79, 109, 122, 0.06)",
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: "0.35rem",
                  fontSize: "0.95rem",
                  color: palette.text,
                }}
              >
                {section.callout.title}
              </strong>
              <p
                style={{
                  margin: 0,
                  color: palette.muted,
                  lineHeight: 1.5,
                  fontSize: "0.92rem",
                }}
              >
                {section.callout.body}
              </p>
            </div>
          ) : null}
        </article>
      </div>
    ))}
  </div>
);

export default BreakdownDetailSections;
