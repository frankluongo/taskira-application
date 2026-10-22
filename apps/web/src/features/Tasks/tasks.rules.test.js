import { describe, expect, it } from "vitest";
import { taskCompletionOutcome, taskReminder } from "./tasks.rules";

const now = new Date(2026, 9, 21, 9, 30);
const task = {
  id: "t1",
  name: "File taxes",
  due_date: "2026-10-22",
  alarm_time: "08:00",
};

describe("taskReminder", () => {
  it("builds a reminder at the due date and alarm time", () => {
    expect(taskReminder(task, now)).toEqual({
      id: "t1",
      title: "Task Reminder",
      body: "File taxes",
      at: new Date(2026, 9, 22, 8, 0),
    });
  });

  it("returns null for completed tasks", () => {
    expect(
      taskReminder({ ...task, completed_at: "2026-10-20T12:00:00Z" }, now),
    ).toBeNull();
  });

  it("returns null when the alarm already passed", () => {
    expect(taskReminder({ ...task, due_date: "2026-10-21" }, now)).toBeNull();
  });

  it("returns null without a due date or alarm time", () => {
    expect(taskReminder({ ...task, due_date: null }, now)).toBeNull();
    expect(taskReminder({ ...task, alarm_time: null }, now)).toBeNull();
  });
});

describe("taskCompletionOutcome", () => {
  const INBOX = "00000000-0000-0000-0000-000000000001";

  it("deletes inbox tasks, even recurring ones", () => {
    expect(
      taskCompletionOutcome({ project_id: INBOX, recurrence: "daily" }, now),
    ).toEqual({ type: "delete" });
  });

  it("reschedules daily project tasks to tomorrow", () => {
    expect(
      taskCompletionOutcome({ project_id: "p1", recurrence: "daily" }, now),
    ).toEqual({ type: "reschedule", due_date: "2026-10-22" });
  });

  it("reschedules recurring project tasks with a due date", () => {
    expect(
      taskCompletionOutcome(
        {
          project_id: "p1",
          recurrence: "monthly",
          repeat_from: "due_date",
          due_date: "2026-10-21",
        },
        now,
      ),
    ).toEqual({ type: "reschedule", due_date: "2026-11-21" });
  });

  it("completes recurring tasks without a due date", () => {
    expect(
      taskCompletionOutcome({ project_id: "p1", recurrence: "weekly" }, now),
    ).toEqual({ type: "complete", completed_at: now.toISOString() });
  });

  it("completes one-off project tasks", () => {
    expect(taskCompletionOutcome({ project_id: "p1" }, now)).toEqual({
      type: "complete",
      completed_at: now.toISOString(),
    });
  });
});
