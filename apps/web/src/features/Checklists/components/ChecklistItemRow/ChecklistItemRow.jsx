import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";
import { useSortableItem } from "@/shared/dnd";
import { Button, IconGrip, IconTrash } from "@taskira/ui";
import css from "./ChecklistItemRow.module.css";

export function ChecklistItemRow({ item, editing }) {
  const { toggleItem, renameItem, deleteItem } = useStore(
    useShallow((s) => ({
      toggleItem: s.toggleItem,
      renameItem: s.renameItem,
      deleteItem: s.deleteItem,
    })),
  );
  const { setNodeRef, style, handleProps } = useSortableItem(item.id);

  if (editing) {
    return (
      <div ref={setNodeRef} style={style} className={css.itemRow}>
        <button {...handleProps} className={css.grip}>
          <IconGrip />
        </button>
        <span
          className={css.itemName}
          onClick={() => {
            const name = prompt("Item name?", item.name);
            if (name?.trim()) renameItem(item.id, name.trim());
          }}
        >
          {item.name}
        </span>
        <Button
          onClick={() => deleteItem(item.id)}
          variant="icon secondary slim"
        >
          <IconTrash />
        </Button>
      </div>
    );
  }

  return (
    <label ref={setNodeRef} style={style} className={css.itemRow}>
      <input
        type="checkbox"
        checked={item.checked}
        onChange={() => toggleItem(item.id)}
        className={css.checkbox}
      />
      <span className={`${css.itemName} ${item.checked ? css.checked : ""}`}>
        {item.name}
      </span>
    </label>
  );
}
