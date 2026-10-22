import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";
import { Button, IconEdit, IconTrash } from "@taskira/ui";
import { containerKey } from "../../checklists.rules";
import { ItemContainer } from "../ItemContainer/ItemContainer";
import css from "./ChecklistSection.module.css";

export function ChecklistSection({ section, items, editing, onAddItem }) {
  const { renameSection, deleteSection } = useStore(
    useShallow((s) => ({
      renameSection: s.renameSection,
      deleteSection: s.deleteSection,
    })),
  );

  function handleRename() {
    const name = prompt("Section name?", section.name);
    if (name?.trim()) renameSection(section.id, name.trim());
  }

  function handleDelete() {
    if (confirm(`Delete "${section.name}"? Items will be ungrouped.`))
      deleteSection(section.id);
  }

  return (
    <div className={css.section}>
      <div className={css.sectionHeader}>
        <span className={css.sectionName}>{section.name}</span>
        {editing && (
          <div className={css.sectionActions}>
            <Button onClick={handleRename} variant="icon secondary slim">
              <IconEdit />
            </Button>
            <Button onClick={handleDelete} variant="icon secondary slim">
              <IconTrash />
            </Button>
          </div>
        )}
      </div>
      <ItemContainer
        containerId={containerKey(section.id)}
        items={items}
        editing={editing}
        onAdd={onAddItem}
      />
    </div>
  );
}
