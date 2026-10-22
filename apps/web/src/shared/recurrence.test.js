import { describe, expect, it } from "vitest";
import {
  RECURRENCE_UNITS,
  nextRecurrenceDate,
  parseRecurrence,
  recurrenceLabel,
  rollDailyForward,
  serializeRecurrence,
  supportsRepeatFrom,
} from "./recurrence";

describe("parseRecurrence / serializeRecurrence", () => {
  const values = [
    null,
    "daily",
    "weekly",
    "monthly",
    "yearly",
    ...RECURRENCE_UNITS.map((unit) => `custom:3:${unit}`),
    "custom:12:weeks",
  ];

  it.each(values)("round-trips %s", (value) => {
    expect(serializeRecurrence(parseRecurrence(value))).toBe(value);
  });

  it("defaults the custom fields when the value isn't custom", () => {
    expect(parseRecurrence("weekly")).toEqual({
      recurrence: "weekly",
      customInterval: "3",
      customUnit: "months",
    });
    expect(parseRecurrence(null).recurrence).toBe("");
  });

  it("splits a custom value into its parts", () => {
    expect(parseRecurrence("custom:2:days")).toEqual({
      recurrence: "custom",
      customInterval: "2",
      customUnit: "days",
    });
  });

  it.each(["0", "", "-1", "abc"])(
    "serializes custom with interval %j as null",
    (customInterval) => {
      expect(
        serializeRecurrence({
          recurrence: "custom",
          customInterval,
          customUnit: "days",
        }),
      ).toBeNull();
    },
  );
});

describe("supportsRepeatFrom", () => {
  it.each([
    ["weekly", true],
    ["monthly", true],
    ["yearly", true],
    ["custom", true],
    ["daily", false],
    ["", false],
  ])("%s → %s", (value, expected) => {
    expect(supportsRepeatFrom(value)).toBe(expected);
  });
});

describe("recurrenceLabel", () => {
  it.each([
    ["daily", "Daily"],
    ["weekly", "Weekly"],
    ["monthly", "Monthly"],
    ["yearly", "Yearly"],
    ["custom:3:months", "Every 3 months"],
    ["custom:1:days", "Every 1 days"],
    [null, null],
    ["", null],
    ["fortnightly", null],
  ])("%s → %s", (value, expected) => {
    expect(recurrenceLabel(value)).toBe(expected);
  });
});

describe("nextRecurrenceDate", () => {
  const now = new Date(2026, 9, 21, 9, 30); // Oct 21, 2026, local time

  it("returns tomorrow for daily items", () => {
    expect(
      nextRecurrenceDate({ recurrence: "daily", due_date: "2026-01-01" }, now),
    ).toBe("2026-10-22");
  });

  describe("repeat from completion date", () => {
    it.each([
      ["weekly", "2026-10-28"],
      ["monthly", "2026-11-21"],
      ["yearly", "2027-10-21"],
      ["custom:3:days", "2026-10-24"],
      ["custom:2:weeks", "2026-11-04"],
      ["custom:3:months", "2027-01-21"],
      ["custom:2:years", "2028-10-21"],
    ])("%s → %s", (recurrence, expected) => {
      const item = {
        recurrence,
        repeat_from: "completion_date",
        due_date: "2026-01-01",
      };
      expect(nextRecurrenceDate(item, now)).toBe(expected);
    });
  });

  it("returns null for an unknown recurrence", () => {
    expect(
      nextRecurrenceDate({ recurrence: "custom:3:fortnights" }, now),
    ).toBeNull();
  });

  describe("repeat from due date", () => {
    // Regression tests for §8 #8: due dates are local calendar days.
    it.each([
      ["weekly", "2026-10-21", "2026-10-28"],
      ["monthly", "2026-10-21", "2026-11-21"],
      ["monthly", "2026-01-31", "2026-02-28"],
      ["yearly", "2026-10-21", "2027-10-21"],
      ["yearly", "2028-02-29", "2029-02-28"],
      ["custom:3:days", "2026-10-21", "2026-10-24"],
      ["custom:2:weeks", "2026-10-21", "2026-11-04"],
      ["custom:6:months", "2026-08-31", "2027-02-28"],
      ["custom:4:years", "2028-02-29", "2032-02-29"],
    ])("%s from %s → %s", (recurrence, due_date, expected) => {
      const item = { recurrence, repeat_from: "due_date", due_date };
      expect(nextRecurrenceDate(item, now)).toBe(expected);
    });

    it("crosses a DST change without losing a day", () => {
      const item = {
        recurrence: "weekly",
        repeat_from: "due_date",
        due_date: "2026-10-29",
      };
      expect(nextRecurrenceDate(item, now)).toBe("2026-11-05");
    });
  });
});

describe("rollDailyForward", () => {
  const today = "2026-10-21";

  it("moves stale daily items to today", () => {
    const items = [
      { id: "a", recurrence: "daily", due_date: "2026-10-19" },
      { id: "b", recurrence: "daily", due_date: today },
      { id: "c", recurrence: "weekly", due_date: "2026-10-01" },
      { id: "d", recurrence: "daily", due_date: null },
    ];
    const result = rollDailyForward(items, today);
    expect(result.items.map((i) => i.due_date)).toEqual([
      today,
      today,
      "2026-10-01",
      null,
    ]);
    expect(result.stale.map((i) => i.id)).toEqual(["a"]);
    expect(result.items[1]).toBe(items[1]);
  });

  it("returns no stale items when nothing is behind", () => {
    expect(rollDailyForward([], today)).toEqual({ items: [], stale: [] });
  });
});
