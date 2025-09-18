import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSensorTypes } from "@/controllers/sensorTypesController";

export const useSensorTypes = (isEnabled: boolean = false) => {
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: ["sensorTypes"],
    queryFn: async () => {
      const adminSecretData = queryClient.getQueryData<{
        secret: string;
        isValid: boolean;
      }>(["adminSecret"]);

      if (!adminSecretData?.secret || !adminSecretData?.isValid) {
        throw new Error("Valid admin secret is required");
      }

      return await fetchSensorTypes(adminSecretData.secret);
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes in ms
    retry: false,
    throwOnError: false,
  });

  return result;
};
