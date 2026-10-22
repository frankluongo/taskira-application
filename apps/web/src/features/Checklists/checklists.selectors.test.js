import { describe, expect, it, vi } from "vitest";
import {
  countChecklistItems,
  getChecklistView,
  getSortedChecklists,
} from "./checklists.selectors";

vi.mock("@/store", () => ({ useStore: vi.fn() }));

const state = {
  checklists: [
    { id: "k2", sort_order: 1 },
    { id: "k1", sort_order: 0 },
  ],
  checklist_sections: [
    { id: "s2", checklist_id: "k1", sort_order: 1 },
    { id: "s1", checklist_id: "k1", sort_order: 0 },
    { id: "x", checklist_id: "k2", sort_order: 0 },
  ],
  checklist_items: [
    { id: "i2", checklist_id: "k1", section_id: null, sort_order: 1 },
    { id: "i1", checklist_id: "k1", section_id: null, sort_order: 0 },
    { id: "i3", checklist_id: "k1", section_id: "s1", sort_order: 0 },
    { id: "i4", checklist_id: "k2", section_id: "x", sort_order: 0 },
  ],
};
const ids = (list) => list.map((x) => x.id);

describe("getSortedChecklists", () => {
  it("sorts by sort_order without mutating", () => {
    expect(ids(getSortedChecklists(state.checklists))).toEqual(["k1", "k2"]);
    expect(ids(state.checklists)).toEqual(["k2", "k1"]);
  });
});

describe("countChecklistItems", () => {
  it("counts a checklist's items", () => {
    expect(countChecklistItems(state.checklist_items, "k1")).toBe(3);
    expect(countChecklistItems(state.checklist_items, "nope")).toBe(0);
  });
});

describe("getChecklistView", () => {
  it("collects one checklist's sorted sections and items", () => {
    const view = getChecklistView(state, "k1");
    expect(view.checklist.id).toBe("k1");
    expect(ids(view.sections)).toEqual(["s1", "s2"]);
    expect(ids(view.items)).toEqual(["i2", "i1", "i3"]);
    expect(ids(view.ungroupedItems)).toEqual(["i1", "i2"]);
    expect(ids(view.itemsBySection.s1)).toEqual(["i3"]);
    expect(view.itemsBySection.s2).toEqual([]);
  });

  it("returns an undefined checklist for an unknown id", () => {
    expect(getChecklistView(state, "nope").checklist).toBeUndefined();
  });
});
