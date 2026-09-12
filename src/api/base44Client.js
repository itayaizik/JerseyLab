import { entities } from './base44Adapter';
import { auth } from '@/lib/supabaseAuth';
import { integrations } from '@/lib/supabaseStorage';

// The `base44` name is kept because several dozen modules import it, but nothing
// behind it is Base44 any more: entities go to Supabase through base44Adapter,
// auth and file storage go to Supabase directly.
//
// The last Base44 piece was `analytics`, which went through the platform SDK
// with credentials that stopped working when the shop left. Every event it was
// sent had a Supabase write on the adjacent line already recording the same
// thing - SearchLog for searches, views_count for product views, interest_count
// for cart adds, and the InterestRequest and ContactMessage rows themselves for
// submissions - so the calls were a duplicate that only produced 401s in every
// visitor's console. They are gone, and with them the SDK and the app-params
// module that existed to configure it.
export const base44 = {
  auth,
  integrations,
  entities,
};
