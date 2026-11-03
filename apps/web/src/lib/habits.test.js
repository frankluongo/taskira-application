import { describe, expect, it } from "vitest";
import { occursOn } from "./habits";

const SUNDAY = 0;
const MONDAY = 1;
const FRIDAY = 5;
const SATURDAY = 6;

describe("occursOn", () => {
  it("runs daily habits every day", () => {
    for (let day = 0; day < 7; day++)
      expect(occursOn({ recurrence: "daily" }, day)).toBe(true);
  });

  it("treats a missing recurrence as daily", () => {
    expect(occursOn({ recurrence: null }, SUNDAY)).toBe(true);
  });

  it("runs weekday habits Monday through Friday only", () => {
    const habit = { recurrence: "weekdays" };
    expect(occursOn(habit, MONDAY)).toBe(true);
    expect(occursOn(habit, FRIDAY)).toBe(true);
    expect(occursOn(habit, SATURDAY)).toBe(false);
    expect(occursOn(habit, SUNDAY)).toBe(false);
  });

  it("runs weekend habits Saturday and Sunday only", () => {
    const habit = { recurrence: "weekends" };
    expect(occursOn(habit, SATURDAY)).toBe(true);
    expect(occursOn(habit, SUNDAY)).toBe(true);
    expect(occursOn(habit, MONDAY)).toBe(false);
  });

  it("runs specific-day habits only on the chosen days", () => {
    const habit = { recurrence: "specific_days", recurrence_days: [MONDAY] };
    expect(occursOn(habit, MONDAY)).toBe(true);
    expect(occursOn(habit, FRIDAY)).toBe(false);
  });

  it("never runs specific-day habits with no days chosen", () => {
    expect(occursOn({ recurrence: "specific_days" }, MONDAY)).toBe(false);
  });
});
