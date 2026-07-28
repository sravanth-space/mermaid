import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePersistentState } from "./usePersistentState";

const KEY = "test:code";

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("usePersistentState", () => {
  it("passes null to the resolver when nothing is stored", () => {
    const resolve = vi.fn(() => "fallback");
    const { result } = renderHook(() => usePersistentState(KEY, resolve));

    expect(resolve).toHaveBeenCalledWith(null);
    expect(result.current[0]).toBe("fallback");
  });

  it("passes the stored value to the resolver", () => {
    window.localStorage.setItem(KEY, "stored code");
    const resolve = vi.fn((stored: string | null) => stored ?? "fallback");

    const { result } = renderHook(() => usePersistentState(KEY, resolve));

    expect(resolve).toHaveBeenCalledWith("stored code");
    expect(result.current[0]).toBe("stored code");
  });

  it("lets the resolver override what was stored", () => {
    // This is how a shared link takes precedence over saved work.
    window.localStorage.setItem(KEY, "stored code");

    const { result } = renderHook(() =>
      usePersistentState(KEY, () => "from shared link")
    );

    expect(result.current[0]).toBe("from shared link");
  });

  it("persists updates", () => {
    const { result } = renderHook(() => usePersistentState(KEY, () => "initial"));

    act(() => result.current[1]("edited"));

    expect(result.current[0]).toBe("edited");
    expect(window.localStorage.getItem(KEY)).toBe("edited");
  });

  it("restores the persisted value on remount", () => {
    const { result, unmount } = renderHook(() =>
      usePersistentState(KEY, (stored) => stored ?? "initial")
    );
    act(() => result.current[1]("survives reload"));
    unmount();

    const remounted = renderHook(() =>
      usePersistentState(KEY, (stored) => stored ?? "initial")
    );

    expect(remounted.result.current[0]).toBe("survives reload");
  });

  it("still works when reading storage throws", () => {
    // Private-mode Safari and blocked-storage origins throw on access.
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });

    const { result } = renderHook(() =>
      usePersistentState(KEY, (stored) => stored ?? "fallback")
    );

    expect(result.current[0]).toBe("fallback");
  });

  it("still updates in memory when writing storage throws", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    const { result } = renderHook(() => usePersistentState(KEY, () => "initial"));
    act(() => result.current[1]("edited"));

    expect(result.current[0]).toBe("edited");
  });
});
