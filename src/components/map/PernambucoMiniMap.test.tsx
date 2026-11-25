import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BELO_JARDIM_CENTER } from "@/lib/geo/belo-jardim";
import { PernambucoMiniMap } from "./PernambucoMiniMap";

afterEach(cleanup);

describe("PernambucoMiniMap", () => {
  it("renders Pernambuco state contour in the bottom-left with responsive sizing and dynamic marker", () => {
    render(<PernambucoMiniMap center={BELO_JARDIM_CENTER} />);

    const region = screen.getByRole("region", {
      name: /pernambuco.*belo jardim/i,
    });
    expect(region).toBeInTheDocument();
    expect(region.className).toContain("w-28");
    expect(region.className).toContain("md:w-44");

    const markerDot = screen.getByTestId("minimap-marker-dot");
    const cx = Number(markerDot.getAttribute("cx"));
    const cy = Number(markerDot.getAttribute("cy"));
    expect(cx).toBeCloseTo(235.73, 1);
    expect(cy).toBeCloseTo(60.89, 1);
  });

  it("updates marker coordinates dynamically east and north when viewport center moves toward Serra do Vento", () => {
    const { rerender } = render(<PernambucoMiniMap center={BELO_JARDIM_CENTER} />);
    const initialDot = screen.getByTestId("minimap-marker-dot");
    const initialCx = Number(initialDot.getAttribute("cx"));
    const initialCy = Number(initialDot.getAttribute("cy"));

    const serraDoVento: readonly [number, number] = [-36.3652, -8.2554];
    rerender(<PernambucoMiniMap center={serraDoVento} />);

    const updatedDot = screen.getByTestId("minimap-marker-dot");
    const updatedCx = Number(updatedDot.getAttribute("cx"));
    const updatedCy = Number(updatedDot.getAttribute("cy"));
    expect(updatedCx).toBeGreaterThan(initialCx);
    expect(updatedCy).toBeLessThan(initialCy);
  });

  it("hides completely when hidden={true} for mobile Bottom Sheet clearance", () => {
    const { container } = render(<PernambucoMiniMap center={BELO_JARDIM_CENTER} hidden />);
    expect(container).toBeEmptyDOMElement();
  });
});
