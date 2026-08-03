import { supabase } from "@/lib/supabase";

export async function getPopularClubs() {
  const { data, error } = await supabase
    .from("popular_clubs_raw")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return data;
}