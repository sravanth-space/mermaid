import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ZoomControls } from "./ZoomControls";
import type { PanZoom } from "../hooks/usePanZoom";

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

describe("ZoomControls", () => {
  it("shows the zoom level as a rounded percentage", () => {
    render(<ZoomControls panZoom={panZoom({ zoom: 1.728 })} />);
    expect(screen.getByText("173%")).toBeInTheDocument();
  });

  it("wires the zoom and reset buttons", async () => {
    const user = userEvent.setup();
    const controls = panZoom();
    render(<ZoomControls panZoom={controls} />);

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await user.click(screen.getByRole("button", { name: "Zoom out" }));
    await user.click(screen.getByRole("button", { name: "Reset view" }));

    expect(controls.zoomIn).toHaveBeenCalledOnce();
    expect(controls.zoomOut).toHaveBeenCalledOnce();
    expect(controls.resetView).toHaveBeenCalledOnce();
  });

  it("offers fullscreen only when a handler is supplied", async () => {
    const user = userEvent.setup();
    const onToggleFullscreen = vi.fn();

    const { rerender } = render(<ZoomControls panZoom={panZoom()} />);
    expect(screen.queryByRole("button", { name: "Enter fullscreen" })).toBeNull();

    rerender(
      <ZoomControls panZoom={panZoom()} onToggleFullscreen={onToggleFullscreen} />
    );
    await user.click(screen.getByRole("button", { name: "Enter fullscreen" }));

    expect(onToggleFullscreen).toHaveBeenCalledOnce();
  });
});
