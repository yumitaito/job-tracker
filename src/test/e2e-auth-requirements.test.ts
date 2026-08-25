import { describe, expect, it } from "vitest";
import {
  assertAuthStorageState,
  isAuthE2ERequired,
  validateAuthE2ECredentials,
} from "../../e2e/auth-requirements";

describe("authenticated E2E fail-closed contract", () => {
  it("require flag時は資格情報不足を例外にする", () => {
    expect(() => validateAuthE2ECredentials({ E2E_REQUIRE_AUTH: "true" })).toThrow(
      "E2E_TEST_USER_EMAIL",
    );
  });

  it("require flag時はstorageState欠落を例外にする", () => {
    expect(() => assertAuthStorageState(true, false)).toThrow("storageState");
  });

  it("public/local任意モードでは認証skipを許容する", () => {
    expect(isAuthE2ERequired({})).toBe(false);
    expect(validateAuthE2ECredentials({})).toEqual({ email: undefined, password: undefined });
    expect(() => assertAuthStorageState(false, false)).not.toThrow();
  });
});
