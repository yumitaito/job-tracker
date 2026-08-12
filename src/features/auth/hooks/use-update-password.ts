import { useMutation } from "@tanstack/react-query";
import { updatePassword } from "@/features/auth/api/auth-api";

export function useUpdatePassword() {
  return useMutation({
    mutationFn: updatePassword,
  });
}
