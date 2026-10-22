import { supabase } from "@/services/supabase";

async function fetchOrdered(table) {
  const { data } = await supabase.from(table).select("*").order("sort_order");
  return data || [];
}

export const fetchChecklists = () => fetchOrdered("checklists");
export const fetchChecklistSections = () => fetchOrdered("checklist_sections");
export const fetchChecklistItems = () => fetchOrdered("checklist_items");
