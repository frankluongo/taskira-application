import { useState, useRef } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { DragContext } from "@/features/DragAndDrop/DragContext";
import { TaskItem } from "@/features/Tasks/TaskItem";
import { TaskForm } from "@/features/Tasks/TaskForm";
import { usePageHeader } from "@/features/Taskira/PageHeaderContext";
import { useStore, INBOX_PROJECT_ID } from "@/lib/store";
import {
  Button,
  Float,
  IconCheckmark,
  IconPlus,
  Input,
  List,
  Modal,
  Scroller,
} from "@/base";
import css from "./ProjectsPage.module.css";

export function ProjectsPage() {
  const {
    tasks,
    projects,
    addProject,
    updateProject,
    completeProject,
    addTask,
    reorderTasks,
  } = useStore();
  const [activeProject, setActiveProject] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [renamingProject, setRenamingProject] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [dragMode] = useState(false);

  const visibleProjects = projects
    .filter((p) => showArchived || !p.completed_at)
    .sort((a, b) => a.sort_order - b.sort_order);
  const selectedProject = projects.find((p) => p.id === activeProject);

  const projectTasks = tasks
    .filter((t) => t.project_id !== INBOX_PROJECT_ID && !t.parent_task_id)
    .filter((t) => activeProject === "all" || t.project_id === activeProject)
    .filter((t) => showArchived || !t.completed_at)
    .sort((a, b) => b.priority - a.priority || a.sort_order - b.sort_order);

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const oldIdx = projectTasks.findIndex((t) => t.id === active.id);
    const newIdx = projectTasks.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(projectTasks, oldIdx, newIdx).map((t, i) => ({
      ...t,
      sort_order: i,
    }));
    reorderTasks(tasks.map((t) => reordered.find((r) => r.id === t.id) || t));
  }

  function handleAddTask(task) {
    addTask(task);
    setShowAddModal(false);
  }

  function handleAddProject() {
    const name = prompt("Project name?");
    if (name?.trim()) addProject(name.trim());
  }

  function openRename(project) {
    setRenamingProject(project);
    setRenameValue(project.name);
  }

  function handleRenameSubmit(e) {
    e.preventDefault();
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== renamingProject.name) {
      updateProject(renamingProject.id, { name: trimmed });
    }
    setRenamingProject(null);
  }

  function handleCompleteProject() {
    if (!selectedProject) return;
    completeProject(selectedProject.id);
    setActiveProject("all");
  }

  usePageHeader({
    title: "Projects",
    action: (
      <Button
        aria-label="Toggle show archived"
        aria-pressed={showArchived}
        onClick={() => setShowArchived((x) => !x)}
        variant="icon slim secondary"
        title="Toggle show archived"
      >
        <IconCheckmark />
      </Button>
    ),
  });

  return (
    <>
      <Scroller style={{ flex: "0 0 auto" }}>
        <li>
          <ProjectTab
            label="All"
            active={activeProject === "all"}
            onClick={() => setActiveProject("all")}
          />
        </li>
        {visibleProjects.map((p) => (
          <li key={p.id}>
            <ProjectTab
              label={p.completed_at ? `${p.name} ✓` : p.name}
              active={activeProject === p.id}
              onClick={() => setActiveProject(p.id)}
              onLongPress={() => openRename(p)}
            />
          </li>
        ))}
        <li>
          <Button variant="pill" onClick={handleAddProject}>
            + Project
          </Button>
        </li>
      </Scroller>

      {selectedProject && (
        <div className={css.headerRow}>
          <span className={css.projectName}>{selectedProject.name}</span>
          {!selectedProject.completed_at && (
            <Button variant="secondary" onClick={handleCompleteProject}>
              Complete Project
            </Button>
          )}
        </div>
      )}

      <DragContext items={projectTasks} onDragEnd={handleDragEnd}>
        <List>
          {projectTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              subtasks={tasks.filter((t) => t.parent_task_id === task.id)}
              dragMode={dragMode}
            />
          ))}
        </List>
      </DragContext>

      {projectTasks.length === 0 && (
        <p className={css.empty}>No tasks here yet.</p>
      )}

      {/* Rename project modal */}
      <Modal
        open={!!renamingProject}
        onClose={() => setRenamingProject(null)}
        title="Rename Project"
      >
        <form onSubmit={handleRenameSubmit} className={css.renameForm}>
          <Input
            autoFocus
            id="project-rename"
            name="project-rename"
            label="Project name"
            showLabel={false}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Project name"
          />
          <Button type="submit" variant="primary">
            Save
          </Button>
        </form>
      </Modal>

      {/* Add task modal */}
      {selectedProject && !selectedProject.completed_at && (
        <>
          <Modal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Add Task"
          >
            <TaskForm
              initialValues={{ priority: 3, project_id: selectedProject.id }}
              allowRecurrence
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
      )}
    </>
  );
}

function ProjectTab({ label, active, onClick, onLongPress }) {
  const pressTimer = useRef(null);
  const longPressFired = useRef(false);

  function handlePointerDown() {
    if (!onLongPress) return;
    longPressFired.current = false;
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      onLongPress();
    }, 500);
  }

  function handlePointerUp() {
    clearTimeout(pressTimer.current);
    pressTimer.current = null;
  }

  function handleClick() {
    if (!longPressFired.current) onClick();
    longPressFired.current = false;
  }

  return (
    <Button
      variant="pill"
      aria-pressed={active}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
}
