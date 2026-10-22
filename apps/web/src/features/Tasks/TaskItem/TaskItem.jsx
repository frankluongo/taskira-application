import { useState } from "react";
import { useSortableItem } from "@/shared/dnd";
import { useStore, PRIORITY_LABELS, INBOX_PROJECT_ID } from "@/lib/store";
import { formatTime } from "@/shared/date";
import { recurrenceLabel } from "@/shared/recurrence";
import { TaskForm } from "../TaskForm/TaskForm";
import { PriorityBadge } from "../PriorityBadge/PriorityBadge";
import { Button, Modal, ToggleButton } from "@taskira/ui";
import { IconBell, IconEdit, IconGrip, IconTrash } from "@taskira/ui/icons";
import css from "./TaskItem.module.css";

export function TaskItem({ task, subtasks = [] }) {
  const { completeTask, updateTask, deleteTask, addTask } = useStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtaskName, setSubtaskName] = useState("");
  const [expanded, setExpanded] = useState(true);

  const { setNodeRef, style, handleProps } = useSortableItem(task.id);

  function addSubtask(e) {
    e.preventDefault();
    const trimmed = subtaskName.trim();
    if (!trimmed) return;
    addTask({
      name: trimmed,
      project_id: task.project_id,
      parent_task_id: task.id,
      priority: 1,
    });
    setSubtaskName("");
    setShowSubtaskForm(false);
  }

  return (
    <div ref={setNodeRef} style={style} className={css.item}>
      <div className={css.row}>
        <button {...handleProps} className={css.grip}>
          <IconGrip />
        </button>

        <ToggleButton
          variant="md"
          className={css.checkbox}
          onClick={() => completeTask(task.id)}
        />

        <div className={css.body}>
          <span className={css.name}>{task.name}</span>

          <div className={css.metaRow}>
            <PriorityBadge priority={task.priority} />
            {task.due_date && <span className={css.due}>{task.due_date}</span>}
            {task.recurrence && (
              <span className={css.due}>
                {recurrenceLabel(task.recurrence)}
              </span>
            )}
            {task.alarm_time && (
              <span className={css.alarm}>
                <IconBell />
                {formatTime(task.alarm_time)}
              </span>
            )}
            {subtasks.length > 0 && (
              <button
                onClick={() => setExpanded((x) => !x)}
                className={css.expandToggle}
              >
                {expanded ? "▾" : "▸"} {subtasks.length} subtask
                {subtasks.length !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>

        <div className={css.actions}>
          <PrioritySelect
            value={task.priority}
            onChange={(p) => updateTask(task.id, { priority: p })}
          />
          <button
            onClick={() => setShowSubtaskForm((x) => !x)}
            className={css.subButton}
          >
            +sub
          </button>
          <Button
            onClick={() => setShowEditModal(true)}
            variant="icon secondary slim"
          >
            <IconEdit />
          </Button>
          <Button
            onClick={() => deleteTask(task.id)}
            variant="icon secondary slim"
          >
            <IconTrash />
          </Button>
        </div>
      </div>

      {showSubtaskForm && (
        <form onSubmit={addSubtask} className={css.subtaskForm}>
          <input
            autoFocus
            value={subtaskName}
            onChange={(e) => setSubtaskName(e.target.value)}
            placeholder="Subtask name…"
            className={css.subtaskInput}
          />
          <button type="submit" className={css.subtaskAdd}>
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowSubtaskForm(false)}
            className={css.subtaskCancel}
          >
            Cancel
          </button>
        </form>
      )}

      {expanded &&
        subtasks.map((sub) => (
          <div key={sub.id} className={css.subtaskRow}>
            <ToggleButton variant="sm" onClick={() => completeTask(sub.id)} />
            <span className={css.subtaskName}>{sub.name}</span>
            <button
              onClick={() => deleteTask(sub.id)}
              className={css.subtaskDelete}
            >
              <IconTrash />
            </button>
          </div>
        ))}

      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Task"
      >
        <TaskForm
          initialValues={task}
          allowRecurrence={task.project_id !== INBOX_PROJECT_ID}
          onSubmit={(patch) => {
            updateTask(task.id, patch);
            setShowEditModal(false);
          }}
          submitLabel="Save Changes"
        />
      </Modal>
    </div>
  );
}

function PrioritySelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={css.prioritySelect}
    >
      {[5, 4, 3, 2, 1].map((p) => (
        <option key={p} value={p}>
          {PRIORITY_LABELS[p].label}
        </option>
      ))}
    </select>
  );
}
