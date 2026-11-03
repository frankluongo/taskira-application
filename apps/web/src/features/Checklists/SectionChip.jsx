import { useSortableItem } from "@/features/DragAndDrop/useSortableItem";

export function SectionChip({ section }) {
  const { setNodeRef, style, handleProps } = useSortableItem(section.id);
  return (
    <button ref={setNodeRef} style={style} {...handleProps}>
      {section.name}
    </button>
  );
}
