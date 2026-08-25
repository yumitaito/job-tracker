import { assertEquals } from "jsr:@std/assert@1";
import { createDeleteAccountHandler } from "./handler.ts";
Deno.test("本人検証後だけ本人IDを削除する", async () => {
  const deleted: string[] = [];
  const handler = createDeleteAccountHandler({
    authenticate: async () => ({ userId: "user-a" }),
    deleteUser: async (id) => {
      deleted.push(id);
      return {};
    },
  });
  assertEquals(
    (await handler(
      new Request("https://test", { method: "POST", headers: { Authorization: "Bearer valid" } }),
    )).status,
    200,
  );
  assertEquals(deleted, ["user-a"]);
});
Deno.test("認証なし・不正Bearer・認証失敗ではadmin deleteしない", async () => {
  let deletes = 0;
  const handler = createDeleteAccountHandler({
    authenticate: async () => ({ error: "invalid" }),
    deleteUser: async () => {
      deletes++;
      return {};
    },
  });
  for (
    const headers of [{}, { Authorization: "Basic bad" }, {
      Authorization: "Bearer bad",
    }] as HeadersInit[]
  ) {
    assertEquals(
      (await handler(new Request("https://test", { method: "POST", headers }))).status,
      401,
    );
  }
  assertEquals(deletes, 0);
});
Deno.test("admin削除失敗を500で返す", async () => {
  const handler = createDeleteAccountHandler({
    authenticate: async () => ({ userId: "user-a" }),
    deleteUser: async () => ({ error: "failed" }),
  });
  assertEquals(
    (await handler(
      new Request("https://test", { method: "POST", headers: { Authorization: "Bearer valid" } }),
    )).status,
    500,
  );
});
