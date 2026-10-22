import { supabase } from "@/services/supabase";

async function fetchOrdered(table) {
  const { data } = await supabase.from(table).select("*").order("sort_order");
  return data || [];
}

export const fetchChecklists = () => fetchOrdered("checklists");
export const fetchChecklistSections = () => fetchOrdered("checklist_sections");
export const fetchChecklistItems = () => fetchOrdered("checklist_items");

export async function insertChecklist(row) {
  await supabase.from("checklists").insert(row);
}

export async function updateChecklist(id, patch) {
  await supabase.from("checklists").update(patch).eq("id", id);
}

export async function deleteChecklist(id) {
  await supabase.from("checklists").delete().eq("id", id);
}

export async function uncheckAllItems(checklistId) {
  await supabase
    .from("checklist_items")
    .update({ checked: false })
    .eq("checklist_id", checklistId);
}

export async function insertSection(row) {
  await supabase.from("checklist_sections").insert(row);
}

export async function updateSection(id, patch) {
  await supabase.from("checklist_sections").update(patch).eq("id", id);
}

export async function deleteSection(id) {
  await supabase.from("checklist_sections").delete().eq("id", id);
}

export async function updateSectionSortOrders(rows) {
  await Promise.all(
    rows.map((sec) =>
      supabase
        .from("checklist_sections")
        .update({ sort_order: sec.sort_order })
        .eq("id", sec.id),
    ),
  );
}

export async function insertItem(row) {
  await supabase.from("checklist_items").insert(row);
}

export async function updateItem(id, patch) {
  await supabase.from("checklist_items").update(patch).eq("id", id);
}

export async function deleteItem(id) {
  await supabase.from("checklist_items").delete().eq("id", id);
}

// Writes both sort_order and section_id, since items can move sections.
export async function updateItemPositions(rows) {
  await Promise.all(
    rows.map((i) =>
      supabase
        .from("checklist_items")
        .update({ sort_order: i.sort_order, section_id: i.section_id })
        .eq("id", i.id),
    ),
  );
}
