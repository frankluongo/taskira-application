import { supabase } from "@/services/supabase";

export async function fetchProjects() {
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order");
  return data || [];
}
