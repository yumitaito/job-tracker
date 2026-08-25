import { assertEquals } from "jsr:@std/assert@1";
import {
  hasBearerAuthorization,
  isCronAuthorized,
  shouldRollbackReminderReservation,
} from "./security.ts";

Deno.test("delete-accountはBearer tokenを要求する", () => {
  assertEquals(hasBearerAuthorization(new Request("https://example.test")), false);
  assertEquals(
    hasBearerAuthorization(
      new Request("https://example.test", { headers: { Authorization: "Basic abc" } }),
    ),
    false,
  );
  assertEquals(
    hasBearerAuthorization(
      new Request("https://example.test", { headers: { Authorization: "Bearer token" } }),
    ),
    true,
  );
});

Deno.test("cron secretは未設定・不一致を拒否する", () => {
  assertEquals(isCronAuthorized("secret", undefined), false);
  assertEquals(isCronAuthorized("wrong", "secret"), false);
  assertEquals(isCronAuthorized("secret", "secret"), true);
});

Deno.test("Pushが一件も届かなければ予約をrollbackする", () => {
  assertEquals(shouldRollbackReminderReservation(0), true);
  assertEquals(shouldRollbackReminderReservation(1), false);
});
