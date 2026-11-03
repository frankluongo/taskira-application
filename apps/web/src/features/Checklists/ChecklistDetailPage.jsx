import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDragSensors } from "@/features/DragAndDrop/useDragSensors";
import { useStore } from "@/lib/store";
import { usePageHeader } from "@/features/Taskira/PageHeaderContext";
import { Button, IconCheckmark, IconEdit, IconPlus, IconTrash } from "@/base";
import { ItemContainer } from "./ItemContainer";
import { SectionChip } from "./SectionChip";
import css from "./ChecklistDetailPage.module.css";

function containerKey(sectionId) {
  return `container:${sectionId ?? "ungrouped"}`;
}

function sectionIdFromContainerKey(key) {
  const raw = key.replace("container:", "");
  return raw === "ungrouped" ? null : raw;
}

export function ChecklistDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    checklists,
    checklist_sections,
    checklist_items,
    addSection,
    renameSection,
    deleteSection,
    reorderSections,
    addItem,
    renameItem,
    toggleItem,
    deleteItem,
    reorderItems,
    resetChecklist,
  } = useStore();

  const [mode, setMode] = useState("check");
  const editing = mode === "edit";

  const checklist = checklists.find((c) => c.id === id);
  const sections = checklist_sections
    .filter((s) => s.checklist_id === id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const items = checklist_items.filter((i) => i.checklist_id === id);
  const ungroupedItems = items
    .filter((i) => !i.section_id)
    .sort((a, b) => a.sort_order - b.sort_order);

  const sensors = useDragSensors();

  usePageHeader(
    checklist
      ? {
          title: checklist.name,
          action: (
            <div className={css.actions}>
              <Button
                variant="secondary"
                onClick={() => navigate("/checklists")}
              >
                Back
              </Button>
              <Button
                aria-pressed={editing}
                onClick={() => setMode(editing ? "check" : "edit")}
                variant="icon slim secondary"
                title={
                  editing ? "Switch to check-off mode" : "Switch to edit mode"
                }
              >
                <IconEdit />
              </Button>
              <Button
                onClick={() => resetChecklist(id)}
                variant="icon slim secondary"
                title="Reset (uncheck all)"
              >
                <IconCheckmark />
              </Button>
            </div>
          ),
        }
      : { title: "Checklist" },
  );

  if (!checklist) {
    return <p className={css.empty}>Checklist not found.</p>;
  }

  function itemsForSection(sectionId) {
    return items
      .filter((i) => i.section_id === sectionId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function handleSectionDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex((s) => s.id === active.id);
    const newIdx = sections.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(sections, oldIdx, newIdx).map((s, i) => ({
      ...s,
      sort_order: i,
    }));
    reorderSections(reordered);
  }

  function handleItemDragEnd({ active, over }) {
    if (!over) return;

    const activeItem = items.find((i) => i.id === active.id);
    if (!activeItem) return;

    const overIsContainer = String(over.id).startsWith("container:");
    const targetSectionId = overIsContainer
      ? sectionIdFromContainerKey(over.id)
      : (items.find((i) => i.id === over.id)?.section_id ?? null);

    const sourceKey = containerKey(activeItem.section_id);
    const targetKey = containerKey(targetSectionId);

    const sourceList = (
      activeItem.section_id
        ? itemsForSection(activeItem.section_id)
        : ungroupedItems
    ).filter((i) => i.id !== active.id);

    const targetList =
      sourceKey === targetKey
        ? sourceList
        : (targetSectionId
            ? itemsForSection(targetSectionId)
            : ungroupedItems
          ).filter((i) => i.id !== active.id);

    let insertIdx = targetList.length;
    if (!overIsContainer) {
      insertIdx = targetList.findIndex((i) => i.id === over.id);
      if (insertIdx === -1) insertIdx = targetList.length;
    }

    const newTargetList = [...targetList];
    newTargetList.splice(insertIdx, 0, {
      ...activeItem,
      section_id: targetSectionId,
    });

    const touched =
      sourceKey === targetKey ? [newTargetList] : [sourceList, newTargetList];
    const orderedPatches = touched.flatMap((list) =>
      list.map((i, idx) => ({
        id: i.id,
        section_id: i.section_id ?? null,
        sort_order: idx,
      })),
    );

    reorderItems(orderedPatches);
  }

  function handleAddSection() {
    const name = prompt("Section name?");
    if (name?.trim()) addSection(id, name.trim());
  }

  return (
    <>
      {editing && sections.length > 1 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSectionDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className={css.sectionChips}>
              {sections.map((s) => (
                <SectionChip key={s.id} section={s} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleItemDragEnd}
      >
        <ItemContainer
          containerId={containerKey(null)}
          items={ungroupedItems}
          editing={editing}
          onToggle={toggleItem}
          onRename={renameItem}
          onDelete={deleteItem}
          onAdd={(name) => addItem(id, null, name)}
        />

        {sections.map((section) => (
          <div key={section.id} className={css.section}>
            <div className={css.sectionHeader}>
              <span className={css.sectionName}>{section.name}</span>
              {editing && (
                <div className={css.sectionActions}>
                  <Button
                    onClick={() => {
                      const name = prompt("Section name?", section.name);
                      if (name?.trim()) renameSection(section.id, name.trim());
                    }}
                    variant="icon secondary slim"
                  >
                    <IconEdit />
                  </Button>
                  <Button
                    onClick={() => {
                      if (
                        confirm(
                          `Delete "${section.name}"? Items will be ungrouped.`,
                        )
                      )
                        deleteSection(section.id);
                    }}
                    variant="icon secondary slim"
                  >
                    <IconTrash />
                  </Button>
                </div>
              )}
            </div>
            <ItemContainer
              containerId={containerKey(section.id)}
              items={itemsForSection(section.id)}
              editing={editing}
              onToggle={toggleItem}
              onRename={renameItem}
              onDelete={deleteItem}
              onAdd={(name) => addItem(id, section.id, name)}
            />
          </div>
        ))}
      </DndContext>

      {editing && (
        <Button
          variant="secondary"
          onClick={handleAddSection}
          className={css.addSection}
        >
          <IconPlus /> Section
        </Button>
      )}
    </>
  );
}
