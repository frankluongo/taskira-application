import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AddItemForm } from "../AddItemForm/AddItemForm";
import { ChecklistItemRow } from "../ChecklistItemRow/ChecklistItemRow";
import css from "./ItemContainer.module.css";

// A droppable, sortable list of items: one section, or the ungrouped items.
export function ItemContainer({ containerId, items, editing, onAdd }) {
  const { setNodeRef } = useDroppable({ id: containerId });

  return (
    <div ref={setNodeRef} className={css.itemContainer}>
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => (
          <ChecklistItemRow key={item.id} item={item} editing={editing} />
        ))}
      </SortableContext>
      <AddItemForm editing={editing} onAdd={onAdd} />
    </div>
  );
}
