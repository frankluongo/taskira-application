import { create } from "zustand";
import { addDays, addWeeks, addMonths, addYears, format } from "date-fns";
import { supabase } from "./supabase";
import {
  scheduleChoreNotification,
  cancelChoreNotification,
  scheduleHabitNotification,
  cancelHabitNotification,
  scheduleTaskNotification,
  cancelTaskNotification,
} from "./notifications";

export const INBOX_PROJECT_ID = "00000000-0000-0000-0000-000000000001";

const today = () => format(new Date(), "yyyy-MM-dd");

function nextRecurrenceDate(chore) {
  const base =
    chore.repeat_from === "completion_date"
      ? new Date()
      : new Date(chore.due_date);
  switch (chore.recurrence) {
    case "weekly":
      return format(addWeeks(base, 1), "yyyy-MM-dd");
    case "monthly":
      return format(addMonths(base, 1), "yyyy-MM-dd");
    case "yearly":
      return format(addYears(base, 1), "yyyy-MM-dd");
    default: {
      if (chore.recurrence?.startsWith("custom:")) {
        const [, n, unit] = chore.recurrence.split(":");
        const count = parseInt(n, 10);
        if (unit === "days") return format(addDays(base, count), "yyyy-MM-dd");
        if (unit === "weeks")
          return format(addWeeks(base, count), "yyyy-MM-dd");
        if (unit === "months")
          return format(addMonths(base, count), "yyyy-MM-dd");
        if (unit === "years")
          return format(addYears(base, count), "yyyy-MM-dd");
      }
      return null;
    }
  }
}

export const useStore = create((set, get) => ({
  habits: [],
  habit_completions: [],
  chore_lists: [],
  chores: [],
  projects: [],
  tasks: [],
  checklists: [],
  checklist_sections: [],
  checklist_items: [],
  initialized: false,

  initialize: async () => {
    const [
      { data: habits },
      { data: habit_completions },
      { data: chore_lists },
      { data: chores },
      { data: projects },
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
      supabase.from("chore_lists").select("*").order("sort_order"),
      supabase.from("chores").select("*").order("sort_order"),
      supabase.from("projects").select("*").order("sort_order"),
      supabase.from("tasks").select("*").order("sort_order"),
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
    const staleDailyChores = (chores || []).filter(
      (e) => e.recurrence === "daily" && e.due_date && e.due_date < d,
    );
    const freshChores = (chores || []).map((e) =>
      e.recurrence === "daily" && e.due_date && e.due_date < d
        ? { ...e, due_date: d }
        : e,
    );
    const staleDailyTasks = (tasks || []).filter(
      (t) => t.recurrence === "daily" && t.due_date && t.due_date < d,
    );
    const freshTasks = (tasks || []).map((t) =>
      t.recurrence === "daily" && t.due_date && t.due_date < d
        ? { ...t, due_date: d }
        : t,
    );

    set({
      habits: liveHabits,
      habit_completions: habit_completions || [],
      chore_lists: chore_lists || [],
      chores: freshChores,
      projects: projects || [],
      tasks: freshTasks,
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
    if (staleDailyChores.length > 0) {
      await Promise.all(
        staleDailyChores.map((e) =>
          supabase.from("chores").update({ due_date: d }).eq("id", e.id),
        ),
      );
    }
    if (staleDailyTasks.length > 0) {
      await Promise.all(
        staleDailyTasks.map((t) =>
          supabase.from("tasks").update({ due_date: d }).eq("id", t.id),
        ),
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

  // ── Chore Lists ─────────────────────────────────────────────────────
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

  // ── Chores ───────────────────────────────────────────────────────────
  addChore: async (chore) => {
    const row = {
      id: crypto.randomUUID(),
      sort_order: get().chores.length,
      created_at: new Date().toISOString(),
      ...chore,
    };
    set((s) => ({ chores: [...s.chores, row] }));
    await supabase.from("chores").insert(row);
    scheduleChoreNotification(row);
  },

  updateChore: async (id, patch) => {
    set((s) => ({
      chores: s.chores.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
    await supabase.from("chores").update(patch).eq("id", id);
    const updated = get().chores.find((e) => e.id === id);
    if (updated) {
      await cancelChoreNotification(id);
      scheduleChoreNotification(updated);
    }
  },

  deleteChore: async (id) => {
    set((s) => ({ chores: s.chores.filter((e) => e.id !== id) }));
    await supabase.from("chores").delete().eq("id", id);
    cancelChoreNotification(id);
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
    if (chore.recurrence === "daily") {
      const nextDate = format(addDays(new Date(), 1), "yyyy-MM-dd");
      set((s) => ({
        chores: s.chores.map((e) =>
          e.id === id ? { ...e, due_date: nextDate } : e,
        ),
      }));
      await supabase.from("chores").update({ due_date: nextDate }).eq("id", id);
      await cancelChoreNotification(id);
      const updated = get().chores.find((e) => e.id === id);
      if (updated) scheduleChoreNotification(updated);
    } else if (chore.recurrence && chore.due_date) {
      const nextDate = nextRecurrenceDate(chore);
      set((s) => ({
        chores: s.chores.map((e) =>
          e.id === id ? { ...e, due_date: nextDate } : e,
        ),
      }));
      await supabase.from("chores").update({ due_date: nextDate }).eq("id", id);
      await cancelChoreNotification(id);
      const updated = get().chores.find((e) => e.id === id);
      if (updated) scheduleChoreNotification(updated);
    } else {
      set((s) => ({ chores: s.chores.filter((e) => e.id !== id) }));
      await supabase.from("chores").delete().eq("id", id);
      cancelChoreNotification(id);
    }
  },

  // ── Projects ──────────────────────────────────────────────────────────
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
        cancelTaskNotification(t.id);
        return supabase
          .from("tasks")
          .update({ completed_at: now, recurrence: null })
          .eq("id", t.id);
      }),
    );
  },

  // ── Tasks ─────────────────────────────────────────────────────────────
  addTask: async (task) => {
    const row = {
      id: crypto.randomUUID(),
      sort_order: get().tasks.length,
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
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    if (task.project_id === INBOX_PROJECT_ID) {
      set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== id && t.parent_task_id !== id),
      }));
      await supabase.from("tasks").delete().eq("id", id);
      cancelTaskNotification(id);
      return;
    }

    if (task.recurrence === "daily") {
      const nextDate = format(addDays(new Date(), 1), "yyyy-MM-dd");
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, due_date: nextDate } : t,
        ),
      }));
      await supabase.from("tasks").update({ due_date: nextDate }).eq("id", id);
      await cancelTaskNotification(id);
      const updated = get().tasks.find((t) => t.id === id);
      if (updated) scheduleTaskNotification(updated);
      return;
    }

    if (task.recurrence && task.due_date) {
      const nextDate = nextRecurrenceDate(task);
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, due_date: nextDate } : t,
        ),
      }));
      await supabase.from("tasks").update({ due_date: nextDate }).eq("id", id);
      await cancelTaskNotification(id);
      const updated = get().tasks.find((t) => t.id === id);
      if (updated) scheduleTaskNotification(updated);
      return;
    }

    const now = new Date().toISOString();
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, completed_at: now } : t,
      ),
    }));
    await supabase.from("tasks").update({ completed_at: now }).eq("id", id);
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
