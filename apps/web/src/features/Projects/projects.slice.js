import { cancelReminder } from "@/services/notifications";
import { INBOX_PROJECT_ID } from "@/features/Tasks";
import * as api from "./projects.api";

export const createProjectsSlice = (set, get) => ({
  projects: [],

  addProject: async (name) => {
    const row = {
      id: crypto.randomUUID(),
      name,
      sort_order: get().projects.length,
    };
    set((s) => ({ projects: [...s.projects, row] }));
    await api.insertProject(row);
  },

  updateProject: async (id, patch) => {
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
    await api.updateProject(id, patch);
  },

  deleteProject: async (id) => {
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      tasks: s.tasks.map((t) =>
        t.project_id === id ? { ...t, project_id: INBOX_PROJECT_ID } : t,
      ),
    }));
    await api.deleteProject(id);
  },

  completeProject: async (id) => {
    const now = new Date().toISOString();
    const projectTasks = get().tasks.filter(
      (t) => t.project_id === id && !t.completed_at,
    );

    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, completed_at: now } : p,
      ),
      tasks: s.tasks.map((t) =>
        t.project_id === id && !t.completed_at
          ? { ...t, completed_at: now, recurrence: null }
          : t,
      ),
    }));

    await api.updateProject(id, { completed_at: now });
    await Promise.all(
      projectTasks.map((t) => {
        cancelReminder(t.id);
        return api.completeProjectTask(t.id, now);
      }),
    );
  },
});
