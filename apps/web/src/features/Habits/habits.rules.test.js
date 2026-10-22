import { describe, expect, it } from "vitest";
import {
  habitReminder,
  isHabitScheduledOn,
  nextHabitOccurrence,
} from "./habits.rules";

// Wednesday, Oct 21, 2026, 9:30 AM local time
const now = new Date(2026, 9, 21, 9, 30);
const wednesday = new Date(2026, 9, 21);
const saturday = new Date(2026, 9, 24);

describe("isHabitScheduledOn", () => {
  it.each([
    ["daily", wednesday, true],
    ["daily", saturday, true],
    ["weekdays", wednesday, true],
    ["weekdays", saturday, false],
    ["weekends", wednesday, false],
    ["weekends", saturday, true],
  ])("%s on %s → %s", (recurrence, date, expected) => {
    expect(isHabitScheduledOn({ recurrence }, date)).toBe(expected);
  });

  it("matches specific days by day of week", () => {
    const habit = { recurrence: "specific_days", recurrence_days: [3, 5] };
    expect(isHabitScheduledOn(habit, wednesday)).toBe(true);
    expect(isHabitScheduledOn(habit, saturday)).toBe(false);
  });

  it("treats specific days with no days as never scheduled", () => {
    expect(isHabitScheduledOn({ recurrence: "specific_days" }, wednesday)).toBe(
      false,
    );
  });

  it("treats an unknown recurrence as scheduled", () => {
    expect(isHabitScheduledOn({ recurrence: "hourly" }, wednesday)).toBe(true);
  });

  it("is scheduled on its start date but not before", () => {
    const habit = { recurrence: "daily", start_date: "2026-10-21" };
    expect(isHabitScheduledOn(habit, wednesday)).toBe(true);
    expect(isHabitScheduledOn(habit, new Date(2026, 9, 20))).toBe(false);
  });

  it("is scheduled on its end date but not after", () => {
    const habit = { recurrence: "daily", end_date: "2026-10-21" };
    expect(isHabitScheduledOn(habit, wednesday)).toBe(true);
    expect(isHabitScheduledOn(habit, new Date(2026, 9, 22))).toBe(false);
  });
});

describe("nextHabitOccurrence", () => {
  it("returns later today when the alarm hasn't passed", () => {
    const habit = { recurrence: "daily", alarm_time: "18:00" };
    expect(nextHabitOccurrence(habit, now)).toEqual(
      new Date(2026, 9, 21, 18, 0),
    );
  });

  it("returns tomorrow when today's alarm has passed", () => {
    const habit = { recurrence: "daily", alarm_time: "07:00" };
    expect(nextHabitOccurrence(habit, now)).toEqual(
      new Date(2026, 9, 22, 7, 0),
    );
  });

  it("skips to the next matching day", () => {
    const habit = { recurrence: "weekends", alarm_time: "08:00" };
    expect(nextHabitOccurrence(habit, now)).toEqual(
      new Date(2026, 9, 24, 8, 0),
    );
  });

  it("finds the same weekday next week when today's alarm passed", () => {
    const habit = {
      recurrence: "specific_days",
      recurrence_days: [3],
      alarm_time: "07:00",
    };
    expect(nextHabitOccurrence(habit, now)).toEqual(
      new Date(2026, 9, 28, 7, 0),
    );
  });

  it("returns null when no day matches", () => {
    const habit = {
      recurrence: "specific_days",
      recurrence_days: [],
      alarm_time: "07:00",
    };
    expect(nextHabitOccurrence(habit, now)).toBeNull();
  });
});

describe("habitReminder", () => {
  it("builds a reminder at the next occurrence", () => {
    const habit = {
      id: "h1",
      name: "Stretch",
      recurrence: "daily",
      alarm_time: "18:00",
    };
    expect(habitReminder(habit, now)).toEqual({
      id: "h1",
      title: "Habit Reminder",
      body: "Stretch",
      at: new Date(2026, 9, 21, 18, 0),
    });
  });

  it("returns null without an alarm time", () => {
    expect(habitReminder({ id: "h1", recurrence: "daily" }, now)).toBeNull();
  });

  it("returns null when the habit never recurs", () => {
    const habit = {
      id: "h1",
      recurrence: "specific_days",
      recurrence_days: [],
      alarm_time: "18:00",
    };
    expect(habitReminder(habit, now)).toBeNull();
  });
});
