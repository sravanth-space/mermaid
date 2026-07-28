import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DiagramPane } from "./DiagramPane";
import type { PanZoom } from "../hooks/usePanZoom";

const SVG = '<svg data-testid="diagram"><text>Start</text></svg>';

const panZoom = (overrides: Partial<PanZoom> = {}): PanZoom => ({
  zoom: 1,
  pan: { x: 0, y: 0 },
  isDragging: false,
  zoomLimitReached: "",
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  resetView: vi.fn(),
  gestureHandlers: {
    onWheel: vi.fn(),
    onMouseDown: vi.fn(),
    onTouchStart: vi.fn(),
    onTouchMove: vi.fn(),
    onTouchEnd: vi.fn(),
  },
  ...overrides,
});

describe("DiagramPane", () => {
  it("renders the provided SVG markup", () => {
    render(<DiagramPane svg={SVG} error="" panZoom={panZoom()} />);

    expect(screen.getByTestId("diagram")).toBeInTheDocument();
    expect(screen.getByText("Start")).toBeInTheDocument();
  });

  it("prompts the user when there is nothing to show", () => {
    render(<DiagramPane svg="" error="" panZoom={panZoom()} />);

    expect(screen.getByText("Start typing to see your diagram")).toBeInTheDocument();
  });

  it("applies the current pan and zoom as a transform", () => {
    const { container } = render(
      <DiagramPane
        svg={SVG}
        error=""
        panZoom={panZoom({ zoom: 1.5, pan: { x: 20, y: -10 } })}
      />
    );

    const surface = container.querySelector(".diagram-surface");
    expect(surface).toHaveStyle({ transform: "translate(20px, -10px) scale(1.5)" });
  });

  it("shows the error message without discarding the last good diagram", () => {
    render(
      <DiagramPane svg={SVG} error="Parse error on line 2" panZoom={panZoom()} />
    );

    expect(screen.getByText("Parse error on line 2")).toBeInTheDocument();
    // The point of the banner: the previous render stays visible.
    expect(screen.getByTestId("diagram")).toBeInTheDocument();
  });

  it("renders the error as text rather than markup", () => {
    // The message reaches the DOM as text, so an injected tag must not become
    // an element.
    render(
      <DiagramPane
        svg={SVG}
        error='<img src=x onerror="alert(1)">'
        panZoom={panZoom()}
      />
    );

    expect(screen.getByText('<img src=x onerror="alert(1)">')).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("announces the zoom bounds", () => {
    const { rerender } = render(
      <DiagramPane
        svg={SVG}
        error=""
        panZoom={panZoom({ zoomLimitReached: "max" })}
      />
    );
    expect(screen.getByText("Maximum zoom (300%)")).toBeInTheDocument();

    rerender(
      <DiagramPane
        svg={SVG}
        error=""
        panZoom={panZoom({ zoomLimitReached: "min" })}
      />
    );
    expect(screen.getByText("Minimum zoom (20%)")).toBeInTheDocument();
  });

  it("shows the gesture hint by default and hides it on request", () => {
    const { rerender } = render(
      <DiagramPane svg={SVG} error="" panZoom={panZoom()} />
    );
    expect(screen.getByText(/Drag to pan/)).toBeInTheDocument();

    rerender(
      <DiagramPane svg={SVG} error="" panZoom={panZoom()} showHint={false} />
    );
    expect(screen.queryByText(/Drag to pan/)).toBeNull();
  });

  it("switches the cursor while dragging", () => {
    const { container, rerender } = render(
      <DiagramPane svg={SVG} error="" panZoom={panZoom()} />
    );
    expect(container.firstChild).toHaveStyle({ cursor: "grab" });

    rerender(
      <DiagramPane svg={SVG} error="" panZoom={panZoom({ isDragging: true })} />
    );
    expect(container.firstChild).toHaveStyle({ cursor: "grabbing" });
  });
});
