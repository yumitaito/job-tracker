import { assertEquals } from "jsr:@std/assert@1";
import {
  createSendInterviewRemindersHandler,
  type InterviewCandidate,
  type ReminderDependencies,
} from "./handler.ts";

const candidate: InterviewCandidate = {
  jobId: "job",
  userId: "user",
  companyName: "会社",
  stage: "custom",
  scheduleId: "schedule",
  stageLabel: "面接",
  at: "2026-08-25T00:00:00Z",
  interviewUrl: null,
};
function setup(overrides: Partial<ReminderDependencies> = {}) {
  const rollbacks: Array<{ jobId: string; scheduleId: string; at: string }> = [];
  const deleted: string[] = [];
  const deps: ReminderDependencies = {
    cronSecret: "secret",
    configured: true,
    getCandidates: async () => ({ data: [candidate] }),
    reserve: async () => ({}),
    getSubscriptions: async () => ({
      data: [{ endpoint: "endpoint", p256dh: "key", auth: "auth" }],
    }),
    rollback: async (key) => {
      rollbacks.push(key);
      return {};
    },
    send: async () => {},
    deleteSubscription: async (endpoint) => {
      deleted.push(endpoint);
    },
    ...overrides,
  };
  return { handler: createSendInterviewRemindersHandler(deps), rollbacks, deleted };
}
const request = () =>
  new Request("https://function.test", { method: "POST", headers: { "x-cron-secret": "secret" } });

Deno.test("CRON secret未設定と不一致を拒否する", async () => {
  assertEquals((await setup({ cronSecret: undefined }).handler(request())).status, 500);
  const wrong = new Request("https://function.test", {
    method: "POST",
    headers: { "x-cron-secret": "wrong" },
  });
  assertEquals((await setup().handler(wrong)).status, 401);
});

Deno.test("購読取得エラーと0件では複合キーで予約をrollbackする", async () => {
  for (const result of [{ error: { message: "query failed" } }, { data: [] }]) {
    const state = setup({ getSubscriptions: async () => result });
    await state.handler(request());
    assertEquals(state.rollbacks, [{ jobId: "job", scheduleId: "schedule", at: candidate.at }]);
  }
});

Deno.test("全push失敗ではrollbackし、一部成功なら予約を維持する", async () => {
  const allFailed = setup({
    send: async () => {
      throw new Error("push failed");
    },
  });
  await allFailed.handler(request());
  assertEquals(allFailed.rollbacks.length, 1);
  let calls = 0;
  const partial = setup({
    getSubscriptions: async () => ({
      data: [{ endpoint: "a", p256dh: "k", auth: "a" }, { endpoint: "b", p256dh: "k", auth: "a" }],
    }),
    send: async () => {
      if (++calls === 1) throw new Error("failed");
    },
  });
  const body = await (await partial.handler(request())).json();
  assertEquals(partial.rollbacks, []);
  assertEquals(body.sent, 1);
});

Deno.test("404と410の購読を削除する", async () => {
  for (const statusCode of [404, 410]) {
    const state = setup({
      send: async () => {
        throw { statusCode };
      },
    });
    await state.handler(request());
    assertEquals(state.deleted, ["endpoint"]);
    assertEquals(state.rollbacks.length, 1);
  }
});
