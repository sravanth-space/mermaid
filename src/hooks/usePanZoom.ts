import { useEffect, useRef, useState } from "react";
import type React from "react";

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 3;

export interface Point {
  x: number;
  y: number;
}

/** Which zoom bound the user just bumped into, or "" when within range. */
export type ZoomLimit = "" | "min" | "max";

export interface PanZoom {
  zoom: number;
  pan: Point;
  isDragging: boolean;
  zoomLimitReached: ZoomLimit;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  /** Spread onto the element that should respond to pan/zoom gestures. */
  gestureHandlers: {
    onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
    onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
    onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
  };
}

const distanceBetweenTouches = (touches: React.TouchList) =>
  Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY
  );

/**
 * Pan and zoom state for a diagram viewport, driven by wheel, drag and
 * pinch gestures. One instance is shared between the inline preview and the
 * fullscreen view so the viewport does not jump when switching between them.
 */
export const usePanZoom = (): PanZoom => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragLastPos, setDragLastPos] = useState<Point>({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  const [zoomLimitReached, setZoomLimitReached] = useState<ZoomLimit>("");
  const limitTimer = useRef(0);

  // Clear the "at the limit" notice after a moment, replacing any pending
  // clear so rapid gestures cannot leave a stale notice or a leaked timer.
  const flagLimit = (limit: ZoomLimit) => {
    setZoomLimitReached(limit);
    window.clearTimeout(limitTimer.current);
    if (limit) {
      limitTimer.current = window.setTimeout(
        () => setZoomLimitReached(""),
        1000
      );
    }
  };

  useEffect(() => () => window.clearTimeout(limitTimer.current), []);

  /** Multiplies the current zoom, clamping and reporting when a bound is hit. */
  const applyZoomFactor = (factor: number) => {
    const next = zoom * factor;
    if (next < MIN_ZOOM) flagLimit("min");
    else if (next > MAX_ZOOM) flagLimit("max");
    else flagLimit("");
    setZoom(Math.min(Math.max(next, MIN_ZOOM), MAX_ZOOM));
  };

  const panBy = (deltaX: number, deltaY: number) =>
    setPan((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));

  const zoomIn = () => setZoom((prev) => Math.min(prev * 1.2, MAX_ZOOM));
  const zoomOut = () => setZoom((prev) => Math.max(prev / 1.2, MIN_ZOOM));

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault(); // Always prevent page zoom
    e.stopPropagation(); // Prevent event bubbling
    applyZoomFactor(e.deltaY > 0 ? 0.9 : 1.1);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      // Left mouse button
      setDragLastPos({ x: e.clientX, y: e.clientY });
      setIsDragging(true);
    }
  };

  // Tracked on the document so a drag survives the pointer leaving the pane.
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      panBy(e.clientX - dragLastPos.x, e.clientY - dragLastPos.y);
      setDragLastPos({ x: e.clientX, y: e.clientY });
    };
    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragLastPos]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent page zoom/scroll
    e.stopPropagation();

    if (e.touches.length === 2) {
      setIsPinching(true);
      setLastPinchDistance(distanceBetweenTouches(e.touches));
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragLastPos({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent page zoom/scroll
    e.stopPropagation();

    if (e.touches.length === 2 && isPinching) {
      const distance = distanceBetweenTouches(e.touches);
      if (lastPinchDistance > 0) applyZoomFactor(distance / lastPinchDistance);
      setLastPinchDistance(distance);
    } else if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      panBy(touch.clientX - dragLastPos.x, touch.clientY - dragLastPos.y);
      setDragLastPos({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent page zoom/scroll
    e.stopPropagation();

    if (e.touches.length < 2) {
      setIsPinching(false);
      setLastPinchDistance(0);
    }
    if (e.touches.length === 0) setIsDragging(false);
  };

  return {
    zoom,
    pan,
    isDragging,
    zoomLimitReached,
    zoomIn,
    zoomOut,
    resetView,
    gestureHandlers: {
      onWheel: handleWheel,
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};
