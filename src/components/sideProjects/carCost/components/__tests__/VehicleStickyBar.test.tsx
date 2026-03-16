import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import VehicleStickyBar from "../VehicleStickyBar";

describe("VehicleStickyBar", () => {
  const originalRect = HTMLElement.prototype.getBoundingClientRect;

  beforeEach(() => {
    jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(() => ({
        x: 100,
        y: 20,
        top: 20,
        left: 100,
        bottom: 116,
        right: 700,
        width: 600,
        height: 96,
        toJSON: () => ({}),
      }));
  });

  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = originalRect;
    jest.restoreAllMocks();
  });

  it("renders a fixed bar aligned to the measured slot and wires controls", async () => {
    const handleTemplateSwitch = jest.fn();
    const handleOpenOwnCarModal = jest.fn();

    const { container } = render(
      <VehicleStickyBar
        palette={{
          panelBackground: "#fff",
          muted: "#666",
          resultHighlight: "#eee",
          softBorder: "1px solid #ddd",
        }}
        cardStyle={{ border: "1px solid #ddd" }}
        inputContainerStyle={{}}
        selectStyle={{}}
        solidSecondaryButtonStyle={{}}
        isMobileView={false}
        stickyTop={64}
        currentVehicleLabel="2013 GMC Acadia Denali"
        selectedSource="template"
        selectedTemplateId="acadia"
        templateOptions={[
          { id: "acadia", title: "2013 GMC Acadia Denali" },
          { id: "camry", title: "2025 Toyota Camry" },
        ]}
        handleTemplateSwitch={handleTemplateSwitch}
        handleOpenOwnCarModal={handleOpenOwnCarModal}
        calculations={{ trueCostPerMile: 0.79 } as any}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /start over/i })).toBeInTheDocument(),
    );

    const stickyCard = Array.from(container.querySelectorAll("div")).find(
      (element) => (element as HTMLDivElement).style.position === "fixed",
    );

    expect(stickyCard).toHaveStyle({ position: "fixed", top: "64px" });
    expect(stickyCard).toHaveStyle({ left: "105px", width: "590px" });

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "camry" },
    });
    fireEvent.click(screen.getByRole("button", { name: /start over/i }));

    expect(handleTemplateSwitch).toHaveBeenCalledWith("camry");
    expect(handleOpenOwnCarModal).toHaveBeenCalledTimes(1);
  });
});
