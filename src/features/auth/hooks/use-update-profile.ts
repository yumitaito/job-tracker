import { useMutation } from "@tanstack/react-query";
import { updateProfile } from "@/features/auth/api/auth-api";

export function useUpdateProfile() {
  return useMutation({
    mutationFn: updateProfile,
  });
}
