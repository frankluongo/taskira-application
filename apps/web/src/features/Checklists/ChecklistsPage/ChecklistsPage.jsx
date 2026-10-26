import { useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "@/lib/store";
import { usePageHeader } from "@/features/Taskira";
import {
  Button,
  Float,
  IconPlus,
  IconTrash,
  List,
  Modal,
  Input,
  Form,
} from "@/base";
import css from "./ChecklistsPage.module.css";

export function ChecklistsPage() {
  const { checklists, checklist_items, addChecklist, deleteChecklist } =
    useStore();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");

  const sorted = [...checklists].sort((a, b) => a.sort_order - b.sort_order);

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
          const itemCount = checklist_items.filter(
            (i) => i.checklist_id === c.id,
          ).length;
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
