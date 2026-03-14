import React, { useMemo, useState } from "react";

export type LoanPaydownPoint = {
  month: number;
  balance: number;
  interestPaid: number;
};

type LoanPaydownDetailsProps = {
  purchasePrice: number;
  downPayment: number;
  financedAmount: number;
  apr: number;
  monthlyPayment: number;
  monthsOwned: number;
  payoffMonth: number | null;
  remainingBalance: number;
  totalInterestPaid: number;
  totalLoanPaymentsMade: number;
  points: LoanPaydownPoint[];
  palette: {
    text: string;
    muted: string;
    accent: string;
    border: string;
    chartBase: string;
    cardBackground: string;
  };
  cardStyle: React.CSSProperties;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });
const formatShortCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const LoanPaydownDetails: React.FC<LoanPaydownDetailsProps> = ({
  purchasePrice,
  downPayment,
  financedAmount,
  apr,
  monthlyPayment,
  monthsOwned,
  payoffMonth,
  remainingBalance,
  totalInterestPaid,
  totalLoanPaymentsMade,
  points,
  palette,
  cardStyle,
}) => {
  const [activeMonth, setActiveMonth] = useState<number | null>(null);

  const chartGeometry = useMemo(() => {
    if (points.length < 2) {
      return {
        balancePath: "",
        interestPath: "",
        maxMonth: 1,
        maxValue: 1,
      };
    }

    const maxValue = Math.max(
      ...points.flatMap((point) => [point.balance, point.interestPaid]),
      1
    );
    const maxMonth = Math.max(...points.map((point) => point.month), 1);

    const buildPath = (valueSelector: (point: LoanPaydownPoint) => number) =>
      points
        .map((point, index) => {
          const x = 14 + (point.month / maxMonth) * 78;
          const y = 86 - (valueSelector(point) / maxValue) * 62;
          return `${index === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");

    return {
      balancePath: buildPath((point) => point.balance),
      interestPath: buildPath((point) => point.interestPaid),
      maxMonth,
      maxValue,
    };
  }, [points]);

  const xTicks = useMemo(
    () => [0, Math.round(chartGeometry.maxMonth / 2), chartGeometry.maxMonth],
    [chartGeometry.maxMonth]
  );

  const yTicks = useMemo(
    () => [0, chartGeometry.maxValue / 2, chartGeometry.maxValue],
    [chartGeometry.maxValue]
  );

  const activePoint = useMemo(() => {
    if (activeMonth === null) {
      return null;
    }

    return points.find((point) => point.month === activeMonth) ?? null;
  }, [activeMonth, points]);

  return (
    <div>
      <div className="row" style={{ marginBottom: 0 }}>
        <div className="col s12 m6 xl3" style={{ marginBottom: "1rem" }}>
          <article style={{ ...cardStyle, padding: "1rem 1.1rem", height: "100%" }}>
            <span style={{ display: "block", color: palette.muted, marginBottom: "0.4rem" }}>
              Purchase price
            </span>
            <strong style={{ fontSize: "1.35rem", lineHeight: 1.1 }}>
              {formatCurrency(purchasePrice)}
            </strong>
          </article>
        </div>
        <div className="col s12 m6 xl3" style={{ marginBottom: "1rem" }}>
          <article style={{ ...cardStyle, padding: "1rem 1.1rem", height: "100%" }}>
            <span style={{ display: "block", color: palette.muted, marginBottom: "0.4rem" }}>
              Down payment
            </span>
            <strong style={{ fontSize: "1.35rem", lineHeight: 1.1 }}>
              {formatCurrency(downPayment)}
            </strong>
          </article>
        </div>
        <div className="col s12 m6 xl3" style={{ marginBottom: "1rem" }}>
          <article style={{ ...cardStyle, padding: "1rem 1.1rem", height: "100%" }}>
            <span style={{ display: "block", color: palette.muted, marginBottom: "0.4rem" }}>
              Amount financed
            </span>
            <strong style={{ fontSize: "1.35rem", lineHeight: 1.1 }}>
              {formatCurrency(financedAmount)}
            </strong>
          </article>
        </div>
        <div className="col s12 m6 xl3" style={{ marginBottom: "1rem" }}>
          <article style={{ ...cardStyle, padding: "1rem 1.1rem", height: "100%" }}>
            <span style={{ display: "block", color: palette.muted, marginBottom: "0.4rem" }}>
              Loan setup
            </span>
            <strong style={{ fontSize: "1.1rem", lineHeight: 1.35 }}>
              {apr.toFixed(2)}% APR
            </strong>
            <small style={{ display: "block", marginTop: "0.35rem", color: palette.muted }}>
              {formatCurrency(monthlyPayment)}/month
            </small>
          </article>
        </div>
      </div>

      <article style={{ ...cardStyle, padding: "1rem 1.1rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <strong style={{ display: "block", marginBottom: "0.3rem" }}>Loan payoff curve</strong>
            <span style={{ color: palette.muted, lineHeight: 1.5 }}>
              Shows the remaining principal balance over time. The curve stops early if the loan
              is paid off before you sell the vehicle.
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <strong style={{ display: "block" }}>
              {payoffMonth !== null ? `Paid off in month ${payoffMonth}` : "Loan not paid off yet"}
            </strong>
            <small style={{ color: palette.muted }}>
              Ownership window: {monthsOwned} months
            </small>
          </div>
        </div>
        <svg viewBox="0 0 100 100" style={{ width: "100%", display: "block", marginTop: "1rem" }}>
          {yTicks.map((tickValue, index) => {
            const y = 86 - (tickValue / chartGeometry.maxValue) * 62;
            return (
              <g key={`y-${index}`}>
                <line x1="14" y1={y} x2="92" y2={y} stroke={palette.border} strokeDasharray="2 2" />
                <text
                  x="12"
                  y={y + 1.5}
                  textAnchor="end"
                  style={{ fontSize: "3px", fill: palette.muted }}
                >
                  {formatShortCurrency(tickValue)}
                </text>
              </g>
            );
          })}
          {xTicks.map((tickValue, index) => {
            const x = 14 + (tickValue / chartGeometry.maxMonth) * 78;
            return (
              <g key={`x-${index}`}>
                <line x1={x} y1="86" x2={x} y2="88.5" stroke={palette.border} />
                <text
                  x={x}
                  y="93"
                  textAnchor="middle"
                  style={{ fontSize: "3px", fill: palette.muted }}
                >
                  {tickValue}
                </text>
              </g>
            );
          })}
          <line x1="14" y1="86" x2="92" y2="86" stroke={palette.border} />
          <line x1="14" y1="24" x2="14" y2="86" stroke={palette.border} />
          <text
            x="53"
            y="98"
            textAnchor="middle"
            style={{ fontSize: "3.2px", fill: palette.muted, fontWeight: 600 }}
          >
            Month number
          </text>
          <text
            x="3.5"
            y="55"
            textAnchor="middle"
            transform="rotate(-90 3.5 55)"
            style={{ fontSize: "3.2px", fill: palette.muted, fontWeight: 600 }}
          >
            Principal balance / interest paid
          </text>
          <path
            d={chartGeometry.balancePath}
            fill="none"
            stroke={palette.accent}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={chartGeometry.interestPath}
            fill="none"
            stroke="#4f6d7a"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((point) => {
            const x = 14 + (point.month / chartGeometry.maxMonth) * 78;
            const balanceY = 86 - (point.balance / chartGeometry.maxValue) * 62;
            const interestY = 86 - (point.interestPaid / chartGeometry.maxValue) * 62;
            const isActive = activePoint?.month === point.month;

            return (
              <g key={point.month}>
                <circle
                  cx={x}
                  cy={balanceY}
                  r={isActive ? "1.6" : "0.9"}
                  fill={palette.accent}
                />
                <circle
                  cx={x}
                  cy={interestY}
                  r={isActive ? "1.5" : "0.8"}
                  fill="#4f6d7a"
                />
              </g>
            );
          })}
          <rect
            x="14"
            y="24"
            width="78"
            height="62"
            fill="transparent"
            onMouseLeave={() => setActiveMonth(null)}
            onMouseMove={(event) => {
              const svg = event.currentTarget.ownerSVGElement;
              if (!svg) {
                return;
              }
              const point = svg.createSVGPoint();
              point.x = event.clientX;
              point.y = event.clientY;
              const cursor = point.matrixTransform(svg.getScreenCTM()?.inverse());
              const relativeX = Math.min(Math.max(cursor.x, 14), 92);
              const month = Math.round(((relativeX - 14) / 78) * chartGeometry.maxMonth);
              setActiveMonth(month);
            }}
            onTouchMove={(event) => {
              const svg = event.currentTarget.ownerSVGElement;
              const touch = event.touches[0];
              if (!svg || !touch) {
                return;
              }
              const point = svg.createSVGPoint();
              point.x = touch.clientX;
              point.y = touch.clientY;
              const cursor = point.matrixTransform(svg.getScreenCTM()?.inverse());
              const relativeX = Math.min(Math.max(cursor.x, 14), 92);
              const month = Math.round(((relativeX - 14) / 78) * chartGeometry.maxMonth);
              setActiveMonth(month);
            }}
          />
          {activePoint ? (
            <>
              {(() => {
                const x = 14 + (activePoint.month / chartGeometry.maxMonth) * 78;
                const balanceY = 86 - (activePoint.balance / chartGeometry.maxValue) * 62;
                const interestY =
                  86 - (activePoint.interestPaid / chartGeometry.maxValue) * 62;
                const tooltipX = Math.min(Math.max(x + 2, 28), 72);
                const tooltipY = Math.max(Math.min(Math.min(balanceY, interestY) - 16, 60), 18);

                return (
                  <g>
                    <line
                      x1={x}
                      y1="24"
                      x2={x}
                      y2="86"
                      stroke={palette.border}
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={tooltipX}
                      y={tooltipY}
                      width="24"
                      height="15"
                      rx="2.5"
                      fill={palette.cardBackground}
                      stroke={palette.border}
                    />
                    <text
                      x={tooltipX + 1.8}
                      y={tooltipY + 4.2}
                      style={{ fontSize: "2.6px", fill: palette.text, fontWeight: 700 }}
                    >
                      {`Month ${activePoint.month}`}
                    </text>
                    <text
                      x={tooltipX + 1.8}
                      y={tooltipY + 8}
                      style={{ fontSize: "2.3px", fill: palette.accent }}
                    >
                      {`Bal ${formatShortCurrency(activePoint.balance)}`}
                    </text>
                    <text
                      x={tooltipX + 1.8}
                      y={tooltipY + 11.8}
                      style={{ fontSize: "2.3px", fill: "#4f6d7a" }}
                    >
                      {`Int ${formatShortCurrency(activePoint.interestPaid)}`}
                    </text>
                  </g>
                );
              })()}
            </>
          ) : null}
        </svg>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            alignItems: "center",
            marginTop: "0.75rem",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: palette.muted }}>
            <span style={{ width: "12px", height: "3px", background: palette.accent, display: "inline-block" }} />
            Principal balance
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: palette.muted }}>
            <span style={{ width: "12px", height: "3px", background: "#4f6d7a", display: "inline-block" }} />
            Interest paid
          </span>
        </div>
        {activePoint ? (
          <div
            style={{
              marginTop: "0.9rem",
              padding: "0.9rem 1rem",
              borderRadius: "14px",
              background: palette.cardBackground,
              border: palette.border,
            }}
          >
            <strong style={{ display: "block", marginBottom: "0.35rem" }}>
              Month {activePoint.month} snapshot
            </strong>
            <span style={{ display: "block", color: palette.muted, lineHeight: 1.5 }}>
              Remaining principal balance: {formatCurrency(activePoint.balance)}
            </span>
            <span style={{ display: "block", color: palette.muted, lineHeight: 1.5 }}>
              Cumulative interest paid: {formatCurrency(activePoint.interestPaid)}
            </span>
          </div>
        ) : (
          <div
            style={{
              marginTop: "0.9rem",
              padding: "0.9rem 1rem",
              borderRadius: "14px",
              background: palette.cardBackground,
              border: palette.border,
              color: palette.muted,
              lineHeight: 1.5,
            }}
          >
            Move across the chart to inspect the exact principal balance and cumulative interest
            paid for each month.
          </div>
        )}
      </article>

      <div className="row" style={{ marginBottom: 0 }}>
        <div className="col s12 m6 xl4" style={{ marginBottom: "1rem" }}>
          <article style={{ ...cardStyle, padding: "1rem 1.1rem", height: "100%" }}>
            <span style={{ display: "block", color: palette.muted, marginBottom: "0.4rem" }}>
              Payments made while owned
            </span>
            <strong style={{ fontSize: "1.35rem", lineHeight: 1.1 }}>
              {formatCurrency(totalLoanPaymentsMade)}
            </strong>
          </article>
        </div>
        <div className="col s12 m6 xl4" style={{ marginBottom: "1rem" }}>
          <article style={{ ...cardStyle, padding: "1rem 1.1rem", height: "100%" }}>
            <span style={{ display: "block", color: palette.muted, marginBottom: "0.4rem" }}>
              Interest paid while owned
            </span>
            <strong style={{ fontSize: "1.35rem", lineHeight: 1.1 }}>
              {formatCurrency(totalInterestPaid)}
            </strong>
          </article>
        </div>
        <div className="col s12 m6 xl4" style={{ marginBottom: "1rem" }}>
          <article style={{ ...cardStyle, padding: "1rem 1.1rem", height: "100%" }}>
            <span style={{ display: "block", color: palette.muted, marginBottom: "0.4rem" }}>
              Remaining principal at sale
            </span>
            <strong style={{ fontSize: "1.35rem", lineHeight: 1.1 }}>
              {formatCurrency(remainingBalance)}
            </strong>
          </article>
        </div>
      </div>
    </div>
  );
};

export default LoanPaydownDetails;
