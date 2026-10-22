import { DragContext, useSortableItem } from "@/shared/dnd";
import css from "./SectionChips.module.css";

export function SectionChips({ sections, onDragEnd }) {
  return (
    <DragContext items={sections} onDragEnd={onDragEnd} strategy="horizontal">
      <div className={css.sectionChips}>
        {sections.map((s) => (
          <SectionChip key={s.id} section={s} />
        ))}
      </div>
    </DragContext>
  );
}

function SectionChip({ section }) {
  const { setNodeRef, style, handleProps } = useSortableItem(section.id);
  return (
    <button
      ref={setNodeRef}
      style={style}
      {...handleProps}
      className={css.chip}
    >
      {section.name}
    </button>
  );
}
