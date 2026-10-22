import { describe, expect, it } from "vitest";
import {
  formatDisplayDate,
  formatTime,
  toISODate,
  todayISO,
  tomorrowISO,
} from "./date";

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

describe("toISODate", () => {
  // Tests run with TZ=America/New_York; DST began 2026-03-08 at 2 AM.
  it("formats local dates on either side of a DST change", () => {
    expect(toISODate(new Date(2026, 2, 7, 23, 30))).toBe("2026-03-07");
    expect(toISODate(new Date(2026, 2, 8, 0, 30))).toBe("2026-03-08");
    expect(toISODate(new Date(2026, 2, 8, 3, 30))).toBe("2026-03-08");
  });
});

describe("todayISO / tomorrowISO", () => {
  it("returns today's local date", () => {
    expect(todayISO(new Date(2026, 9, 21, 23, 59))).toBe("2026-10-21");
  });

  it("rolls tomorrow over the end of the year", () => {
    expect(tomorrowISO(new Date(2026, 11, 31, 12))).toBe("2027-01-01");
  });

  it("returns the next local day across a DST change", () => {
    expect(tomorrowISO(new Date(2026, 10, 1, 0, 30))).toBe("2026-11-02");
  });
});

describe("formatDisplayDate", () => {
  it("formats with a date-fns pattern", () => {
    expect(formatDisplayDate(new Date(2026, 9, 21), "EEEE, MMM d")).toBe(
      "Wednesday, Oct 21",
    );
  });
});
