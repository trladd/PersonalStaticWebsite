import React, { useEffect, useState } from "react";

type SeeMoreButtonProps = {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  accentColor: string;
  ariaLabel: string;
  title?: string;
  label?: string;
  icon?: string;
  iconOnly?: boolean;
  mobileIconOnly?: boolean;
  buttonStyle?: React.CSSProperties;
  iconStyle?: React.CSSProperties;
};

const SeeMoreButton: React.FC<SeeMoreButtonProps> = ({
  onClick,
  accentColor,
  ariaLabel,
  title,
  label = "See more",
  icon = "open_in_full",
  iconOnly = false,
  mobileIconOnly = true,
  buttonStyle,
  iconStyle,
}) => {
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobileView(window.innerWidth < 700);
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);

    return () => {
      window.removeEventListener("resize", updateIsMobile);
    };
  }, []);

  const showLabel = !iconOnly && !(mobileIconOnly && isMobileView);

  return (
    <button
      type="button"
      className="btn-flat"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        gap: showLabel ? "0.3rem" : 0,
        color: accentColor,
        minWidth: "unset",
        padding: showLabel ? "0 0.5rem" : "0 0.45rem",
        lineHeight: 1,
        whiteSpace: "nowrap",
        textTransform: "none",
        fontWeight: 700,
        ...buttonStyle,
      }}
    >
      <i
        className={showLabel ? "material-icons left" : "material-icons"}
        style={{
          marginRight: showLabel ? "0.3rem" : 0,
          fontSize: "1.1rem",
          lineHeight: "inherit",
          ...iconStyle,
        }}
      >
        {icon}
      </i>
      {showLabel ? label : null}
    </button>
  );
};

export default SeeMoreButton;
