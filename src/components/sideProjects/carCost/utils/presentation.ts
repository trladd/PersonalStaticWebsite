import React from "react";

export const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  boxShadow: "none",
  margin: 0,
  padding: "0 1rem",
  height: "3rem",
  background: "transparent",
  color: "var(--text-color)",
  fontSize: "1rem",
  lineHeight: 1.4,
  fontFamily: "inherit",
};

export const stackedCardStyle: React.CSSProperties = {
  marginBottom: "0.9rem",
};

export const buildPalette = (isDarkMode: boolean) => ({
  shellBackground: isDarkMode
    ? "radial-gradient(circle at top left, rgba(184, 92, 56, 0.18), transparent 24%), linear-gradient(180deg, #191511 0%, #110e0b 100%)"
    : "radial-gradient(circle at top left, rgba(184, 92, 56, 0.18), transparent 24%), linear-gradient(180deg, #f8f4ec 0%, #f2eadf 100%)",
  cardBackground: isDarkMode ? "rgba(31, 25, 20, 0.96)" : "rgba(255, 252, 247, 0.96)",
  panelBackground: isDarkMode ? "rgba(39, 32, 24, 0.92)" : "rgba(255, 252, 247, 0.98)",
  subtlePanel: isDarkMode ? "rgba(44, 36, 27, 0.94)" : "rgba(255, 252, 247, 0.96)",
  border: isDarkMode
    ? "1px solid rgba(202, 202, 202, 0.12)"
    : "1px solid rgba(77, 55, 34, 0.12)",
  softBorder: isDarkMode
    ? "1px solid rgba(202, 202, 202, 0.16)"
    : "1px solid rgba(77, 55, 34, 0.15)",
  text: "var(--text-color)",
  muted: isDarkMode ? "rgba(202, 202, 202, 0.76)" : "#6b625b",
  accent: "#b85c38",
  accentDark: isDarkMode ? "#d79a7f" : "#7f351b",
  chartBase: isDarkMode ? "#2f261d" : "#f3e8da",
  chartCenter: isDarkMode ? "rgba(26, 22, 18, 0.98)" : "rgba(255, 252, 247, 0.98)",
  summaryHighlight: "linear-gradient(135deg, #b85c38 0%, #d47a4d 100%)",
  yearlyHighlight: isDarkMode
    ? "linear-gradient(135deg, rgba(184, 92, 56, 0.34) 0%, rgba(212, 122, 77, 0.28) 100%)"
    : "linear-gradient(135deg, #f0c59d 0%, #f7ddbd 100%)",
  resultHighlight: isDarkMode
    ? "linear-gradient(135deg, rgba(184, 92, 56, 0.26), rgba(212, 122, 77, 0.18))"
    : "linear-gradient(135deg, rgba(184, 92, 56, 0.12), rgba(212, 122, 77, 0.18))",
  tooltipBackground: isDarkMode
    ? "rgba(31, 25, 20, 0.98)"
    : "rgba(255, 252, 247, 0.98)",
  shadow: isDarkMode ? "0 24px 60px rgba(0, 0, 0, 0.34)" : "0 24px 60px rgba(91, 60, 34, 0.12)",
  missionShadow: isDarkMode
    ? "0 14px 34px rgba(0, 0, 0, 0.28)"
    : "0 14px 34px rgba(91, 60, 34, 0.08)",
});

export const buildCardStyle = (palette: ReturnType<typeof buildPalette>): React.CSSProperties => ({
  background: palette.cardBackground,
  border: palette.border,
  borderRadius: "24px",
  boxShadow: palette.shadow,
  color: palette.text,
});

export const buildInputContainerStyle = (
  palette: ReturnType<typeof buildPalette>,
): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  minHeight: "3rem",
  background: palette.subtlePanel,
  border: palette.softBorder,
  borderRadius: "14px",
  overflow: "hidden",
});

export const buildInvalidInputContainerStyle = (
  inputContainerStyle: React.CSSProperties,
  isDarkMode: boolean,
): React.CSSProperties => ({
  ...inputContainerStyle,
  border: isDarkMode
    ? "1px solid rgba(222, 114, 114, 0.55)"
    : "1px solid rgba(196, 73, 73, 0.38)",
  boxShadow: isDarkMode
    ? "0 0 0 1px rgba(222, 114, 114, 0.14)"
    : "0 0 0 1px rgba(196, 73, 73, 0.08)",
});

export const buildPrefixStyle = (
  palette: ReturnType<typeof buildPalette>,
): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  alignSelf: "stretch",
  padding: "0 0.85rem",
  color: palette.muted,
  fontWeight: 600,
  fontSize: "1rem",
  lineHeight: 1,
  borderRight: palette.softBorder,
  background: "rgba(0, 0, 0, 0.04)",
});

export const buildSelectStyle = (
  palette: ReturnType<typeof buildPalette>,
): React.CSSProperties => ({
  width: "100%",
  height: "3rem",
  minHeight: "3rem",
  border: "none",
  outline: "none",
  borderRadius: "14px",
  padding: "0 1rem",
  background: "transparent",
  color: palette.text,
  fontSize: "1rem",
  lineHeight: 1.4,
  fontFamily: "inherit",
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
});

export const buildCompactStyles = (
  isMobileView: boolean,
  palette: ReturnType<typeof buildPalette>,
) => {
  const compactMetricCardPadding = isMobileView ? "0.8rem 0.9rem" : "1rem 1.1rem";
  const compactMetricValueSize = isMobileView ? "1.15rem" : "1.5rem";

  return {
    compactMetricCardPadding,
    compactMetricLabelStyle: {
      display: "block",
      color: palette.muted,
      marginBottom: "0.35rem",
      fontSize: isMobileView ? "0.78rem" : "0.92rem",
      lineHeight: 1.3,
    } as React.CSSProperties,
    compactMetricValueStyle: {
      fontSize: compactMetricValueSize,
      lineHeight: 1.05,
    } as React.CSSProperties,
  };
};

export const sectionDescriptionStyle = (palette: ReturnType<typeof buildPalette>) =>
  ({
    color: palette.muted,
    lineHeight: 1.4,
    fontSize: "0.9rem",
  }) as React.CSSProperties;

export const fieldLabelStyle = {
  display: "block",
  fontWeight: 600,
  marginBottom: "0.38rem",
  fontSize: "0.98rem",
  lineHeight: 1.3,
} as React.CSSProperties;

export const subFieldLabelStyle = (palette: ReturnType<typeof buildPalette>) =>
  ({
    display: "block",
    color: palette.muted,
    fontWeight: 500,
    marginBottom: "0.3rem",
    fontSize: "0.82rem",
    lineHeight: 1.3,
  }) as React.CSSProperties;

export const buildButtonStyles = (
  isDarkMode: boolean,
  isMobileView: boolean,
  palette: ReturnType<typeof buildPalette>,
) => ({
  solidPrimaryButtonStyle: {
    marginTop: "1rem",
    backgroundColor: "var(--primary-color)",
    color: "#ffffff",
    opacity: 1,
    filter: "none",
  } as React.CSSProperties,
  solidSecondaryButtonStyle: {
    backgroundColor: "var(--secondary-color)",
    color: "#ffffff",
    opacity: 1,
    filter: "none",
    whiteSpace: "nowrap",
    borderRadius: "999px",
    boxShadow: isDarkMode
      ? "0 10px 22px rgba(0, 0, 0, 0.24)"
      : "0 10px 22px rgba(91, 60, 34, 0.16)",
    padding: isMobileView ? "0 1rem" : "0 1.2rem",
    height: isMobileView ? "2.7rem" : "2.85rem",
    lineHeight: isMobileView ? "2.7rem" : "2.85rem",
    fontSize: isMobileView ? "0.88rem" : "0.92rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
    textTransform: "none",
  } as React.CSSProperties,
  tripTypeButtonStyle: (isActive: boolean): React.CSSProperties => ({
    borderRadius: "999px",
    border: isActive ? "none" : palette.softBorder,
    background: isActive ? palette.accent : "transparent",
    color: isActive ? "#ffffff" : palette.text,
    textTransform: "none",
    fontWeight: 600,
    minWidth: "unset",
    padding: "0 1rem",
    boxShadow: "none",
  }),
});
