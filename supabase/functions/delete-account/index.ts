// Supabase Edge Function: delete-account
//
// ログイン中の本人のSupabase Authアカウントを削除する。
// auth.users の削除には管理者権限（service_role key）が必要なため、
// フロントエンドに秘密鍵を置かず、このEdge Function内でのみ使用する。
// service_role keyはSupabaseが各Edge Functionへ自動的に環境変数として
// 注入するため、手動でのシークレット登録は不要。
//
// jobs.user_id は auth.users(id) を on delete cascade で参照しているため、
// アカウント削除に伴い、そのユーザーが登録した求人データも自動的に削除される。

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type FunctionResponse = { ok: true } | { ok: false; error: string };

function jsonResponse(body: FunctionResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "POSTメソッドのみ対応しています" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ ok: false, error: "認証情報がありません" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ ok: false, error: "サーバー設定が不足しています" }, 500);
  }

  // リクエストのJWT（本人のアクセストークン）を使ってユーザーを検証する
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ ok: false, error: "認証に失敗しました" }, 401);
  }

  // 削除操作のみservice_role権限のクライアントを使用する
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return jsonResponse({ ok: false, error: deleteError.message }, 500);
  }

  return jsonResponse({ ok: true });
});
