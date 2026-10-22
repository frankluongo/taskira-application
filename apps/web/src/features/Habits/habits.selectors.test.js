import { describe, expect, it, vi } from "vitest";
import { getGroupHabits, getHabitsDueToday } from "./habits.selectors";

vi.mock("@/store", () => ({ useStore: vi.fn() }));

// Wednesday, Oct 21, 2026
const now = new Date(2026, 9, 21, 9, 30);
const today = "2026-10-21";

const habits = [
  { id: "a", group_name: "AM", recurrence: "daily", sort_order: 2 },
  { id: "b", group_name: "AM", recurrence: "weekends", sort_order: 1 },
  { id: "c", group_name: "PM", recurrence: "daily", sort_order: 0 },
  { id: "d", group_name: "AM", recurrence: "daily", sort_order: 0 },
  {
    id: "e",
    group_name: "AM",
    recurrence: "daily",
    sort_order: 3,
    start_date: "2026-11-01",
  },
];
const completions = [{ habit_id: "d", completed_on: today }];

describe("getHabitsDueToday", () => {
  it("returns habits scheduled today that aren't done", () => {
    expect(
      getHabitsDueToday(habits, completions, now).map((h) => h.id),
    ).toEqual(["a", "c"]);
  });

  it("ignores completions from other days", () => {
    const old = [{ habit_id: "a", completed_on: "2026-10-20" }];
    expect(getHabitsDueToday(habits, old, now).map((h) => h.id)).toEqual([
      "a",
      "c",
      "d",
    ]);
  });
});

describe("getGroupHabits", () => {
  const base = { completions, today, showCompleted: false, dueTodayIds: null };

  it("filters to the group and sorts by sort_order", () => {
    const { all } = getGroupHabits(habits, { ...base, group: "AM" });
    expect(all.map((h) => h.id)).toEqual(["d", "b", "a", "e"]);
  });

  it("hides habits completed today unless showCompleted", () => {
    expect(
      getGroupHabits(habits, { ...base, group: "AM" }).visible.map((h) => h.id),
    ).toEqual(["b", "a", "e"]);
    expect(
      getGroupHabits(habits, {
        ...base,
        group: "AM",
        showCompleted: true,
      }).visible.map((h) => h.id),
    ).toEqual(["d", "b", "a", "e"]);
  });

  it("limits to due-today ids when given", () => {
    const { all } = getGroupHabits(habits, {
      ...base,
      group: "AM",
      dueTodayIds: new Set(["a"]),
    });
    expect(all.map((h) => h.id)).toEqual(["a"]);
  });
});
