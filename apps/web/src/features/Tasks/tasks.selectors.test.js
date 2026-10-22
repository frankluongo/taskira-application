import { describe, expect, it } from "vitest";
import { INBOX_PROJECT_ID as INBOX } from "./tasks.constants";
import {
  getInboxTasks,
  getProjectTasks,
  getSubtasks,
  getTasksDueOn,
} from "./tasks.selectors";

const today = "2026-10-21";
const task = (id, fields) => ({
  id,
  project_id: INBOX,
  parent_task_id: null,
  priority: 3,
  sort_order: 0,
  ...fields,
});
const ids = (list) => list.map((t) => t.id);

const tasks = [
  task("i1", { priority: 3, sort_order: 2, due_date: today }),
  task("i2", { priority: 5, sort_order: 3 }),
  task("i3", { priority: 3, sort_order: 1 }),
  task("i1-sub", { parent_task_id: "i1", due_date: today }),
  task("p1", { project_id: "a", priority: 2, due_date: today }),
  task("p2", { project_id: "a", priority: 4, completed_at: "2026-10-01" }),
  task("p3", { project_id: "b", priority: 1, due_date: today }),
  task("p1-sub", { project_id: "a", parent_task_id: "p1" }),
];

describe("getInboxTasks", () => {
  it("returns top-level inbox tasks by priority, then sort order", () => {
    expect(ids(getInboxTasks(tasks, { todayOnly: false, today }))).toEqual([
      "i2",
      "i3",
      "i1",
    ]);
  });

  it("limits to tasks due today when asked", () => {
    expect(ids(getInboxTasks(tasks, { todayOnly: true, today }))).toEqual([
      "i1",
    ]);
  });
});

describe("getSubtasks", () => {
  it("returns a task's direct subtasks", () => {
    expect(ids(getSubtasks(tasks, "p1"))).toEqual(["p1-sub"]);
    expect(getSubtasks(tasks, "i2")).toEqual([]);
  });
});

describe("getTasksDueOn", () => {
  it("returns open top-level tasks due that day, highest priority first", () => {
    expect(ids(getTasksDueOn(tasks, today))).toEqual(["i1", "p1", "p3"]);
  });

  it("skips completed tasks", () => {
    const done = [task("x", { due_date: today, completed_at: "2026-10-21" })];
    expect(getTasksDueOn(done, today)).toEqual([]);
  });
});

describe("getProjectTasks", () => {
  it("returns open top-level tasks across projects, excluding the inbox", () => {
    expect(
      ids(
        getProjectTasks(tasks, { projectId: "all", includeCompleted: false }),
      ),
    ).toEqual(["p1", "p3"]);
  });

  it("filters to one project", () => {
    expect(
      ids(getProjectTasks(tasks, { projectId: "a", includeCompleted: false })),
    ).toEqual(["p1"]);
  });

  it("includes completed tasks when asked", () => {
    expect(
      ids(getProjectTasks(tasks, { projectId: "a", includeCompleted: true })),
    ).toEqual(["p2", "p1"]);
  });
});
