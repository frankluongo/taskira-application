import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";

const bySortOrder = (a, b) => a.sort_order - b.sort_order;

export function getSortedChecklists(checklists) {
  return [...checklists].sort(bySortOrder);
}

export function countChecklistItems(items, checklistId) {
  return items.filter((i) => i.checklist_id === checklistId).length;
}

// Everything the detail page shows for one checklist.
export function getChecklistView(state, id) {
  const checklist = state.checklists.find((c) => c.id === id);
  const sections = state.checklist_sections
    .filter((s) => s.checklist_id === id)
    .sort(bySortOrder);
  const items = state.checklist_items.filter((i) => i.checklist_id === id);
  const ungroupedItems = items.filter((i) => !i.section_id).sort(bySortOrder);
  const itemsBySection = Object.fromEntries(
    sections.map((s) => [
      s.id,
      items.filter((i) => i.section_id === s.id).sort(bySortOrder),
    ]),
  );
  return { checklist, sections, items, ungroupedItems, itemsBySection };
}

export function useChecklistView(id) {
  const state = useStore(
    useShallow((s) => ({
      checklists: s.checklists,
      checklist_sections: s.checklist_sections,
      checklist_items: s.checklist_items,
    })),
  );
  return useMemo(() => getChecklistView(state, id), [state, id]);
}
