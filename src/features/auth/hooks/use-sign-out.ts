import { useMutation } from "@tanstack/react-query";
import { signOut } from "@/features/auth/api/auth-api";

export function useSignOut() {
  return useMutation({
    mutationFn: signOut,
  });
}
