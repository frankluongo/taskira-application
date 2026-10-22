import { describe, expect, it } from "vitest";
import { formatTime } from "./date";

describe("formatTime", () => {
  it("formats just after midnight as 12 AM", () => {
    expect(formatTime("00:05")).toBe("12:05 AM");
  });

  it("formats noon as 12 PM", () => {
    expect(formatTime("12:00")).toBe("12:00 PM");
  });

  it("formats the last minute of the day", () => {
    expect(formatTime("23:59")).toBe("11:59 PM");
  });
});
