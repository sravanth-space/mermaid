import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type React from "react";
import { MAX_ZOOM, MIN_ZOOM, usePanZoom } from "./usePanZoom";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** Minimal stand-in for the wheel event; only deltaY is read. */
const wheelEvent = (deltaY: number) =>
  ({
    deltaY,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }) as unknown as React.WheelEvent<HTMLDivElement>;

const touchEvent = (points: { x: number; y: number }[]) => {
  const touches = points.map((p) => ({ clientX: p.x, clientY: p.y }));
  return {
    touches: Object.assign(touches, { length: touches.length }),
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as React.TouchEvent<HTMLDivElement>;
};

describe("usePanZoom", () => {
  it("starts at 100% with no offset", () => {
    const { result } = renderHook(() => usePanZoom());

    expect(result.current.zoom).toBe(1);
    expect(result.current.pan).toEqual({ x: 0, y: 0 });
    expect(result.current.isDragging).toBe(false);
  });

  it("zooms in and out in steps", () => {
    const { result } = renderHook(() => usePanZoom());

    act(() => result.current.zoomIn());
    expect(result.current.zoom).toBeCloseTo(1.2);

    act(() => result.current.zoomOut());
    expect(result.current.zoom).toBeCloseTo(1);
  });

  it("clamps the zoom-in button at the maximum", () => {
    const { result } = renderHook(() => usePanZoom());

    for (let i = 0; i < 20; i++) act(() => result.current.zoomIn());

    expect(result.current.zoom).toBe(MAX_ZOOM);
  });

  it("clamps the zoom-out button at the minimum", () => {
    const { result } = renderHook(() => usePanZoom());

    for (let i = 0; i < 20; i++) act(() => result.current.zoomOut());

    expect(result.current.zoom).toBe(MIN_ZOOM);
  });

  it("zooms on wheel and blocks the browser's page zoom", () => {
    const { result } = renderHook(() => usePanZoom());
    const event = wheelEvent(-100);

    act(() => result.current.gestureHandlers.onWheel(event));

    expect(result.current.zoom).toBeCloseTo(1.1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("reports hitting the maximum, then clears the notice", () => {
    const { result } = renderHook(() => usePanZoom());

    for (let i = 0; i < 40; i++) {
      act(() => result.current.gestureHandlers.onWheel(wheelEvent(-100)));
    }

    expect(result.current.zoom).toBe(MAX_ZOOM);
    expect(result.current.zoomLimitReached).toBe("max");

    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current.zoomLimitReached).toBe("");
  });

  it("reports hitting the minimum", () => {
    const { result } = renderHook(() => usePanZoom());

    for (let i = 0; i < 40; i++) {
      act(() => result.current.gestureHandlers.onWheel(wheelEvent(100)));
    }

    expect(result.current.zoom).toBe(MIN_ZOOM);
    expect(result.current.zoomLimitReached).toBe("min");
  });

  it("pans while the mouse is held down", () => {
    const { result } = renderHook(() => usePanZoom());

    act(() =>
      result.current.gestureHandlers.onMouseDown({
        button: 0,
        clientX: 100,
        clientY: 100,
      } as React.MouseEvent<HTMLDivElement>)
    );
    expect(result.current.isDragging).toBe(true);

    act(() =>
      document.dispatchEvent(
        new MouseEvent("mousemove", { clientX: 130, clientY: 90 })
      )
    );
    expect(result.current.pan).toEqual({ x: 30, y: -10 });

    act(() => document.dispatchEvent(new MouseEvent("mouseup")));
    expect(result.current.isDragging).toBe(false);
  });

  it("ignores non-primary mouse buttons", () => {
    const { result } = renderHook(() => usePanZoom());

    act(() =>
      result.current.gestureHandlers.onMouseDown({
        button: 2,
        clientX: 10,
        clientY: 10,
      } as React.MouseEvent<HTMLDivElement>)
    );

    expect(result.current.isDragging).toBe(false);
  });

  it("stops panning once the button is released", () => {
    const { result } = renderHook(() => usePanZoom());

    act(() =>
      result.current.gestureHandlers.onMouseDown({
        button: 0,
        clientX: 0,
        clientY: 0,
      } as React.MouseEvent<HTMLDivElement>)
    );
    act(() => document.dispatchEvent(new MouseEvent("mouseup")));
    act(() =>
      document.dispatchEvent(
        new MouseEvent("mousemove", { clientX: 500, clientY: 500 })
      )
    );

    expect(result.current.pan).toEqual({ x: 0, y: 0 });
  });

  it("pans with one finger", () => {
    const { result } = renderHook(() => usePanZoom());

    act(() =>
      result.current.gestureHandlers.onTouchStart(touchEvent([{ x: 50, y: 50 }]))
    );
    act(() =>
      result.current.gestureHandlers.onTouchMove(touchEvent([{ x: 70, y: 40 }]))
    );

    expect(result.current.pan).toEqual({ x: 20, y: -10 });
  });

  it("zooms on a two-finger pinch", () => {
    const { result } = renderHook(() => usePanZoom());

    // Fingers 100px apart, spreading to 200px, should double the zoom.
    act(() =>
      result.current.gestureHandlers.onTouchStart(
        touchEvent([
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ])
      )
    );
    act(() =>
      result.current.gestureHandlers.onTouchMove(
        touchEvent([
          { x: 0, y: 0 },
          { x: 200, y: 0 },
        ])
      )
    );

    expect(result.current.zoom).toBeCloseTo(2);
  });

  it("ends the gesture when the last finger lifts", () => {
    const { result } = renderHook(() => usePanZoom());

    act(() =>
      result.current.gestureHandlers.onTouchStart(touchEvent([{ x: 10, y: 10 }]))
    );
    act(() => result.current.gestureHandlers.onTouchEnd(touchEvent([])));

    expect(result.current.isDragging).toBe(false);
  });

  it("resets zoom and offset together", () => {
    const { result } = renderHook(() => usePanZoom());

    act(() => result.current.zoomIn());
    act(() =>
      result.current.gestureHandlers.onTouchStart(touchEvent([{ x: 0, y: 0 }]))
    );
    act(() =>
      result.current.gestureHandlers.onTouchMove(touchEvent([{ x: 40, y: 40 }]))
    );

    act(() => result.current.resetView());

    expect(result.current.zoom).toBe(1);
    expect(result.current.pan).toEqual({ x: 0, y: 0 });
  });

  it("leaves no timer behind on unmount", () => {
    const { result, unmount } = renderHook(() => usePanZoom());

    for (let i = 0; i < 40; i++) {
      act(() => result.current.gestureHandlers.onWheel(wheelEvent(-100)));
    }
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
