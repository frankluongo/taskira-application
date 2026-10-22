import { supabase } from "@/services/supabase";
import { cancelReminder, scheduleReminder } from "@/services/notifications";
import { nextRecurrenceDate } from "@/shared/recurrence";
import { INBOX_PROJECT_ID } from "./tasks.constants";
import { taskReminder } from "./tasks.rules";

export const createTasksSlice = (set, get) => ({
  tasks: [],

  addTask: async (task) => {
    const row = {
      id: crypto.randomUUID(),
      sort_order: get().tasks.length,
      parent_task_id: null,
      ...task,
    };
    set((s) => ({ tasks: [...s.tasks, row] }));
    await supabase.from("tasks").insert(row);
    scheduleReminder(taskReminder(row));
  },

  updateTask: async (id, patch) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
    await supabase.from("tasks").update(patch).eq("id", id);
    const updated = get().tasks.find((t) => t.id === id);
    if (updated) {
      await cancelReminder(id);
      scheduleReminder(taskReminder(updated));
    }
  },

  deleteTask: async (id) => {
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id && t.parent_task_id !== id),
    }));
    await supabase.from("tasks").delete().eq("id", id);
    cancelReminder(id);
  },

  reorderTasks: async (ordered) => {
    set({ tasks: ordered });
    await Promise.all(
      ordered.map((t) =>
        supabase
          .from("tasks")
          .update({ sort_order: t.sort_order })
          .eq("id", t.id),
      ),
    );
  },

  completeTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    if (task.project_id === INBOX_PROJECT_ID) {
      set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== id && t.parent_task_id !== id),
      }));
      await supabase.from("tasks").delete().eq("id", id);
      cancelReminder(id);
      return;
    }

    if (task.recurrence === "daily" || (task.recurrence && task.due_date)) {
      const nextDate = nextRecurrenceDate(task);
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, due_date: nextDate } : t,
        ),
      }));
      await supabase.from("tasks").update({ due_date: nextDate }).eq("id", id);
      await cancelReminder(id);
      const updated = get().tasks.find((t) => t.id === id);
      if (updated) scheduleReminder(taskReminder(updated));
      return;
    }

    const now = new Date().toISOString();
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, completed_at: now } : t,
      ),
    }));
    await supabase.from("tasks").update({ completed_at: now }).eq("id", id);
    cancelReminder(id);
  },
});
