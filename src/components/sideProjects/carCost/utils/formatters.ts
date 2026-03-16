export const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const formatNumber = (value: number, maximumFractionDigits = 0) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });

export const isToggleEnabled = (value: number) => value === 1;
