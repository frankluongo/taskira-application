import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useStore } from "@/lib/store";
import { formatTime } from "@/lib/date";
import { ChoreForm } from "../ChoreForm/ChoreForm";
import {
  Button,
  IconBell,
  IconEdit,
  IconGrip,
  IconTrash,
  Modal,
  ToggleButton,
} from "@/base";
import css from "./ChoreItem.module.css";

const RECURRENCE_LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

function recurrenceLabel(value) {
  if (!value) return null;
  if (RECURRENCE_LABELS[value]) return RECURRENCE_LABELS[value];
  if (value.startsWith("custom:")) {
    const [, n, unit] = value.split(":");
    return `Every ${n} ${unit}`;
  }
  return null;
}

export function ChoreItem({ chore }) {
  const { completeChore, updateChore, deleteChore, chore_lists } = useStore();
  const [showEditModal, setShowEditModal] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chore.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const list = chore_lists.find((l) => l.id === chore.list_id);

  return (
    <div ref={setNodeRef} style={style}>
      <div className={css.row}>
        <button {...attributes} {...listeners} className={css.grip}>
          <IconGrip />
        </button>

        <ToggleButton
          variant="square"
          onClick={() => completeChore(chore.id)}
        />

        <div className={css.body}>
          <span className={css.name}>{chore.name}</span>
          <p className={css.meta}>
            {list && <span className={css.list}>{list.name}</span>}
            {chore.recurrence && (
              <span>{recurrenceLabel(chore.recurrence)}</span>
            )}
            {chore.alarm_time && (
              <span className={css.alarm}>
                <IconBell />
                {formatTime(chore.alarm_time)}
              </span>
            )}
          </p>
        </div>

        <div className={css.actions}>
          <Button
            onClick={() => setShowEditModal(true)}
            variant="icon secondary slim"
          >
            <IconEdit />
          </Button>
          <Button
            onClick={() => deleteChore(chore.id)}
            variant="icon secondary slim"
          >
            <IconTrash />
          </Button>
        </div>
      </div>

      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Chore"
      >
        <ChoreForm
          initialValues={chore}
          onSubmit={(patch) => {
            updateChore(chore.id, patch);
            setShowEditModal(false);
          }}
          submitLabel="Save Changes"
        />
      </Modal>
    </div>
  );
}
