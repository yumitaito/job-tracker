import { useMutation } from "@tanstack/react-query";
import { deleteAccount } from "@/features/auth/api/auth-api";

export function useDeleteAccount() {
  return useMutation({
    mutationFn: deleteAccount,
  });
}
