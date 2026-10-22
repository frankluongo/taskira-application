import { describe, expect, it } from "vitest";
import { getVisibleProjects } from "./projects.selectors";

const projects = [
  { id: "b", sort_order: 2 },
  { id: "a", sort_order: 1, completed_at: "2026-10-01T00:00:00Z" },
  { id: "c", sort_order: 0 },
];
const ids = (list) => list.map((p) => p.id);

describe("getVisibleProjects", () => {
  it("hides completed projects and sorts by sort_order", () => {
    expect(ids(getVisibleProjects(projects, { showArchived: false }))).toEqual([
      "c",
      "b",
    ]);
  });

  it("includes completed projects when showing archived", () => {
    expect(ids(getVisibleProjects(projects, { showArchived: true }))).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("doesn't reorder the input", () => {
    const input = [...projects];
    getVisibleProjects(input, { showArchived: true });
    expect(ids(input)).toEqual(["b", "a", "c"]);
  });
});
