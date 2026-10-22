import { cancelReminder, scheduleReminder } from "@/services/notifications";
import * as api from "./tasks.api";
import { taskCompletionOutcome, taskReminder } from "./tasks.rules";

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
    await api.insertTask(row);
    scheduleReminder(taskReminder(row));
  },

  updateTask: async (id, patch) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
    await api.updateTask(id, patch);
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
    await api.deleteTask(id);
    cancelReminder(id);
  },

  reorderTasks: async (ordered) => {
    set({ tasks: ordered });
    await api.updateSortOrders(ordered);
  },

  completeTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const outcome = taskCompletionOutcome(task);

    if (outcome.type === "delete") {
      set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== id && t.parent_task_id !== id),
      }));
      await api.deleteTask(id);
      cancelReminder(id);
      return;
    }

    if (outcome.type === "reschedule") {
      const { due_date } = outcome;
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, due_date } : t)),
      }));
      await api.updateTask(id, { due_date });
      await cancelReminder(id);
      const updated = get().tasks.find((t) => t.id === id);
      if (updated) scheduleReminder(taskReminder(updated));
      return;
    }

    const { completed_at } = outcome;
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed_at } : t)),
    }));
    await api.updateTask(id, { completed_at });
    cancelReminder(id);
  },
});
