import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";
import { usePageHeader } from "@/app/PageHeader";
import { todayISO } from "@/shared/date";
import { DragContext } from "@/shared/dnd";
import { reorderSubset } from "@/shared/reorder";
import {
  Button,
  Float,
  IconCalendar,
  IconDrag,
  IconPlus,
  List,
  Modal,
} from "@taskira/ui";
import { DEFAULT_PRIORITY, INBOX_PROJECT_ID } from "../tasks.constants";
import { getInboxTasks, getSubtasks } from "../tasks.selectors";
import { TaskForm } from "../components/TaskForm/TaskForm";
import { TaskItem } from "../components/TaskItem/TaskItem";
import css from "./TasksPage.module.css";

export function TasksPage() {
  const { tasks, addTask, reorderTasks } = useStore(
    useShallow((s) => ({
      tasks: s.tasks,
      addTask: s.addTask,
      reorderTasks: s.reorderTasks,
    })),
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterToday, setFilterToday] = useState(false);
  const [dragMode, setDragMode] = useState(false);

  const topLevelTasks = getInboxTasks(tasks, {
    todayOnly: filterToday,
    today: todayISO(),
  });

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
              subtasks={getSubtasks(tasks, task.id)}
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
          initialValues={{
            priority: DEFAULT_PRIORITY,
            project_id: INBOX_PROJECT_ID,
          }}
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
