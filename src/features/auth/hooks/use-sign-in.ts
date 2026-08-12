import { useMutation } from "@tanstack/react-query";
import { signIn } from "@/features/auth/api/auth-api";

export function useSignIn() {
  return useMutation({
    mutationFn: signIn,
  });
}
