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

export async function insertChoreList(row) {
  await supabase.from("chore_lists").insert(row);
}

export async function deleteChoreList(id) {
  await supabase.from("chore_lists").delete().eq("id", id);
}

export async function insertChore(row) {
  await supabase.from("chores").insert(row);
}

export async function updateChore(id, patch) {
  await supabase.from("chores").update(patch).eq("id", id);
}

export async function deleteChore(id) {
  await supabase.from("chores").delete().eq("id", id);
}

export async function updateSortOrders(rows) {
  await Promise.all(
    rows.map((c) =>
      supabase
        .from("chores")
        .update({ sort_order: c.sort_order })
        .eq("id", c.id),
    ),
  );
}
