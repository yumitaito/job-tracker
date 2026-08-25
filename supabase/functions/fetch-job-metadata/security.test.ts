import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import {
  assertSafeTarget,
  type DnsLookupResult,
  isAllowedHost,
  isBlockedIpAddress,
} from "./security.ts";

Deno.test("allowlistは完全一致と明示wildcardだけを許可する", () => {
  assertEquals(isAllowedHost("jobs.example.com", ["*.example.com"]), true);
  assertEquals(isAllowedHost("example.com", ["*.example.com"]), false);
  assertEquals(isAllowedHost("evil-example.com", ["*.example.com"]), false);
});

Deno.test("private IPv4/IPv6/mapped IPv6を拒否する", () => {
  for (
    const address of [
      "10.0.0.1",
      "172.16.0.1",
      "192.168.1.1",
      "::1",
      "fd00::1",
      "::ffff:127.0.0.1",
      "::ffff:7f00:1",
    ]
  ) {
    assertEquals(isBlockedIpAddress(address), true, address);
  }
  assertEquals(isBlockedIpAddress("203.0.113.10"), false);
});

Deno.test("DNSがprivate addressを返す場合はallowlist済みでも拒否する", async () => {
  await assertRejects(() =>
    assertSafeTarget(
      new URL("https://jobs.example.com"),
      ["*.example.com"],
      async (_host, type) =>
        type === "A" ? { status: "records", addresses: ["127.0.0.1"] } : { status: "no-records" },
    )
  );
});

Deno.test("redirect先も呼び出し側が同じ検査へ通せる", async () => {
  const resolve = async (): Promise<DnsLookupResult> => ({
    status: "records",
    addresses: ["203.0.113.10"],
  });
  await assertSafeTarget(new URL("https://jobs.example.com"), ["*.example.com"], resolve);
  await assertRejects(() =>
    assertSafeTarget(new URL("http://127.0.0.1/admin"), ["*.example.com"], resolve)
  );
});
