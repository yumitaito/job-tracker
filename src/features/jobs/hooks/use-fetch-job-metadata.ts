import { useMutation } from "@tanstack/react-query";
import { fetchJobMetadata } from "@/features/jobs/api/job-metadata-api";

export function useFetchJobMetadata() {
  return useMutation({
    mutationFn: fetchJobMetadata,
  });
}
