import { createClient } from "npm:@supabase/supabase-js@2";
import { createDeleteAccountHandler } from "./handler.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(createDeleteAccountHandler({
  authenticate: async (authorization) => {
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return { error: "server configuration" };
    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: { user }, error } = await client.auth.getUser();
    return error || !user ? { error: error?.message ?? "invalid user" } : { userId: user.id };
  },
  deleteUser: async (userId) => {
    const { error } = await createClient(supabaseUrl, serviceRoleKey).auth.admin.deleteUser(userId);
    return error ? { error: error.message } : {};
  },
}));
