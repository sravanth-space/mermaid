import { afterEach, describe, expect, it } from "vitest";
import { buildShareUrl, clearSharedCode, readSharedCode } from "./shareLink";

const setHash = (hash: string) => {
  window.location.hash = hash;
};

/** Round-trips a definition the way sharing a link then opening it would. */
const roundTrip = (code: string) => {
  setHash(new URL(buildShareUrl(code)).hash);
  return readSharedCode();
};

afterEach(() => {
  setHash("");
});

describe("shareLink", () => {
  it("round-trips a definition", () => {
    const code = "graph TD\n  A[Start] --> B[End]";
    expect(roundTrip(code)).toBe(code);
  });

  it("round-trips non-ASCII text", () => {
    // btoa() is latin1-only, so multi-byte characters are the interesting case.
    const code = 'graph TD\n  A["café ☕ 日本語"] --> B["émoji 🎉"]';
    expect(roundTrip(code)).toBe(code);
  });

  it("round-trips characters that plain base64 would mangle in a URL", () => {
    const code = "graph TD\n  A-->B?x=1&y=2/z+w";
    // Only the payload matters here; the URL itself legitimately contains "/".
    const payload = new URL(buildShareUrl(code)).hash.replace("#code=", "");

    expect(payload).not.toMatch(/[+/=]/);
    expect(roundTrip(code)).toBe(code);
  });

  it("returns null when the URL has no shared definition", () => {
    setHash("");
    expect(readSharedCode()).toBeNull();
  });

  it("ignores an unrelated hash", () => {
    setHash("#some-anchor");
    expect(readSharedCode()).toBeNull();
  });

  it("returns null for a corrupt payload instead of throwing", () => {
    setHash("#code=%%%not-base64%%%");
    expect(readSharedCode()).toBeNull();
  });

  it("returns null when the payload decodes to nothing", () => {
    setHash("#code=");
    expect(readSharedCode()).toBeNull();
  });

  it("builds an absolute URL on the current page", () => {
    const url = new URL(buildShareUrl("graph TD"));

    expect(url.origin).toBe(window.location.origin);
    expect(url.pathname).toBe(window.location.pathname);
    expect(url.hash.startsWith("#code=")).toBe(true);
  });

  it("removes the shared definition from the address bar", () => {
    setHash("#code=Z3JhcGggVEQ");
    clearSharedCode();

    expect(window.location.hash).toBe("");
    expect(readSharedCode()).toBeNull();
  });
});
