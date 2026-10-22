const CONTAINER_PREFIX = "container:";
const UNGROUPED = "ungrouped";

const bySortOrder = (a, b) => a.sort_order - b.sort_order;

// Droppable id for a section's item list (null = ungrouped items).
export function containerKey(sectionId) {
  return `${CONTAINER_PREFIX}${sectionId ?? UNGROUPED}`;
}

export function sectionIdFromContainerKey(key) {
  const raw = key.replace(CONTAINER_PREFIX, "");
  return raw === UNGROUPED ? null : raw;
}

function itemsInSection(items, sectionId) {
  return items
    .filter((i) => (sectionId ? i.section_id === sectionId : !i.section_id))
    .sort(bySortOrder);
}

// Moves an item within or between sections. overId is another item or a
// section container. Returns { id, section_id, sort_order } patches for every
// item in the touched lists, or null when nothing moves.
export function moveChecklistItem(items, activeId, overId) {
  if (overId == null) return null;

  const activeItem = items.find((i) => i.id === activeId);
  if (!activeItem) return null;

  const overIsContainer = String(overId).startsWith(CONTAINER_PREFIX);
  const targetSectionId = overIsContainer
    ? sectionIdFromContainerKey(overId)
    : (items.find((i) => i.id === overId)?.section_id ?? null);

  const sourceKey = containerKey(activeItem.section_id);
  const targetKey = containerKey(targetSectionId);

  const sourceList = itemsInSection(items, activeItem.section_id).filter(
    (i) => i.id !== activeId,
  );
  const targetList =
    sourceKey === targetKey
      ? sourceList
      : itemsInSection(items, targetSectionId).filter((i) => i.id !== activeId);

  let insertIdx = targetList.length;
  if (!overIsContainer) {
    insertIdx = targetList.findIndex((i) => i.id === overId);
    if (insertIdx === -1) insertIdx = targetList.length;
  }

  const newTargetList = [...targetList];
  newTargetList.splice(insertIdx, 0, {
    ...activeItem,
    section_id: targetSectionId,
  });

  const touched =
    sourceKey === targetKey ? [newTargetList] : [sourceList, newTargetList];
  return touched.flatMap((list) =>
    list.map((i, idx) => ({
      id: i.id,
      section_id: i.section_id ?? null,
      sort_order: idx,
    })),
  );
}
