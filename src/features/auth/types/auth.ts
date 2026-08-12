/** アプリ内で扱うログインユーザー情報（Supabase Authのuserを最小限に整形したもの） */
export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string | null;
};
