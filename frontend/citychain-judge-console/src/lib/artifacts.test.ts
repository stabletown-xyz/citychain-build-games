import { describe, expect, it } from "vitest";
import { normalizeTxHash } from "./artifacts";

describe("normalizeTxHash", () => {
  it("adds 0x prefix for 64-char hex", () => {
    expect(normalizeTxHash("a".repeat(64))).toBe(`0x${"a".repeat(64)}`);
  });

  it("preserves non-hash values", () => {
    expect(normalizeTxHash("not-a-hash")).toBe("not-a-hash");
  });

  it("normalizes uppercase prefix", () => {
    expect(normalizeTxHash(`0X${"B".repeat(64)}`)).toBe(`0x${"b".repeat(64)}`);
  });
});
