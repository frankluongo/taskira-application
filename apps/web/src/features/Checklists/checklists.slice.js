import { supabase } from "@/services/supabase";

export const createChecklistsSlice = (set, get) => ({
  checklists: [],
  checklist_sections: [],
  checklist_items: [],

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
});
