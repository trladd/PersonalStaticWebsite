import React from "react";

type InstallAppModalProps = {
  modalRef: React.RefObject<HTMLDivElement | null>;
  palette: {
    panelBackground: string;
    text: string;
    muted: string;
    border: string;
    subtlePanel: string;
  };
  solidPrimaryButtonStyle: React.CSSProperties;
  handleInstallApp: () => void;
};

const InstallAppModal: React.FC<InstallAppModalProps> = ({
  modalRef,
  palette,
  solidPrimaryButtonStyle,
  handleInstallApp,
}) => (
  <div
    id="car-cost-install-modal"
    className="modal"
    ref={modalRef as React.RefObject<HTMLDivElement>}
  >
    <div
      className="modal-content"
      style={{
        background: palette.panelBackground,
        color: palette.text,
      }}
    >
      <h4>Add this to your home screen</h4>
      <p style={{ color: palette.muted }}>
        Install this calculator as an app so it is easier to reopen and share
        later from your phone.
      </p>
      <div
        style={{
          marginTop: "1rem",
          padding: "1rem 1.1rem",
          borderRadius: "18px",
          background: palette.subtlePanel,
          border: `1px solid ${palette.border}`,
        }}
      >
        <button
          type="button"
          className="waves-effect waves-light btn primaryColor"
          onClick={handleInstallApp}
          style={solidPrimaryButtonStyle}
        >
          Add to home screen
        </button>
      </div>
    </div>
    <div
      className="modal-footer"
      style={{ background: palette.panelBackground, borderTop: palette.border }}
    />
  </div>
);

export default InstallAppModal;
