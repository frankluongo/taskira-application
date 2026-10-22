import { describe, expect, it } from "vitest";
import { moveWithin, reorderSubset } from "./reorder";

const list = [
  { id: "a", sort_order: 0 },
  { id: "b", sort_order: 1 },
  { id: "c", sort_order: 2 },
];

const ids = (items) => items.map((item) => item.id);

describe("moveWithin", () => {
  it("moves an item down and renumbers sort_order", () => {
    expect(moveWithin(list, "a", "c")).toEqual([
      { id: "b", sort_order: 0 },
      { id: "c", sort_order: 1 },
      { id: "a", sort_order: 2 },
    ]);
  });

  it("moves an item up", () => {
    expect(ids(moveWithin(list, "c", "a"))).toEqual(["c", "a", "b"]);
  });

  it("returns null when there is no drop target", () => {
    expect(moveWithin(list, "a", null)).toBeNull();
    expect(moveWithin(list, "a", undefined)).toBeNull();
  });

  it("returns null when dropped on itself", () => {
    expect(moveWithin(list, "b", "b")).toBeNull();
  });

  it("doesn't mutate the input", () => {
    moveWithin(list, "a", "c");
    expect(list).toEqual([
      { id: "a", sort_order: 0 },
      { id: "b", sort_order: 1 },
      { id: "c", sort_order: 2 },
    ]);
  });
});

describe("reorderSubset", () => {
  const all = [
    { id: "x", sort_order: 7 },
    { id: "b", sort_order: 1 },
    { id: "a", sort_order: 0 },
    { id: "y", sort_order: 9 },
    { id: "c", sort_order: 2 },
  ];
  const subset = [all[2], all[1], all[4]]; // a, b, c — sorted differently from all

  it("renumbers the subset and keeps the full list's order", () => {
    const next = reorderSubset(all, subset, "a", "c");
    expect(ids(next)).toEqual(ids(all));
    expect(next.find((i) => i.id === "b").sort_order).toBe(0);
    expect(next.find((i) => i.id === "c").sort_order).toBe(1);
    expect(next.find((i) => i.id === "a").sort_order).toBe(2);
  });

  it("leaves items outside the subset untouched", () => {
    const next = reorderSubset(all, subset, "c", "a");
    expect(next.find((i) => i.id === "x")).toBe(all[0]);
    expect(next.find((i) => i.id === "y")).toBe(all[3]);
  });

  it("returns null on a no-op", () => {
    expect(reorderSubset(all, subset, "a", null)).toBeNull();
    expect(reorderSubset(all, subset, "a", "a")).toBeNull();
  });
});
