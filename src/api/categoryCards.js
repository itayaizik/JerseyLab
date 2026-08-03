import { supabase } from "@/lib/supabase";

export async function getCategoryCards() {
  const { data, error } = await supabase
    .from("category_cards_raw")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return data;
}