import { cancelReminder, scheduleReminder } from "@/services/notifications";
import { todayISO } from "@/shared/date";
import * as api from "./habits.api";
import { habitReminder, isHabitDone } from "./habits.rules";

export const createHabitsSlice = (set, get) => ({
  habits: [],
  habit_completions: [],

  addHabit: async (habit) => {
    const row = {
      id: crypto.randomUUID(),
      sort_order: get().habits.length,
      ...habit,
    };
    set((s) => ({ habits: [...s.habits, row] }));
    await api.insertHabit(row);
    scheduleReminder(habitReminder(row));
  },

  updateHabit: async (id, patch) => {
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));
    await api.updateHabit(id, patch);
    const updated = get().habits.find((h) => h.id === id);
    if (updated) {
      await cancelReminder(id);
      scheduleReminder(habitReminder(updated));
    }
  },

  deleteHabit: async (id) => {
    set((s) => ({
      habits: s.habits.filter((h) => h.id !== id),
      habit_completions: s.habit_completions.filter((c) => c.habit_id !== id),
    }));
    await api.deleteHabit(id);
    cancelReminder(id);
  },

  reorderHabits: async (ordered) => {
    set({ habits: ordered });
    await api.updateSortOrders(ordered);
  },

  completeHabit: async (habit_id) => {
    const date = todayISO();
    if (isHabitDone(get().habit_completions, habit_id, date)) return;
    const row = { id: crypto.randomUUID(), habit_id, completed_on: date };
    set((s) => ({ habit_completions: [...s.habit_completions, row] }));
    await api.insertCompletion(row);
  },

  uncompleteHabit: async (habit_id) => {
    const date = todayISO();
    set((s) => ({
      habit_completions: s.habit_completions.filter(
        (c) => !(c.habit_id === habit_id && c.completed_on === date),
      ),
    }));
    await api.deleteCompletion(habit_id, date);
  },
});
