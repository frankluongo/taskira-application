import { describe, expect, it } from "vitest";
import { getChoresDueOn } from "./chores.selectors";

describe("getChoresDueOn", () => {
  it("returns chores due on the date, in store order", () => {
    const chores = [
      { id: "b", due_date: "2026-10-21" },
      { id: "x", due_date: "2026-10-22" },
      { id: "a", due_date: "2026-10-21" },
      { id: "n", due_date: null },
    ];
    expect(getChoresDueOn(chores, "2026-10-21").map((c) => c.id)).toEqual([
      "b",
      "a",
    ]);
  });
});
