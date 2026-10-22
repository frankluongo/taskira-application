import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";
import { useSortableItem } from "@/shared/dnd";
import { formatTime } from "@/shared/date";
import {
  Button,
  IconBell,
  IconEdit,
  IconGrip,
  IconTrash,
  Modal,
  ToggleButton,
} from "@taskira/ui";
import { HABIT_RECURRENCE_LABELS } from "../../habits.constants";
import { useIsHabitDone } from "../../habits.selectors";
import { HabitForm } from "../HabitForm/HabitForm";
import css from "./HabitItem.module.css";

export function HabitItem({ habit, dragMode = false }) {
  const { completeHabit, uncompleteHabit, updateHabit, deleteHabit } = useStore(
    useShallow((s) => ({
      completeHabit: s.completeHabit,
      uncompleteHabit: s.uncompleteHabit,
      updateHabit: s.updateHabit,
      deleteHabit: s.deleteHabit,
    })),
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const done = useIsHabitDone(habit.id);

  const { setNodeRef, style, handleProps } = useSortableItem(habit.id);

  function toggle() {
    if (done) uncompleteHabit(habit.id);
    else completeHabit(habit.id);
  }

  return (
    <div ref={setNodeRef} style={style} className={css.item}>
      <div className={css.row}>
        {dragMode && (
          <button {...handleProps} className={css.grip}>
            <IconGrip />
          </button>
        )}

        <ToggleButton active={done} onClick={toggle} />

        <div className={css.body}>
          <span className={`${css.name} ${done ? css.done : ""}`}>
            {habit.name}
          </span>
          <p className={css.meta}>
            {HABIT_RECURRENCE_LABELS[habit.recurrence]}
            {habit.alarm_time && (
              <span className={css.alarm}>
                <IconBell />
                {formatTime(habit.alarm_time)}
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
            onClick={() => deleteHabit(habit.id)}
            variant="icon secondary slim"
          >
            <IconTrash />
          </Button>
        </div>
      </div>

      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Habit"
      >
        <HabitForm
          initialValues={habit}
          onSubmit={(patch) => {
            updateHabit(habit.id, patch);
            setShowEditModal(false);
          }}
          submitLabel="Save Changes"
        />
      </Modal>
    </div>
  );
}
