import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import SeeMoreButton from "./SeeMoreButton";

describe("SeeMoreButton", () => {
  it("shows the label on desktop and calls click handler", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1200,
    });

    const onClick = jest.fn();
    render(
      <SeeMoreButton
        onClick={onClick}
        accentColor="#b85c38"
        ariaLabel="See more details"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /see more details/i }));

    expect(screen.getByText("See more")).toBeInTheDocument();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("collapses to icon-only on mobile when mobileIconOnly is enabled", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 500,
    });

    render(
      <SeeMoreButton
        onClick={jest.fn()}
        accentColor="#b85c38"
        ariaLabel="See more details"
      />,
    );

    expect(screen.queryByText("See more")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /see more details/i })).toBeInTheDocument();
  });
});
