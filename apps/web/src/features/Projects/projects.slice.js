import { supabase } from "@/services/supabase";
import { cancelReminder } from "@/services/notifications";
import { INBOX_PROJECT_ID } from "@/features/Tasks/tasks.constants";

export const createProjectsSlice = (set, get) => ({
  projects: [],

  addProject: async (name) => {
    const row = {
      id: crypto.randomUUID(),
      name,
      sort_order: get().projects.length,
    };
    set((s) => ({ projects: [...s.projects, row] }));
    await supabase.from("projects").insert(row);
  },

  updateProject: async (id, patch) => {
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
    await supabase.from("projects").update(patch).eq("id", id);
  },

  deleteProject: async (id) => {
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      tasks: s.tasks.map((t) =>
        t.project_id === id ? { ...t, project_id: INBOX_PROJECT_ID } : t,
      ),
    }));
    await supabase.from("projects").delete().eq("id", id);
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

    await supabase.from("projects").update({ completed_at: now }).eq("id", id);
    await Promise.all(
      projectTasks.map((t) => {
        cancelReminder(t.id);
        return supabase
          .from("tasks")
          .update({ completed_at: now, recurrence: null })
          .eq("id", t.id);
      }),
    );
  },
});
