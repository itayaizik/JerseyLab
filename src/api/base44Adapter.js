import { supabase } from "@/lib/supabase";

// Maps Base44 entity names to their migrated Supabase table names.
// All confirmed to exist except InstagramPost (table not created yet).
const TABLES = {
  Shirt: "shirts_raw",
  Wishlist: "wishlists_raw",
  InterestRequest: "interest_requests_raw",
  Review: "reviews_raw",
  FAQ: "faq_raw",
  AdminLog: "admin_logs_raw",
  SearchLog: "search_logs_raw",
  SiteSetting: "site_settings_raw",
  Category: "categories_raw",
  LeagueCard: "league_cards_raw",
  PopularClub: "popular_clubs_raw",
  CategoryCard: "category_cards_raw",
  ContactMessage: "contact_messages_raw",
  CustomerProfile: "customer_profiles_raw",
  InstagramPost: "instagram_posts_raw",
};

// Entities where the creator can't read the row back under RLS (public/
// unapproved writes — contact messages, search logs, unapproved reviews,
// profiles with no owning-user column) — so create() must not ask for it
// back, or the whole insert gets rejected as an RLS violation on the
// implicit read-back instead of actually inserting.
const NO_RETURN_ON_CREATE = new Set(["SearchLog", "ContactMessage", "CustomerProfile", "Review", "InterestRequest"]);

// Some columns in the *_raw tables store JSON (arrays/objects) as text
// instead of native jsonb, so parse anything that looks like JSON back
// into real arrays/objects — matches the shape Base44 used to return.
function coerceRow(row) {
  if (!row) return row;
  const out = { ...row };
  for (const [key, value] of Object.entries(out)) {
    if (typeof value === "string" && value.length > 1 && (value[0] === "[" || value[0] === "{")) {
      try {
        out[key] = JSON.parse(value);
      } catch {
        // not actually JSON — leave as-is
      }
    }
  }
  return out;
}

function coerceRows(rows) {
  return (rows || []).map(coerceRow);
}

function applySort(query, sort) {
  if (!sort) return query;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return query.order(field, { ascending: !desc });
}

function makeEntity(table, entityName) {
  const skipReturn = NO_RETURN_ON_CREATE.has(entityName);
  return {
    async list(sort, limit) {
      let q = supabase.from(table).select("*");
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return coerceRows(data);
    },

    async filter(query = {}, sort, limit) {
      let q = supabase.from(table).select("*");
      for (const [key, value] of Object.entries(query)) {
        q = q.eq(key, value);
      }
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return coerceRows(data);
    },

    async get(id) {
      const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return coerceRow(data);
    },

    async create(payload) {
      if (skipReturn) {
        const { error } = await supabase.from(table).insert(payload);
        if (error) throw error;
        return payload;
      }
      const { data, error } = await supabase.from(table).insert(payload).select();
      if (error) throw error;
      return coerceRow(data[0]);
    },

    async update(id, payload) {
      const { data, error } = await supabase.from(table).update(payload).eq("id", id).select();
      if (error) throw error;
      return coerceRow(data[0]);
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return true;
    },

    async bulkCreate(items) {
      if (!items || items.length === 0) return [];
      const { data, error } = await supabase.from(table).insert(items).select();
      if (error) throw error;
      return coerceRows(data);
    },
  };
}

export const entities = Object.fromEntries(
  Object.entries(TABLES).map(([entity, table]) => [entity, makeEntity(table, entity)])
);
