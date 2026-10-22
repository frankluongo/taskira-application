import { useState } from "react";
import { todayISO } from "@/shared/date";
import { TaskItem, TaskForm, usePageHeader } from "@/features";
import { DragContext } from "@/shared/dnd";
import { reorderSubset } from "@/shared/reorder";
import { useStore, INBOX_PROJECT_ID } from "@/lib/store";
import {
  Button,
  Float,
  IconCalendar,
  IconDrag,
  IconPlus,
  List,
  Modal,
} from "@taskira/ui";
import css from "./Tasks.module.css";

export default function Tasks() {
  const { tasks, addTask, reorderTasks } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterToday, setFilterToday] = useState(false);
  const [dragMode, setDragMode] = useState(false);

  const topLevelTasks = tasks
    .filter((t) => !t.parent_task_id && t.project_id === INBOX_PROJECT_ID)
    .filter((t) => !filterToday || t.due_date === todayISO())
    .sort((a, b) => b.priority - a.priority || a.sort_order - b.sort_order);

  function handleDragEnd({ active, over }) {
    const next = reorderSubset(tasks, topLevelTasks, active.id, over?.id);
    if (next) reorderTasks(next);
  }

  function handleAddTask(task) {
    addTask(task);
    setShowAddModal(false);
  }

  usePageHeader({
    title: "Tasks",
    action: (
      <div className={css.actions}>
        <Button
          aria-label="Toggle filter today"
          aria-pressed={filterToday}
          onClick={() => setFilterToday((x) => !x)}
          variant="icon slim secondary"
          title="Toggle today filter"
        >
          <IconCalendar />
        </Button>
        <Button
          aria-label="Toggle drag mode"
          aria-pressed={dragMode}
          onClick={() => setDragMode((x) => !x)}
          variant="icon slim secondary"
          title="Toggle drag mode"
        >
          <IconDrag />
        </Button>
      </div>
    ),
  });

  return (
    <>
      <DragContext items={topLevelTasks} onDragEnd={handleDragEnd}>
        <List>
          {topLevelTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              subtasks={tasks.filter((t) => t.parent_task_id === task.id)}
              dragMode={dragMode}
            />
          ))}
        </List>
      </DragContext>

      {topLevelTasks.length === 0 && <p className={css.empty}>No tasks yet.</p>}

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Task"
      >
        <TaskForm
          initialValues={{ priority: 3, project_id: INBOX_PROJECT_ID }}
          onSubmit={handleAddTask}
          submitLabel="Add Task"
        />
      </Modal>
      <Float>
        <Button
          variant="icon"
          aria-expanded={showAddModal}
          aria-label="Add Task"
          onClick={() => setShowAddModal((x) => !x)}
        >
          <IconPlus />
        </Button>
      </Float>
    </>
  );
}
