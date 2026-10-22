import { supabase } from "@/services/supabase";

export async function fetchProjects() {
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order");
  return data || [];
}

export async function insertProject(row) {
  await supabase.from("projects").insert(row);
}

export async function updateProject(id, patch) {
  await supabase.from("projects").update(patch).eq("id", id);
}

export async function deleteProject(id) {
  await supabase.from("projects").delete().eq("id", id);
}

// Completing a project completes its open tasks and stops them recurring.
export async function completeProjectTask(taskId, completedAt) {
  await supabase
    .from("tasks")
    .update({ completed_at: completedAt, recurrence: null })
    .eq("id", taskId);
}
