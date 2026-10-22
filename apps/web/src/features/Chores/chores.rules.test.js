import { describe, expect, it } from "vitest";
import { choreReminder } from "./chores.rules";

const now = new Date(2026, 9, 21, 9, 30);
const chore = {
  id: "c1",
  name: "Water plants",
  due_date: "2026-10-21",
  alarm_time: "18:00",
};

describe("choreReminder", () => {
  it("builds a reminder at the due date and alarm time", () => {
    expect(choreReminder(chore, now)).toEqual({
      id: "c1",
      title: "Chore Reminder",
      body: "Water plants",
      at: new Date(2026, 9, 21, 18, 0),
    });
  });

  it("returns null when the alarm already passed today", () => {
    expect(choreReminder({ ...chore, alarm_time: "08:00" }, now)).toBeNull();
  });

  it("returns null without a due date or alarm time", () => {
    expect(choreReminder({ ...chore, due_date: null }, now)).toBeNull();
    expect(choreReminder({ ...chore, alarm_time: null }, now)).toBeNull();
  });
});
