import { describe, expect, it } from "vitest";
import {
  containerKey,
  moveChecklistItem,
  sectionIdFromContainerKey,
} from "./checklists.rules";

describe("containerKey / sectionIdFromContainerKey", () => {
  it("round-trips a section id", () => {
    expect(containerKey("s1")).toBe("container:s1");
    expect(sectionIdFromContainerKey(containerKey("s1"))).toBe("s1");
  });

  it("maps null to the ungrouped container", () => {
    expect(containerKey(null)).toBe("container:ungrouped");
    expect(sectionIdFromContainerKey("container:ungrouped")).toBeNull();
  });
});

describe("moveChecklistItem", () => {
  const items = [
    { id: "u1", section_id: null, sort_order: 0 },
    { id: "u2", section_id: null, sort_order: 1 },
    { id: "a2", section_id: "A", sort_order: 1 },
    { id: "a1", section_id: "A", sort_order: 0 },
    { id: "a3", section_id: "A", sort_order: 2 },
    { id: "b1", section_id: "B", sort_order: 0 },
  ];

  it("reorders within a section, inserting before the hovered item", () => {
    expect(moveChecklistItem(items, "a1", "a3")).toEqual([
      { id: "a2", section_id: "A", sort_order: 0 },
      { id: "a1", section_id: "A", sort_order: 1 },
      { id: "a3", section_id: "A", sort_order: 2 },
    ]);
    expect(moveChecklistItem(items, "a3", "a1")).toEqual([
      { id: "a3", section_id: "A", sort_order: 0 },
      { id: "a1", section_id: "A", sort_order: 1 },
      { id: "a2", section_id: "A", sort_order: 2 },
    ]);
  });

  it("moves an item onto an item in another section", () => {
    expect(moveChecklistItem(items, "a2", "b1")).toEqual([
      { id: "a1", section_id: "A", sort_order: 0 },
      { id: "a3", section_id: "A", sort_order: 1 },
      { id: "a2", section_id: "B", sort_order: 0 },
      { id: "b1", section_id: "B", sort_order: 1 },
    ]);
  });

  it("appends when dropped on an empty section's container", () => {
    expect(moveChecklistItem(items, "b1", containerKey("C"))).toEqual([
      { id: "b1", section_id: "C", sort_order: 0 },
    ]);
  });

  it("appends when dropped on a non-empty container", () => {
    expect(moveChecklistItem(items, "u1", containerKey("B"))).toEqual([
      { id: "u2", section_id: null, sort_order: 0 },
      { id: "b1", section_id: "B", sort_order: 0 },
      { id: "u1", section_id: "B", sort_order: 1 },
    ]);
  });

  it("moves an item out of the ungrouped list into a section", () => {
    const patches = moveChecklistItem(items, "u2", "a1");
    expect(patches).toContainEqual({
      id: "u2",
      section_id: "A",
      sort_order: 0,
    });
    expect(patches).toContainEqual({
      id: "u1",
      section_id: null,
      sort_order: 0,
    });
  });

  it("moves an item into the ungrouped list", () => {
    expect(moveChecklistItem(items, "b1", containerKey(null))).toEqual([
      { id: "u1", section_id: null, sort_order: 0 },
      { id: "u2", section_id: null, sort_order: 1 },
      { id: "b1", section_id: null, sort_order: 2 },
    ]);
  });

  it("returns null without a drop target or a known item", () => {
    expect(moveChecklistItem(items, "a1", null)).toBeNull();
    expect(moveChecklistItem(items, "missing", "a1")).toBeNull();
  });
});
