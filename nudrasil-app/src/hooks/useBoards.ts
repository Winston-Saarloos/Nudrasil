import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBoards } from "@/controllers/boardsController";

export const useBoards = (isEnabled: boolean = false) => {
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      const adminSecretData = queryClient.getQueryData<{
        secret: string;
        isValid: boolean;
      }>(["adminSecret"]);

      if (!adminSecretData?.secret || !adminSecretData?.isValid) {
        throw new Error("Valid admin secret is required");
      }

      return await fetchBoards(adminSecretData.secret);
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes in ms
    retry: false,
    throwOnError: false,
  });

  return result;
};
