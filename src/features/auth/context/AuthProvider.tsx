import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { mapAuthUser } from "@/features/auth/api/auth-api";
import type { AuthUser } from "@/features/auth/types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  /** 初回のセッション確認が完了するまでtrue */
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setUser(mapAuthUser(session?.user));
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = mapAuthUser(session?.user);
      // ユーザーが変わった（ログアウト・別アカウントへの切り替え）場合は
      // 前のユーザーのキャッシュを他人に見せないようクリアする
      setUser((prev) => {
        if (prev?.id !== nextUser?.id) {
          queryClient.clear();
        }
        return nextUser;
      });
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ user, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthはAuthProviderの内側で使用してください");
  return ctx;
}
