import { supabase } from "@/services/supabase";
import { cancelReminder, scheduleReminder } from "@/services/notifications";
import { todayISO } from "@/shared/date";
import { habitReminder } from "./habits.rules";

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
    await supabase.from("habits").insert(row);
    scheduleReminder(habitReminder(row));
  },

  updateHabit: async (id, patch) => {
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));
    await supabase.from("habits").update(patch).eq("id", id);
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
    await supabase.from("habits").delete().eq("id", id);
    cancelReminder(id);
  },

  reorderHabits: async (ordered) => {
    set({ habits: ordered });
    await Promise.all(
      ordered.map((h) =>
        supabase
          .from("habits")
          .update({ sort_order: h.sort_order })
          .eq("id", h.id),
      ),
    );
  },

  completeHabit: async (habit_id) => {
    const date = todayISO();
    if (
      get().habit_completions.some(
        (c) => c.habit_id === habit_id && c.completed_on === date,
      )
    )
      return;
    const row = { id: crypto.randomUUID(), habit_id, completed_on: date };
    set((s) => ({ habit_completions: [...s.habit_completions, row] }));
    await supabase.from("habit_completions").insert(row);
  },

  uncompleteHabit: async (habit_id) => {
    const date = todayISO();
    set((s) => ({
      habit_completions: s.habit_completions.filter(
        (c) => !(c.habit_id === habit_id && c.completed_on === date),
      ),
    }));
    await supabase
      .from("habit_completions")
      .delete()
      .eq("habit_id", habit_id)
      .eq("completed_on", date);
  },

  isHabitDoneToday: (habit_id) =>
    get().habit_completions.some(
      (c) => c.habit_id === habit_id && c.completed_on === todayISO(),
    ),

  habitsDueToday: () => {
    const { habits, habit_completions } = get();
    const d = todayISO();
    const dow = new Date().getDay();
    return habits.filter((h) => {
      if (
        habit_completions.some(
          (c) => c.habit_id === h.id && c.completed_on === d,
        )
      )
        return false;
      if (h.start_date && h.start_date > d) return false;
      if (h.end_date && h.end_date < d) return false;
      if (h.recurrence === "daily") return true;
      if (h.recurrence === "weekdays") return dow >= 1 && dow <= 5;
      if (h.recurrence === "weekends") return dow === 0 || dow === 6;
      if (h.recurrence === "specific_days")
        return h.recurrence_days?.includes(dow);
      return true;
    });
  },
});
