import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useStore } from "@/lib/store";
import { formatTime } from "@/lib/date";
import { HabitForm } from "./HabitForm";
import {
  Button,
  IconBell,
  IconEdit,
  IconGrip,
  IconTrash,
  Modal,
  ToggleButton,
} from "@/base";

import css from "./HabitItem.module.css";

const RECURRENCE_LABELS = {
  daily: "Daily",
  weekdays: "Weekdays",
  weekends: "Weekends",
  specific_days: "Specific days",
};

export function HabitItem({ habit, dragMode = false }) {
  const {
    completeHabit,
    uncompleteHabit,
    isHabitDoneToday,
    updateHabit,
    deleteHabit,
  } = useStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const done = isHabitDoneToday(habit.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  function toggle() {
    if (done) uncompleteHabit(habit.id);
    else completeHabit(habit.id);
  }

  return (
    <div ref={setNodeRef} style={style} className={css.item}>
      <div className={css.row}>
        {dragMode && (
          <button {...attributes} {...listeners} className={css.grip}>
            <IconGrip />
          </button>
        )}

        <ToggleButton active={done} onClick={toggle} />

        <div className={css.body}>
          <span className={`${css.name} ${done ? css.done : ""}`}>
            {habit.name}
          </span>
          <p className={css.meta}>
            {RECURRENCE_LABELS[habit.recurrence]}
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
