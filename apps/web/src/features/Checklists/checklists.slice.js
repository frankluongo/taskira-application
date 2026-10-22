import * as api from "./checklists.api";

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
    await api.insertChecklist(row);
    return row;
  },

  renameChecklist: async (id, name) => {
    set((s) => ({
      checklists: s.checklists.map((c) => (c.id === id ? { ...c, name } : c)),
    }));
    await api.updateChecklist(id, { name });
  },

  deleteChecklist: async (id) => {
    set((s) => ({
      checklists: s.checklists.filter((c) => c.id !== id),
      checklist_sections: s.checklist_sections.filter(
        (sec) => sec.checklist_id !== id,
      ),
      checklist_items: s.checklist_items.filter((i) => i.checklist_id !== id),
    }));
    await api.deleteChecklist(id);
  },

  resetChecklist: async (id) => {
    set((s) => ({
      checklist_items: s.checklist_items.map((i) =>
        i.checklist_id === id ? { ...i, checked: false } : i,
      ),
    }));
    await api.uncheckAllItems(id);
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
    await api.insertSection(row);
  },

  renameSection: async (id, name) => {
    set((s) => ({
      checklist_sections: s.checklist_sections.map((sec) =>
        sec.id === id ? { ...sec, name } : sec,
      ),
    }));
    await api.updateSection(id, { name });
  },

  deleteSection: async (id) => {
    set((s) => ({
      checklist_sections: s.checklist_sections.filter((sec) => sec.id !== id),
      checklist_items: s.checklist_items.map((i) =>
        i.section_id === id ? { ...i, section_id: null } : i,
      ),
    }));
    await api.deleteSection(id);
  },

  reorderSections: async (ordered) => {
    set((s) => ({
      checklist_sections: s.checklist_sections.map(
        (sec) => ordered.find((o) => o.id === sec.id) || sec,
      ),
    }));
    await api.updateSectionSortOrders(ordered);
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
    await api.insertItem(row);
  },

  renameItem: async (id, name) => {
    set((s) => ({
      checklist_items: s.checklist_items.map((i) =>
        i.id === id ? { ...i, name } : i,
      ),
    }));
    await api.updateItem(id, { name });
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
    await api.updateItem(id, { checked });
  },

  deleteItem: async (id) => {
    set((s) => ({
      checklist_items: s.checklist_items.filter((i) => i.id !== id),
    }));
    await api.deleteItem(id);
  },

  // TODO(§8 #10): `ordered` holds { id, section_id, sort_order } patches, and
  // they replace the stored rows outright, so moved items lose their name and
  // checklist_id until the next reload. Merge instead of replacing.
  reorderItems: async (ordered) => {
    set((s) => ({
      checklist_items: s.checklist_items.map(
        (i) => ordered.find((o) => o.id === i.id) || i,
      ),
    }));
    await api.updateItemPositions(ordered);
  },
});
