import { useMutation } from "@tanstack/react-query";
import { signUp } from "@/features/auth/api/auth-api";

export function useSignUp() {
  return useMutation({
    mutationFn: signUp,
  });
}
