import { describe, expect, it } from "vitest";
import {
  choreCompletionOutcome,
  choreReminder,
  groupChoresByDue,
} from "./chores.rules";

const now = new Date(2026, 9, 21, 9, 30);

describe("choreReminder", () => {
  const chore = {
    id: "c1",
    name: "Water plants",
    due_date: "2026-10-21",
    alarm_time: "18:00",
  };

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

describe("choreCompletionOutcome", () => {
  it("reschedules daily chores to tomorrow, even without a due date", () => {
    expect(choreCompletionOutcome({ recurrence: "daily" }, now)).toEqual({
      type: "reschedule",
      due_date: "2026-10-22",
    });
  });

  it("reschedules recurring chores with a due date", () => {
    expect(
      choreCompletionOutcome(
        {
          recurrence: "weekly",
          repeat_from: "due_date",
          due_date: "2026-10-21",
        },
        now,
      ),
    ).toEqual({ type: "reschedule", due_date: "2026-10-28" });
  });

  it("deletes recurring chores without a due date", () => {
    expect(choreCompletionOutcome({ recurrence: "weekly" }, now)).toEqual({
      type: "delete",
    });
  });

  it("deletes one-off chores", () => {
    expect(
      choreCompletionOutcome({ recurrence: null, due_date: "2026-10-21" }, now),
    ).toEqual({ type: "delete" });
  });
});

describe("groupChoresByDue", () => {
  const today = "2026-10-21";
  const tomorrow = "2026-10-22";
  const opts = { listId: "all", today, tomorrow };
  const chore = (id, fields) => ({
    id,
    sort_order: 0,
    list_id: null,
    ...fields,
  });
  const ids = (list) => list.map((c) => c.id);

  it("puts each chore in its bucket", () => {
    const chores = [
      chore("over", { due_date: "2026-10-01" }),
      chore("today", { due_date: today }),
      chore("tmrw", { due_date: tomorrow }),
      chore("later", { due_date: "2026-11-01" }),
      chore("someday", { due_date: null }),
    ];
    const groups = groupChoresByDue(chores, opts);
    expect(ids(groups.overdue)).toEqual(["over"]);
    expect(ids(groups.today)).toEqual(["today"]);
    expect(ids(groups.tomorrow)).toEqual(["tmrw"]);
    expect(ids(groups.later)).toEqual(["later"]);
    expect(ids(groups.someday)).toEqual(["someday"]);
  });

  it("leaves daily chores out of overdue", () => {
    const chores = [
      chore("daily", { due_date: "2026-10-20", recurrence: "daily" }),
      chore("weekly", { due_date: "2026-10-20", recurrence: "weekly" }),
    ];
    expect(ids(groupChoresByDue(chores, opts).overdue)).toEqual(["weekly"]);
  });

  it("filters by list unless the list is 'all'", () => {
    const chores = [
      chore("a", { due_date: today, list_id: "l1" }),
      chore("b", { due_date: today, list_id: "l2" }),
      chore("c", { due_date: today }),
    ];
    expect(ids(groupChoresByDue(chores, opts).today)).toEqual(["a", "b", "c"]);
    expect(
      ids(groupChoresByDue(chores, { ...opts, listId: "l1" }).today),
    ).toEqual(["a"]);
  });

  it("sorts each bucket", () => {
    const chores = [
      chore("o2", { due_date: "2026-10-10" }),
      chore("o1", { due_date: "2026-10-01" }),
      chore("t2", { due_date: today, sort_order: 2 }),
      chore("t1", { due_date: today, sort_order: 1 }),
      chore("m2", { due_date: tomorrow, sort_order: 2 }),
      chore("m1", { due_date: tomorrow, sort_order: 1 }),
      chore("l2", { due_date: "2026-12-01" }),
      chore("l1", { due_date: "2026-11-01" }),
      chore("s2", { due_date: null, created_at: "2026-02-01" }),
      chore("s1", { due_date: null, created_at: "2026-01-01" }),
    ];
    const groups = groupChoresByDue(chores, opts);
    expect(ids(groups.overdue)).toEqual(["o1", "o2"]);
    expect(ids(groups.today)).toEqual(["t1", "t2"]);
    expect(ids(groups.tomorrow)).toEqual(["m1", "m2"]);
    expect(ids(groups.later)).toEqual(["l1", "l2"]);
    expect(ids(groups.someday)).toEqual(["s1", "s2"]);
  });

  it("caps later at the five soonest", () => {
    const chores = Array.from({ length: 7 }, (_, i) =>
      chore(`l${i}`, { due_date: `2026-11-0${7 - i}` }),
    );
    expect(ids(groupChoresByDue(chores, opts).later)).toEqual([
      "l6",
      "l5",
      "l4",
      "l3",
      "l2",
    ]);
  });
});
