import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDeviceConfigs } from "@/controllers/deviceConfigsController";

export const useDeviceConfigs = (
  isEnabled: boolean = false,
  adminSecret?: string,
) => {
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: ["deviceConfigs", adminSecret],
    queryFn: async () => {
      if (!adminSecret) {
        throw new Error("Admin secret is required");
      }

      const adminSecretData = queryClient.getQueryData<{
        secret: string;
        isValid: boolean;
      }>(["adminSecret", adminSecret]);

      if (!adminSecretData?.isValid) {
        throw new Error("Valid admin secret is required");
      }

      return await fetchDeviceConfigs(adminSecret);
    },
    enabled: isEnabled && !!adminSecret,
    staleTime: 5 * 60 * 1000, // 5 minutes in ms
    retry: false,
    throwOnError: false,
  });

  return result;
};
