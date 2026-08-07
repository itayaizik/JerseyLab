import { supabase } from "@/lib/supabase";
import { coerceRows } from "@/api/base44Adapter";

export async function getAllShirts() {
  const { data, error } = await supabase
    .from("shirts_raw")
    .select("*")
    .order("created_date", { ascending: false });

  if (error) throw error;

  // Same coercion the entity adapter applies: `sizes` and `local_stock_sizes`
  // are stored as JSON *text*, so without this the catalog's size and
  // fast-shipping filters read a raw string and silently match nothing.
  return coerceRows(data);
}
