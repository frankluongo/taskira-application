import { useState } from "react";
import { useNavigate } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";
import { usePageHeader } from "@/app/PageHeader";
import {
  Button,
  Float,
  IconPlus,
  IconTrash,
  List,
  Modal,
  Input,
  Form,
} from "@taskira/ui";
import {
  countChecklistItems,
  getSortedChecklists,
} from "../checklists.selectors";
import css from "./ChecklistsPage.module.css";

export function ChecklistsPage() {
  const { checklists, checklist_items, addChecklist, deleteChecklist } =
    useStore(
      useShallow((s) => ({
        checklists: s.checklists,
        checklist_items: s.checklist_items,
        addChecklist: s.addChecklist,
        deleteChecklist: s.deleteChecklist,
      })),
    );
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");

  const sorted = getSortedChecklists(checklists);

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const row = await addChecklist(trimmed);
    setName("");
    setShowAddModal(false);
    navigate(`/checklists/${row.id}`);
  }

  function handleDelete(e, id) {
    e.stopPropagation();
    if (confirm("Delete this checklist?")) deleteChecklist(id);
  }

  usePageHeader({ title: "Checklists" });

  return (
    <>
      <List>
        {sorted.map((c) => {
          const itemCount = countChecklistItems(checklist_items, c.id);
          return (
            <div
              key={c.id}
              className={css.row}
              onClick={() => navigate(`/checklists/${c.id}`)}
            >
              <div className={css.body}>
                <span className={css.name}>{c.name}</span>
                <p className={css.meta}>
                  {itemCount} item{itemCount !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                onClick={(e) => handleDelete(e, c.id)}
                variant="icon secondary slim"
              >
                <IconTrash />
              </Button>
            </div>
          );
        })}
      </List>

      {sorted.length === 0 && <p className={css.empty}>No checklists yet.</p>}

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Checklist"
      >
        <Form onSubmit={handleAdd}>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Checklist name…"
            id="checklist-name"
            name="checklist-name"
            label="Checklist name"
            showLabel={false}
          />
          <Button type="submit" variant="primary">
            Add Checklist
          </Button>
        </Form>
      </Modal>
      <Float>
        <Button
          variant="icon"
          aria-expanded={showAddModal}
          aria-label="Add Checklist"
          onClick={() => setShowAddModal((x) => !x)}
        >
          <IconPlus />
        </Button>
      </Float>
    </>
  );
}
