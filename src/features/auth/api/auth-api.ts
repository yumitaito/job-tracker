import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { toAuthErrorMessage } from "@/features/auth/lib/auth-errors";
import type { AuthUser } from "@/features/auth/types/auth";

export function mapAuthUser(user: User | null | undefined): AuthUser | null {
  if (!user || !user.email) return null;
  const displayName =
    typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : null;
  return {
    id: user.id,
    email: user.email,
    displayName,
    createdAt: user.created_at ?? null,
  };
}

export async function signUp(params: {
  displayName: string;
  email: string;
  password: string;
}): Promise<{ needsEmailConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: { display_name: params.displayName },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });

  if (error) throw new Error(toAuthErrorMessage(error.message));
  return { needsEmailConfirmation: !data.session };
}

export async function signIn(params: { email: string; password: string }): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword(params);
  if (error) throw new Error(toAuthErrorMessage(error.message));
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(toAuthErrorMessage(error.message));
}

/** 表示名・メールアドレスを更新する。メールアドレスを変更した場合は確認メールが送信される。 */
export async function updateProfile(params: {
  displayName: string;
  email: string;
  emailChanged: boolean;
}): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    email: params.emailChanged ? params.email : undefined,
    data: { display_name: params.displayName },
  });
  if (error) throw new Error(toAuthErrorMessage(error.message));
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(toAuthErrorMessage(error.message));
}

/** サーバー側（Edge Function）でアカウント本体を削除する。
 *  jobs.user_idはon delete cascadeのため、紐づく求人データも同時に削除される。
 *  削除後はサーバー上のユーザーが失効するため、ローカルのセッションも破棄する。 */
export async function deleteAccount(): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ ok: boolean; error?: string }>(
    "delete-account",
  );

  if (error) throw new Error(toAuthErrorMessage(error.message));
  if (!data?.ok) throw new Error(data?.error ?? "アカウントの削除に失敗しました。");

  await supabase.auth.signOut();
}
