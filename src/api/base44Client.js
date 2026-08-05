import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { entities } from './base44Adapter';
import { auth } from '@/lib/supabaseAuth';
import { integrations } from '@/lib/supabaseStorage';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
const base44Sdk = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// entities/auth/integrations now go through Supabase directly; analytics
// still goes through the Base44 SDK until that's migrated separately.
export const base44 = {
  auth,
  integrations,
  analytics: base44Sdk.analytics,
  entities,
};
