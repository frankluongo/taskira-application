import { arrayMove } from "@dnd-kit/sortable";

// Moves activeId to overId's position and renumbers sort_order by index.
// Returns null when the drop is a no-op.
export function moveWithin(list, activeId, overId) {
  if (overId == null || activeId === overId) return null;
  const oldIdx = list.findIndex((item) => item.id === activeId);
  const newIdx = list.findIndex((item) => item.id === overId);
  return arrayMove(list, oldIdx, newIdx).map((item, i) => ({
    ...item,
    sort_order: i,
  }));
}

// moveWithin over a filtered subset, merged back into the full list by id.
export function reorderSubset(all, subset, activeId, overId) {
  const moved = moveWithin(subset, activeId, overId);
  if (!moved) return null;
  return all.map((item) => moved.find((m) => m.id === item.id) || item);
}
