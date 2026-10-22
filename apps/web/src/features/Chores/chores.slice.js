import { supabase } from "@/services/supabase";
import { cancelReminder, scheduleReminder } from "@/services/notifications";
import { nextRecurrenceDate } from "@/shared/recurrence";
import { choreReminder } from "./chores.rules";

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
    await supabase.from("chore_lists").insert(row);
  },

  deleteChoreList: async (id) => {
    set((s) => ({ chore_lists: s.chore_lists.filter((l) => l.id !== id) }));
    await supabase.from("chore_lists").delete().eq("id", id);
  },

  addChore: async (chore) => {
    const row = {
      id: crypto.randomUUID(),
      sort_order: get().chores.length,
      created_at: new Date().toISOString(),
      ...chore,
    };
    set((s) => ({ chores: [...s.chores, row] }));
    await supabase.from("chores").insert(row);
    scheduleReminder(choreReminder(row));
  },

  updateChore: async (id, patch) => {
    set((s) => ({
      chores: s.chores.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
    await supabase.from("chores").update(patch).eq("id", id);
    const updated = get().chores.find((e) => e.id === id);
    if (updated) {
      await cancelReminder(id);
      scheduleReminder(choreReminder(updated));
    }
  },

  deleteChore: async (id) => {
    set((s) => ({ chores: s.chores.filter((e) => e.id !== id) }));
    await supabase.from("chores").delete().eq("id", id);
    cancelReminder(id);
  },

  reorderChores: async (ordered) => {
    set({ chores: ordered });
    await Promise.all(
      ordered.map((e) =>
        supabase
          .from("chores")
          .update({ sort_order: e.sort_order })
          .eq("id", e.id),
      ),
    );
  },

  completeChore: async (id) => {
    const chore = get().chores.find((e) => e.id === id);
    if (!chore) return;
    if (chore.recurrence === "daily" || (chore.recurrence && chore.due_date)) {
      const nextDate = nextRecurrenceDate(chore);
      set((s) => ({
        chores: s.chores.map((e) =>
          e.id === id ? { ...e, due_date: nextDate } : e,
        ),
      }));
      await supabase.from("chores").update({ due_date: nextDate }).eq("id", id);
      await cancelReminder(id);
      const updated = get().chores.find((e) => e.id === id);
      if (updated) scheduleReminder(choreReminder(updated));
    } else {
      set((s) => ({ chores: s.chores.filter((e) => e.id !== id) }));
      await supabase.from("chores").delete().eq("id", id);
      cancelReminder(id);
    }
  },
});
