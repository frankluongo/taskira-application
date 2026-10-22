import { supabase } from "@/services/supabase";

export async function fetchHabits() {
  const { data } = await supabase
    .from("habits")
    .select("*")
    .order("sort_order");
  return data || [];
}

export async function fetchTodayCompletions(today) {
  const { data } = await supabase
    .from("habit_completions")
    .select("*")
    .eq("completed_on", today);
  return data || [];
}

export async function insertHabit(row) {
  await supabase.from("habits").insert(row);
}

export async function updateHabit(id, patch) {
  await supabase.from("habits").update(patch).eq("id", id);
}

export async function deleteHabit(id) {
  await supabase.from("habits").delete().eq("id", id);
}

export async function deleteHabits(ids) {
  await supabase.from("habits").delete().in("id", ids);
}

export async function updateSortOrders(rows) {
  await Promise.all(
    rows.map((h) =>
      supabase
        .from("habits")
        .update({ sort_order: h.sort_order })
        .eq("id", h.id),
    ),
  );
}

export async function insertCompletion(row) {
  await supabase.from("habit_completions").insert(row);
}

export async function deleteCompletion(habitId, date) {
  await supabase
    .from("habit_completions")
    .delete()
    .eq("habit_id", habitId)
    .eq("completed_on", date);
}
