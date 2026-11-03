import { useSortableItem } from "@/features/DragAndDrop/useSortableItem";
import { Button, IconGrip, IconTrash } from "@/base";
import css from "./ChecklistItemRow.module.css";

export function ChecklistItemRow({
  item,
  editing,
  onToggle,
  onRename,
  onDelete,
}) {
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
            if (name?.trim()) onRename(item.id, name.trim());
          }}
        >
          {item.name}
        </span>
        <Button onClick={() => onDelete(item.id)} variant="icon secondary slim">
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
        onChange={() => onToggle(item.id)}
        className={css.checkbox}
      />
      <span className={`${css.itemName} ${item.checked ? css.checked : ""}`}>
        {item.name}
      </span>
    </label>
  );
}
