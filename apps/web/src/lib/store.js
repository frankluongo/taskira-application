import { create } from "zustand";
import { format } from "date-fns";
import { supabase } from "./supabase";
import {
  scheduleHabitNotification,
  cancelHabitNotification,
  scheduleTaskNotification,
  cancelTaskNotification,
} from "./notifications";

const INBOX_PROJECT_ID = "00000000-0000-0000-0000-000000000001";

const today = () => format(new Date(), "yyyy-MM-dd");

export const useStore = create((set, get) => ({
  habits: [],
  habit_completions: [],
  tasks: [],
  checklists: [],
  checklist_sections: [],
  checklist_items: [],
  initialized: false,

  initialize: async () => {
    const [
      { data: habits },
      { data: habit_completions },
      { data: tasks },
      { data: checklists },
      { data: checklist_sections },
      { data: checklist_items },
    ] = await Promise.all([
      supabase.from("habits").select("*").order("sort_order"),
      supabase
        .from("habit_completions")
        .select("*")
        .eq("completed_on", today()),
      supabase
        .from("tasks")
        .select("*")
        .eq("project_id", INBOX_PROJECT_ID)
        .order("sort_order"),
      supabase.from("checklists").select("*").order("sort_order"),
      supabase.from("checklist_sections").select("*").order("sort_order"),
      supabase.from("checklist_items").select("*").order("sort_order"),
    ]);
    const d = today();
    const expiredHabits = (habits || []).filter(
      (h) => h.end_date && h.end_date < d,
    );
    const liveHabits = (habits || []).filter(
      (h) => !h.end_date || h.end_date >= d,
    );

    set({
      habits: liveHabits,
      habit_completions: habit_completions || [],
      tasks: tasks || [],
      checklists: checklists || [],
      checklist_sections: checklist_sections || [],
      checklist_items: checklist_items || [],
      initialized: true,
    });

    if (expiredHabits.length > 0) {
      await supabase
        .from("habits")
        .delete()
        .in(
          "id",
          expiredHabits.map((h) => h.id),
        );
    }
  },

  // ── Habits ──────────────────────────────────────────────────────────
  addHabit: async (habit) => {
    const row = {
      id: crypto.randomUUID(),
      sort_order: get().habits.length,
      ...habit,
    };
    set((s) => ({ habits: [...s.habits, row] }));
    await supabase.from("habits").insert(row);
    scheduleHabitNotification(row);
  },

  updateHabit: async (id, patch) => {
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));
    await supabase.from("habits").update(patch).eq("id", id);
    const updated = get().habits.find((h) => h.id === id);
    if (updated) {
      await cancelHabitNotification(id);
      scheduleHabitNotification(updated);
    }
  },

  deleteHabit: async (id) => {
    set((s) => ({
      habits: s.habits.filter((h) => h.id !== id),
      habit_completions: s.habit_completions.filter((c) => c.habit_id !== id),
    }));
    await supabase.from("habits").delete().eq("id", id);
    cancelHabitNotification(id);
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
    const date = today();
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
    const date = today();
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
      (c) => c.habit_id === habit_id && c.completed_on === today(),
    ),

  habitsDueToday: () => {
    const { habits, habit_completions } = get();
    const d = today();
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

  // ── Tasks ─────────────────────────────────────────────────────────────
  addTask: async (task) => {
    const row = {
      id: crypto.randomUUID(),
      sort_order: get().tasks.length,
      project_id: INBOX_PROJECT_ID,
      parent_task_id: null,
      ...task,
    };
    set((s) => ({ tasks: [...s.tasks, row] }));
    await supabase.from("tasks").insert(row);
    scheduleTaskNotification(row);
  },

  updateTask: async (id, patch) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
    await supabase.from("tasks").update(patch).eq("id", id);
    const updated = get().tasks.find((t) => t.id === id);
    if (updated) {
      await cancelTaskNotification(id);
      scheduleTaskNotification(updated);
    }
  },

  deleteTask: async (id) => {
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id && t.parent_task_id !== id),
    }));
    await supabase.from("tasks").delete().eq("id", id);
    cancelTaskNotification(id);
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
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id && t.parent_task_id !== id),
    }));
    await supabase.from("tasks").delete().eq("id", id);
    cancelTaskNotification(id);
  },

  // ── Checklists ───────────────────────────────────────────────────────
  addChecklist: async (name) => {
    const row = {
      id: crypto.randomUUID(),
      name,
      sort_order: get().checklists.length,
    };
    set((s) => ({ checklists: [...s.checklists, row] }));
    await supabase.from("checklists").insert(row);
    return row;
  },

  renameChecklist: async (id, name) => {
    set((s) => ({
      checklists: s.checklists.map((c) => (c.id === id ? { ...c, name } : c)),
    }));
    await supabase.from("checklists").update({ name }).eq("id", id);
  },

  deleteChecklist: async (id) => {
    set((s) => ({
      checklists: s.checklists.filter((c) => c.id !== id),
      checklist_sections: s.checklist_sections.filter(
        (sec) => sec.checklist_id !== id,
      ),
      checklist_items: s.checklist_items.filter((i) => i.checklist_id !== id),
    }));
    await supabase.from("checklists").delete().eq("id", id);
  },

  resetChecklist: async (id) => {
    set((s) => ({
      checklist_items: s.checklist_items.map((i) =>
        i.checklist_id === id ? { ...i, checked: false } : i,
      ),
    }));
    await supabase
      .from("checklist_items")
      .update({ checked: false })
      .eq("checklist_id", id);
  },

  // ── Checklist Sections ──────────────────────────────────────────────────
  addSection: async (checklistId, name) => {
    const sort_order = get().checklist_sections.filter(
      (sec) => sec.checklist_id === checklistId,
    ).length;
    const row = {
      id: crypto.randomUUID(),
      checklist_id: checklistId,
      name,
      sort_order,
    };
    set((s) => ({ checklist_sections: [...s.checklist_sections, row] }));
    await supabase.from("checklist_sections").insert(row);
  },

  renameSection: async (id, name) => {
    set((s) => ({
      checklist_sections: s.checklist_sections.map((sec) =>
        sec.id === id ? { ...sec, name } : sec,
      ),
    }));
    await supabase.from("checklist_sections").update({ name }).eq("id", id);
  },

  deleteSection: async (id) => {
    set((s) => ({
      checklist_sections: s.checklist_sections.filter((sec) => sec.id !== id),
      checklist_items: s.checklist_items.map((i) =>
        i.section_id === id ? { ...i, section_id: null } : i,
      ),
    }));
    await supabase.from("checklist_sections").delete().eq("id", id);
  },

  reorderSections: async (ordered) => {
    set((s) => ({
      checklist_sections: s.checklist_sections.map(
        (sec) => ordered.find((o) => o.id === sec.id) || sec,
      ),
    }));
    await Promise.all(
      ordered.map((sec) =>
        supabase
          .from("checklist_sections")
          .update({ sort_order: sec.sort_order })
          .eq("id", sec.id),
      ),
    );
  },

  // ── Checklist Items ──────────────────────────────────────────────────────
  addItem: async (checklistId, sectionId, name) => {
    const sort_order = get().checklist_items.filter(
      (i) => i.checklist_id === checklistId && i.section_id === sectionId,
    ).length;
    const row = {
      id: crypto.randomUUID(),
      checklist_id: checklistId,
      section_id: sectionId,
      name,
      checked: false,
      sort_order,
    };
    set((s) => ({ checklist_items: [...s.checklist_items, row] }));
    await supabase.from("checklist_items").insert(row);
  },

  renameItem: async (id, name) => {
    set((s) => ({
      checklist_items: s.checklist_items.map((i) =>
        i.id === id ? { ...i, name } : i,
      ),
    }));
    await supabase.from("checklist_items").update({ name }).eq("id", id);
  },

  toggleItem: async (id) => {
    const item = get().checklist_items.find((i) => i.id === id);
    if (!item) return;
    const checked = !item.checked;
    set((s) => ({
      checklist_items: s.checklist_items.map((i) =>
        i.id === id ? { ...i, checked } : i,
      ),
    }));
    await supabase.from("checklist_items").update({ checked }).eq("id", id);
  },

  deleteItem: async (id) => {
    set((s) => ({
      checklist_items: s.checklist_items.filter((i) => i.id !== id),
    }));
    await supabase.from("checklist_items").delete().eq("id", id);
  },

  reorderItems: async (ordered) => {
    set((s) => ({
      checklist_items: s.checklist_items.map(
        (i) => ordered.find((o) => o.id === i.id) || i,
      ),
    }));
    await Promise.all(
      ordered.map((i) =>
        supabase
          .from("checklist_items")
          .update({ sort_order: i.sort_order, section_id: i.section_id })
          .eq("id", i.id),
      ),
    );
  },
}));

export const PRIORITY_LABELS = {
  5: { label: "Critical" },
  4: { label: "High" },
  3: { label: "Medium" },
  2: { label: "Low" },
  1: { label: "Someday" },
};
