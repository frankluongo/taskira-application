import { supabase } from "@/services/supabase";

export async function fetchChoreLists() {
  const { data } = await supabase
    .from("chore_lists")
    .select("*")
    .order("sort_order");
  return data || [];
}

export async function fetchChores() {
  const { data } = await supabase
    .from("chores")
    .select("*")
    .order("sort_order");
  return data || [];
}

export async function updateChore(id, patch) {
  await supabase.from("chores").update(patch).eq("id", id);
}
