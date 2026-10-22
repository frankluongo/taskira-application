import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";
import { usePageHeader } from "@/app/PageHeader";
import { DndProvider } from "@/shared/dnd";
import { moveWithin } from "@/shared/reorder";
import { Button, IconCheckmark, IconEdit, IconPlus } from "@taskira/ui";
import { containerKey, moveChecklistItem } from "../checklists.rules";
import { useChecklistView } from "../checklists.selectors";
import { ChecklistSection } from "../components/ChecklistSection/ChecklistSection";
import { ItemContainer } from "../components/ItemContainer/ItemContainer";
import { SectionChips } from "../components/SectionChips/SectionChips";
import css from "./ChecklistDetailPage.module.css";

export function ChecklistDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addSection, reorderSections, addItem, reorderItems, resetChecklist } =
    useStore(
      useShallow((s) => ({
        addSection: s.addSection,
        reorderSections: s.reorderSections,
        addItem: s.addItem,
        reorderItems: s.reorderItems,
        resetChecklist: s.resetChecklist,
      })),
    );
  const { checklist, sections, items, ungroupedItems, itemsBySection } =
    useChecklistView(id);

  const [mode, setMode] = useState("check");
  const editing = mode === "edit";

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

  function handleSectionDragEnd({ active, over }) {
    const next = moveWithin(sections, active.id, over?.id);
    if (next) reorderSections(next);
  }

  function handleItemDragEnd({ active, over }) {
    const patches = moveChecklistItem(items, active.id, over?.id);
    if (patches) reorderItems(patches);
  }

  function handleAddSection() {
    const name = prompt("Section name?");
    if (name?.trim()) addSection(id, name.trim());
  }

  return (
    <>
      {editing && sections.length > 1 && (
        <SectionChips sections={sections} onDragEnd={handleSectionDragEnd} />
      )}

      <DndProvider onDragEnd={handleItemDragEnd}>
        <ItemContainer
          containerId={containerKey(null)}
          items={ungroupedItems}
          editing={editing}
          onAdd={(name) => addItem(id, null, name)}
        />
        {sections.map((section) => (
          <ChecklistSection
            key={section.id}
            section={section}
            items={itemsBySection[section.id]}
            editing={editing}
            onAddItem={(name) => addItem(id, section.id, name)}
          />
        ))}
      </DndProvider>

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
