import { hasBearerAuthorization } from "../_shared/security.ts";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export type DeleteAccountDependencies = {
  authenticate: (authorization: string) => Promise<{ userId?: string; error?: string }>;
  deleteUser: (userId: string) => Promise<{ error?: string }>;
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
export function createDeleteAccountHandler(deps: DeleteAccountDependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
    if (request.method !== "POST") {
      return json({ ok: false, error: "POSTメソッドのみ対応しています" }, 405);
    }
    const authorization = request.headers.get("Authorization");
    if (!authorization || !hasBearerAuthorization(request)) {
      return json({ ok: false, error: "認証情報がありません" }, 401);
    }
    const authenticated = await deps.authenticate(authorization);
    if (authenticated.error || !authenticated.userId) {
      return json({ ok: false, error: "認証に失敗しました" }, 401);
    }
    const deleted = await deps.deleteUser(authenticated.userId);
    return deleted.error ? json({ ok: false, error: deleted.error }, 500) : json({ ok: true });
  };
}
