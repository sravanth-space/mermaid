import { describe, expect, it } from "vitest";
import { parseErrorLine } from "./parseErrorLine";

describe("parseErrorLine", () => {
  it("extracts the line from a Mermaid parse error", () => {
    const message = [
      "Parse error on line 3:",
      "...raph TD  A[Broken --> ",
      "-----------------------^",
      "Expecting 'SQE', got 'EOF'",
    ].join("\n");

    expect(parseErrorLine(message)).toBe(3);
  });

  it("is case insensitive", () => {
    expect(parseErrorLine("Error on Line 12: something")).toBe(12);
  });

  it("returns null when the message carries no location", () => {
    expect(
      parseErrorLine("No diagram type detected matching given configuration")
    ).toBeNull();
  });

  it("returns null for an empty message", () => {
    expect(parseErrorLine("")).toBeNull();
  });

  it("rejects a zero line number rather than reporting line 0", () => {
    // Documents are 1-based; line 0 would throw in doc.line().
    expect(parseErrorLine("Parse error on line 0:")).toBeNull();
  });
});
