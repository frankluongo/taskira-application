import { supabase } from "@/services/supabase";

export async function fetchTasks() {
  const { data } = await supabase.from("tasks").select("*").order("sort_order");
  return data || [];
}

export async function insertTask(row) {
  await supabase.from("tasks").insert(row);
}

export async function updateTask(id, patch) {
  await supabase.from("tasks").update(patch).eq("id", id);
}

export async function deleteTask(id) {
  await supabase.from("tasks").delete().eq("id", id);
}

export async function updateSortOrders(rows) {
  await Promise.all(
    rows.map((t) =>
      supabase
        .from("tasks")
        .update({ sort_order: t.sort_order })
        .eq("id", t.id),
    ),
  );
}
