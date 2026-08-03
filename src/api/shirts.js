import { supabase } from "@/lib/supabase";

export async function getAllShirts() {
  const { data, error } = await supabase
    .from("shirts_raw")
    .select("*")
    .order("created_date", { ascending: false });

  console.log("SUPABASE DATA:", data);
  console.log("SUPABASE ERROR:", error);

  if (error) throw error;

  return data;
}