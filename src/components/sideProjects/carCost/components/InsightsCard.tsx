import React, { useEffect, useRef } from "react";
import M from "materialize-css";

export type InsightCardData = {
  id: string;
  label: string;
  benchmark: number;
  context: string;
  tooltip: string;
  headline: string;
  isAbove: boolean;
  methodology: string;
  sourceLabel?: string;
  sourceUrl?: string;
  currentRate: number;
  associatedCategories: string[];
};

type InsightsCardProps = {
  insight: InsightCardData;
  cardStyle: React.CSSProperties;
  isDarkMode: boolean;
  mutedColor: string;
};

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

const InsightsCard: React.FC<InsightsCardProps> = ({
  insight,
  cardStyle,
  isDarkMode,
  mutedColor,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const modalInstanceRef = useRef<M.Modal | null>(null);

  useEffect(() => {
    if (!modalRef.current) {
      return;
    }

    modalInstanceRef.current = M.Modal.init(modalRef.current, {
      dismissible: true,
      preventScrolling: false,
      onCloseEnd: () => {
        document.body.style.overflow = "";
        document.body.style.width = "";
      },
    });

    return () => {
      document.body.style.overflow = "";
      document.body.style.width = "";
      modalInstanceRef.current?.destroy();
    };
  }, []);

  return (
    <>
      <article
        style={{
          ...cardStyle,
          padding: "1rem 1.1rem",
          height: "100%",
          background: insight.isAbove
            ? isDarkMode
              ? "linear-gradient(135deg, rgba(143, 54, 54, 0.26), rgba(88, 32, 32, 0.2))"
              : "linear-gradient(135deg, rgba(214, 119, 119, 0.18), rgba(255, 240, 240, 0.92))"
            : isDarkMode
              ? "linear-gradient(135deg, rgba(62, 118, 83, 0.26), rgba(34, 76, 50, 0.22))"
              : "linear-gradient(135deg, rgba(164, 220, 182, 0.22), rgba(242, 252, 245, 0.96))",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            marginBottom: "0.35rem",
          }}
        >
          <span style={{ display: "block", color: mutedColor }}>{insight.label}</span>
          <i
            className="material-icons tiny tooltipped"
            data-position="top"
            data-tooltip={insight.tooltip}
            style={{
              color: "var(--secondary-color)",
              cursor: "help",
              flex: "0 0 auto",
            }}
          >
            info_outline
          </i>
        </div>
        <strong style={{ display: "block", fontSize: "1.2rem", lineHeight: 1.25 }}>
          {insight.headline}
        </strong>
        <small style={{ display: "block", marginTop: "0.55rem", color: mutedColor }}>
          Benchmark: {formatCurrency(insight.benchmark)} per mile
        </small>
        <small style={{ display: "block", marginTop: "0.25rem", color: mutedColor }}>
          {insight.context}
        </small>
        <div style={{ display: "flex", gap: "0.9rem", flexWrap: "wrap", marginTop: "0.8rem" }}>
          <button
            type="button"
            className="btn-flat"
            onClick={() => modalInstanceRef.current?.open()}
            style={{
              minWidth: "unset",
              padding: 0,
              height: "auto",
              lineHeight: 1.4,
              color: "var(--secondary-color)",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Learn more
          </button>
        </div>
      </article>

      <div className="modal" ref={modalRef}>
        <div className="modal-content">
          <h4 style={{ marginTop: 0 }}>{insight.label}</h4>
          <p style={{ lineHeight: 1.6 }}>
            Your vehicle is currently estimated at <strong>{formatCurrency(insight.currentRate)}</strong>{" "}
            per mile, which means it is <strong>{insight.headline}</strong>.
          </p>
          <p style={{ lineHeight: 1.6 }}>{insight.tooltip}</p>
          <p style={{ lineHeight: 1.6, marginBottom: "0.75rem" }}>
            <strong>How we gathered it:</strong> {insight.methodology}
          </p>
          {insight.sourceUrl ? (
            <p style={{ marginBottom: 0 }}>
              <a href={insight.sourceUrl} target="_blank" rel="noreferrer">
                {insight.sourceLabel ?? "Open source"}
              </a>
            </p>
          ) : (
            <p style={{ marginBottom: 0 }}>This benchmark is an internal planning reference.</p>
          )}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="modal-close btn-flat"
            style={{ textTransform: "none", fontWeight: 600 }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default InsightsCard;
