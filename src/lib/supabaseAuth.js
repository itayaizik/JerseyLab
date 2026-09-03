import { supabase } from "@/lib/supabase";
import { ADMIN_EMAILS } from "@/lib/adminEmails";

export function toAppUser(supabaseUser) {
  if (!supabaseUser) return null;
  const email = supabaseUser.email;
  return {
    id: supabaseUser.id,
    email,
    full_name: supabaseUser.user_metadata?.full_name || "",
    role: ADMIN_EMAILS.includes(email) ? "admin" : "user",
  };
}

// Same method names/shapes as the old base44.auth surface, backed by Supabase Auth,
// so the ~13 files calling base44.auth.* didn't need to change.
export const auth = {
  async me() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) throw new Error("Not authenticated");
    return toAppUser(data.user);
  },

  async logout(redirectPath) {
    await supabase.auth.signOut();
    if (redirectPath) window.location.href = redirectPath;
  },

  redirectToLogin() {
    window.location.href = "/login";
  },

  async loginViaEmailPassword(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  loginWithProvider(provider, redirectPath = "/") {
    return supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${redirectPath}` },
    });
  },

  async register({ email, password, full_name }) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: full_name ? { data: { full_name } } : undefined,
    });
    if (error) throw error;
  },

  async verifyOtp({ email, otpCode }) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: "signup" });
    if (error) throw error;
    return { access_token: data.session?.access_token };
  },

  setToken() {
    // Supabase already persists the session after signIn/signUp/verifyOtp - nothing to do.
  },

  async resendOtp(email) {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) throw error;
  },

  async resetPasswordRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },
};
