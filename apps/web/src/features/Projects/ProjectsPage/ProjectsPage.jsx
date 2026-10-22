import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/store";
import { usePageHeader } from "@/app/PageHeader";
import { DragContext } from "@/shared/dnd";
import { reorderSubset } from "@/shared/reorder";
import {
  DEFAULT_PRIORITY,
  TaskForm,
  TaskItem,
  getProjectTasks,
  getSubtasks,
} from "@/features/Tasks";
import {
  Button,
  Float,
  IconCheckmark,
  IconPlus,
  List,
  Modal,
} from "@taskira/ui";
import { getVisibleProjects } from "../projects.selectors";
import { ProjectRenameForm } from "../components/ProjectRenameForm/ProjectRenameForm";
import { ProjectTabs } from "../components/ProjectTabs/ProjectTabs";
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
  } = useStore(
    useShallow((s) => ({
      tasks: s.tasks,
      projects: s.projects,
      addProject: s.addProject,
      updateProject: s.updateProject,
      completeProject: s.completeProject,
      addTask: s.addTask,
      reorderTasks: s.reorderTasks,
    })),
  );
  const [activeProject, setActiveProject] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [renamingProject, setRenamingProject] = useState(null);
  const [dragMode] = useState(false);

  const visibleProjects = getVisibleProjects(projects, { showArchived });
  const selectedProject = projects.find((p) => p.id === activeProject);
  const projectTasks = getProjectTasks(tasks, {
    projectId: activeProject,
    includeCompleted: showArchived,
  });

  function handleDragEnd({ active, over }) {
    const next = reorderSubset(tasks, projectTasks, active.id, over?.id);
    if (next) reorderTasks(next);
  }

  function handleAddTask(task) {
    addTask(task);
    setShowAddModal(false);
  }

  function handleAddProject() {
    const name = prompt("Project name?");
    if (name?.trim()) addProject(name.trim());
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
      <ProjectTabs
        projects={visibleProjects}
        activeProject={activeProject}
        onSelect={setActiveProject}
        onRename={setRenamingProject}
        onAdd={handleAddProject}
      />

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
              subtasks={getSubtasks(tasks, task.id)}
              dragMode={dragMode}
            />
          ))}
        </List>
      </DragContext>

      {projectTasks.length === 0 && (
        <p className={css.empty}>No tasks here yet.</p>
      )}

      <Modal
        open={!!renamingProject}
        onClose={() => setRenamingProject(null)}
        title="Rename Project"
      >
        {renamingProject && (
          <ProjectRenameForm
            key={renamingProject.id}
            project={renamingProject}
            onRename={(id, name) => updateProject(id, { name })}
            onDone={() => setRenamingProject(null)}
          />
        )}
      </Modal>

      {selectedProject && !selectedProject.completed_at && (
        <>
          <Modal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Add Task"
          >
            <TaskForm
              initialValues={{
                priority: DEFAULT_PRIORITY,
                project_id: selectedProject.id,
              }}
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
