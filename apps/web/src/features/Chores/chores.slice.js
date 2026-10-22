import { cancelReminder, scheduleReminder } from "@/services/notifications";
import * as api from "./chores.api";
import { choreCompletionOutcome, choreReminder } from "./chores.rules";

export const createChoresSlice = (set, get) => ({
  chore_lists: [],
  chores: [],

  addChoreList: async (name) => {
    const row = {
      id: crypto.randomUUID(),
      name,
      sort_order: get().chore_lists.length,
    };
    set((s) => ({ chore_lists: [...s.chore_lists, row] }));
    await api.insertChoreList(row);
  },

  deleteChoreList: async (id) => {
    set((s) => ({ chore_lists: s.chore_lists.filter((l) => l.id !== id) }));
    await api.deleteChoreList(id);
  },

  addChore: async (chore) => {
    const row = {
      id: crypto.randomUUID(),
      sort_order: get().chores.length,
      created_at: new Date().toISOString(),
      ...chore,
    };
    set((s) => ({ chores: [...s.chores, row] }));
    await api.insertChore(row);
    scheduleReminder(choreReminder(row));
  },

  updateChore: async (id, patch) => {
    set((s) => ({
      chores: s.chores.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
    await api.updateChore(id, patch);
    const updated = get().chores.find((e) => e.id === id);
    if (updated) {
      await cancelReminder(id);
      scheduleReminder(choreReminder(updated));
    }
  },

  deleteChore: async (id) => {
    set((s) => ({ chores: s.chores.filter((e) => e.id !== id) }));
    await api.deleteChore(id);
    cancelReminder(id);
  },

  reorderChores: async (ordered) => {
    set({ chores: ordered });
    await api.updateSortOrders(ordered);
  },

  completeChore: async (id) => {
    const chore = get().chores.find((e) => e.id === id);
    if (!chore) return;
    const outcome = choreCompletionOutcome(chore);
    if (outcome.type === "reschedule") {
      const { due_date } = outcome;
      set((s) => ({
        chores: s.chores.map((e) => (e.id === id ? { ...e, due_date } : e)),
      }));
      await api.updateChore(id, { due_date });
      await cancelReminder(id);
      const updated = get().chores.find((e) => e.id === id);
      if (updated) scheduleReminder(choreReminder(updated));
    } else {
      set((s) => ({ chores: s.chores.filter((e) => e.id !== id) }));
      await api.deleteChore(id);
      cancelReminder(id);
    }
  },
});
