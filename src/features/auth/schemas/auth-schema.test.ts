import { describe, expect, it } from "vitest";
import { passwordChangeSchema, signupSchema } from "./auth-schema";

const signupBase = {
  displayName: "山田 太郎",
  email: "you@example.com",
  confirmPassword: "pass1",
};

describe("signupSchema - password", () => {
  it("英字と数字を含む6文字以上のパスワードは通過する", () => {
    const result = signupSchema.safeParse({
      ...signupBase,
      password: "pass12",
      confirmPassword: "pass12",
    });

    expect(result.success).toBe(true);
  });

  it("6文字未満の場合はエラーになる", () => {
    const result = signupSchema.safeParse({
      ...signupBase,
      password: "ab1",
      confirmPassword: "ab1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "パスワードは6文字以上で、英字と数字を含めてください",
      );
    }
  });

  it("数字のみの場合はエラーになる", () => {
    const result = signupSchema.safeParse({
      ...signupBase,
      password: "123456",
      confirmPassword: "123456",
    });

    expect(result.success).toBe(false);
  });

  it("英字のみの場合はエラーになる", () => {
    const result = signupSchema.safeParse({
      ...signupBase,
      password: "abcdef",
      confirmPassword: "abcdef",
    });

    expect(result.success).toBe(false);
  });
});

describe("passwordChangeSchema - password", () => {
  it("英字と数字を含む6文字以上のパスワードは通過する", () => {
    const result = passwordChangeSchema.safeParse({
      newPassword: "newpass1",
      confirmPassword: "newpass1",
    });

    expect(result.success).toBe(true);
  });

  it("英字と数字を含まない場合はエラーになる", () => {
    const result = passwordChangeSchema.safeParse({
      newPassword: "abcdef",
      confirmPassword: "abcdef",
    });

    expect(result.success).toBe(false);
  });
});
