import { useState } from "react";
import { useSortableItem } from "@/shared/dnd";
import { useStore } from "@/lib/store";
import { formatTime } from "@/shared/date";
import { recurrenceLabel } from "@/shared/recurrence";
import { ChoreForm } from "../ChoreForm/ChoreForm";
import { Button, Modal, ToggleButton } from "@taskira/ui";
import { IconBell, IconEdit, IconGrip, IconTrash } from "@taskira/ui/icons";
import css from "./ChoreItem.module.css";

export function ChoreItem({ chore }) {
  const { completeChore, updateChore, deleteChore, chore_lists } = useStore();
  const [showEditModal, setShowEditModal] = useState(false);

  const { setNodeRef, style, handleProps } = useSortableItem(chore.id);

  const list = chore_lists.find((l) => l.id === chore.list_id);

  return (
    <div ref={setNodeRef} style={style}>
      <div className={css.row}>
        <button {...handleProps} className={css.grip}>
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
