import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./useDebouncedValue";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useDebouncedValue", () => {
  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("first", 300));
    expect(result.current).toBe("first");
  });

  it("withholds a new value until the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "first" } }
    );

    rerender({ value: "second" });
    expect(result.current).toBe("first");

    act(() => void vi.advanceTimersByTime(299));
    expect(result.current).toBe("first");

    act(() => void vi.advanceTimersByTime(1));
    expect(result.current).toBe("second");
  });

  it("only emits the last value when changes come faster than the delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "g" } }
    );

    for (const value of ["gr", "gra", "grap", "graph"]) {
      act(() => void vi.advanceTimersByTime(100));
      rerender({ value });
    }

    expect(result.current).toBe("g");

    act(() => void vi.advanceTimersByTime(300));
    expect(result.current).toBe("graph");
  });

  it("cancels its pending timer on unmount", () => {
    const { rerender, unmount } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "first" } }
    );

    rerender({ value: "second" });
    unmount();

    // A leaked timer would fire a setState on an unmounted hook.
    expect(() => act(() => void vi.runAllTimers())).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });
});
