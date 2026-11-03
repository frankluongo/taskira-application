import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { IconPlus } from "@/base";
import { ChecklistItemRow } from "./ChecklistItemRow";
import css from "./ItemContainer.module.css";

export function ItemContainer({
  containerId,
  items,
  editing,
  onToggle,
  onRename,
  onDelete,
  onAdd,
}) {
  const { setNodeRef } = useDroppable({ id: containerId });
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  function handleAdd(e) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewName("");
    setShowAdd(false);
  }

  return (
    <div ref={setNodeRef} className={css.itemContainer}>
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            editing={editing}
            onToggle={onToggle}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
      </SortableContext>
      {editing && !showAdd && (
        <button className={css.addItem} onClick={() => setShowAdd(true)}>
          <IconPlus /> Item
        </button>
      )}
      {editing && showAdd && (
        <form onSubmit={handleAdd} className={css.addItemForm}>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Item name…"
            className={css.addItemInput}
          />
          <button type="submit" className={css.addItemSubmit}>
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowAdd(false)}
            className={css.addItemCancel}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
