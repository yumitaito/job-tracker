import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { createFetchJobMetadataHandler, fetchHtml } from "./handler.ts";

Deno.test("redirect各hopを検査しfetchの自動followを使わない", async () => {
  const checked: string[] = [];
  const redirects: RequestRedirect[] = [];
  let calls = 0;
  const html = await fetchHtml("https://jobs.example/start", {
    assertTarget: async (url) => {
      checked.push(url.href);
    },
    fetchImpl: async (_input, init) => {
      redirects.push(init?.redirect ?? "follow");
      calls++;
      return calls === 1
        ? new Response(null, { status: 302, headers: { location: "/next" } })
        : new Response("<html>ok</html>", { headers: { "content-type": "text/html" } });
    },
  });
  assertEquals(html, "<html>ok</html>");
  assertEquals(checked, ["https://jobs.example/start", "https://jobs.example/next"]);
  assertEquals(redirects, ["manual", "manual"]);
});

Deno.test("private redirectは次hop取得前に拒否する", async () => {
  let fetches = 0;
  await assertRejects(
    () =>
      fetchHtml("https://jobs.example/start", {
        assertTarget: async (url) => {
          if (url.hostname === "127.0.0.1") throw new Error("blocked");
        },
        fetchImpl: async () => {
          fetches++;
          return new Response(null, {
            status: 302,
            headers: { location: "http://127.0.0.1/private" },
          });
        },
      }),
    Error,
    "blocked",
  );
  assertEquals(fetches, 1);
});

Deno.test("redirect上限と取得失敗を返す", async () => {
  await assertRejects(
    () =>
      fetchHtml("https://jobs.example", {
        assertTarget: async () => {},
        fetchImpl: async () => new Response(null, { status: 302, headers: { location: "/again" } }),
      }),
    Error,
    "リダイレクトが多すぎます",
  );
  await assertRejects(
    () =>
      fetchHtml("https://jobs.example", {
        assertTarget: async () => {},
        fetchImpl: async () => {
          throw new Error("network failed");
        },
      }),
    Error,
    "network failed",
  );
});

Deno.test("body上限と非HTMLを拒否する", async () => {
  await assertRejects(
    () =>
      fetchHtml("https://jobs.example", {
        assertTarget: async () => {},
        fetchImpl: async () =>
          new Response("x", {
            headers: { "content-type": "text/html", "content-length": "2000001" },
          }),
      }),
    Error,
    "サイズ",
  );
  await assertRejects(
    () =>
      fetchHtml("https://jobs.example", {
        assertTarget: async () => {},
        fetchImpl: async () =>
          new Response("{}", { headers: { "content-type": "application/json" } }),
      }),
    Error,
    "HTML",
  );
});

Deno.test("content-lengthなしでもstream読込中にbody上限を拒否する", async () => {
  const chunk = new Uint8Array(1_000_001);
  await assertRejects(
    () =>
      fetchHtml("https://jobs.example", {
        assertTarget: async () => {},
        fetchImpl: async () =>
          new Response(
            new ReadableStream({
              start(controller) {
                controller.enqueue(chunk);
                controller.enqueue(chunk);
                controller.close();
              },
            }),
            { headers: { "content-type": "text/html" } },
          ),
      }),
    Error,
    "サイズ",
  );
});

Deno.test("timeout相当のabortをエラーとして返す", async () => {
  await assertRejects(
    () =>
      fetchHtml("https://jobs.example", {
        timeoutMs: 1,
        assertTarget: async () => {},
        fetchImpl: async (_input, init) =>
          await new Promise<Response>((_resolve, reject) =>
            init?.signal?.addEventListener("abort", () => reject(new Error("aborted")))
          ),
      }),
    Error,
    "aborted",
  );
});

Deno.test("HTTP handlerが注入fetcherを使用する", async () => {
  let called = "";
  const handler = createFetchJobMetadataHandler({
    fetchHtml: async (url) => {
      called = url;
      return "<title>Engineer</title>";
    },
  });
  const response = await handler(
    new Request("https://function.test", {
      method: "POST",
      body: JSON.stringify({ url: "https://jobs.example/role" }),
    }),
  );
  assertEquals(response.status, 200);
  assertEquals(called, "https://jobs.example/role");
});
