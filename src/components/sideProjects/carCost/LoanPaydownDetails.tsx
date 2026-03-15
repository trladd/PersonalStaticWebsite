import React, { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  loanTermMonths: number;
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
    notation: "compact",
    maximumFractionDigits: 1,
  });

const LoanPaydownDetails: React.FC<LoanPaydownDetailsProps> = ({
  purchasePrice,
  downPayment,
  financedAmount,
  apr,
  monthlyPayment,
  loanTermMonths,
  monthsOwned,
  payoffMonth,
  remainingBalance,
  totalInterestPaid,
  totalLoanPaymentsMade,
  points,
  palette,
  cardStyle,
}) => {
  const chartData = useMemo(
    () =>
      points.map((point) => ({
        month: point.month,
        principalBalance: point.balance,
        interestPaid: point.interestPaid,
      })),
    [points]
  );

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
              {formatCurrency(monthlyPayment)}/month for {loanTermMonths} months
            </small>
          </article>
        </div>
      </div>

      <article style={{ ...cardStyle, padding: "1rem 1.1rem", marginBottom: "1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <strong style={{ display: "block", marginBottom: "0.3rem" }}>Loan payoff curve</strong>
            <span style={{ color: palette.muted, lineHeight: 1.5 }}>
              Month-by-month view of remaining principal balance and cumulative interest paid.
              Hover or tap any point to inspect exact values.
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

        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem 0.5rem 0 0",
            borderRadius: "16px",
            background: palette.chartBase,
          }}
        >
          <div style={{ width: "100%", height: "360px" }}>
            <ResponsiveContainer>
              <LineChart
                data={chartData}
                margin={{ top: 16, right: 20, left: 12, bottom: 18 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={palette.border} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: palette.muted, fontSize: 12 }}
                  tickLine={{ stroke: palette.border }}
                  axisLine={{ stroke: palette.border }}
                  label={{
                    value: "Month number",
                    position: "insideBottom",
                    offset: -8,
                    fill: palette.muted,
                    fontSize: 12,
                  }}
                />
                <YAxis
                  tickFormatter={formatShortCurrency}
                  tick={{ fill: palette.muted, fontSize: 12 }}
                  tickLine={{ stroke: palette.border }}
                  axisLine={{ stroke: palette.border }}
                  width={78}
                  label={{
                    value: "Principal balance / interest paid",
                    angle: -90,
                    position: "insideLeft",
                    fill: palette.muted,
                    fontSize: 12,
                    dx: -2,
                  }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === "principalBalance" ? "Principal balance" : "Interest paid",
                  ]}
                  labelFormatter={(label) => `Month ${label}`}
                  contentStyle={{
                    background: palette.cardBackground,
                    border: palette.border,
                    borderRadius: "12px",
                    color: palette.text,
                  }}
                  itemStyle={{ color: palette.text }}
                  labelStyle={{ color: palette.text, fontWeight: 700 }}
                />
                <Legend
                  wrapperStyle={{ color: palette.muted, paddingTop: "10px" }}
                  formatter={(value) =>
                    value === "principalBalance" ? "Principal balance" : "Interest paid"
                  }
                />
                <Line
                  type="monotone"
                  dataKey="principalBalance"
                  name="principalBalance"
                  stroke={palette.accent}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="interestPaid"
                  name="interestPaid"
                  stroke="#4f6d7a"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
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
