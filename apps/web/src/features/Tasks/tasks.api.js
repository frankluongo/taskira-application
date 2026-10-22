import { supabase } from "@/services/supabase";

export async function fetchTasks() {
  const { data } = await supabase.from("tasks").select("*").order("sort_order");
  return data || [];
}

export async function updateTask(id, patch) {
  await supabase.from("tasks").update(patch).eq("id", id);
}
