export type AuthE2EEnvironment = {
  E2E_REQUIRE_AUTH?: string;
  E2E_TEST_USER_EMAIL?: string;
  E2E_TEST_USER_PASSWORD?: string;
};

export function isAuthE2ERequired(env: AuthE2EEnvironment): boolean {
  return env.E2E_REQUIRE_AUTH === "true";
}

export function validateAuthE2ECredentials(env: AuthE2EEnvironment): {
  email?: string;
  password?: string;
} {
  const email = env.E2E_TEST_USER_EMAIL;
  const password = env.E2E_TEST_USER_PASSWORD;
  if (isAuthE2ERequired(env) && (!email || !password)) {
    throw new Error(
      "E2E_REQUIRE_AUTH=trueですが、E2E_TEST_USER_EMAIL / E2E_TEST_USER_PASSWORDがありません",
    );
  }
  return { email, password };
}

export function assertAuthStorageState(required: boolean, exists: boolean): void {
  if (required && !exists) {
    throw new Error("認証必須E2EのstorageStateが生成されていません");
  }
}
