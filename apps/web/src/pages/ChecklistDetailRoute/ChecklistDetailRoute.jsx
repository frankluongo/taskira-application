import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useStore } from "@/lib/store";
import { usePageHeader } from "@/features";
import {
  Button,
  IconCheckmark,
  IconEdit,
  IconGrip,
  IconPlus,
  IconTrash,
} from "@/base";
import css from "./ChecklistDetailRoute.module.css";

function containerKey(sectionId) {
  return `container:${sectionId ?? "ungrouped"}`;
}

function sectionIdFromContainerKey(key) {
  const raw = key.replace("container:", "");
  return raw === "ungrouped" ? null : raw;
}

export function ChecklistDetailRoute() {
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

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

function SectionChip({ section }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={css.chip}
    >
      {section.name}
    </button>
  );
}

function ItemContainer({
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

function ChecklistItemRow({ item, editing, onToggle, onRename, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  if (editing) {
    return (
      <div ref={setNodeRef} style={style} className={css.itemRow}>
        <button {...attributes} {...listeners} className={css.grip}>
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
