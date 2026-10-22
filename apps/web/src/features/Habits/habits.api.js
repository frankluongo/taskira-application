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

export async function deleteHabits(ids) {
  await supabase.from("habits").delete().in("id", ids);
}
