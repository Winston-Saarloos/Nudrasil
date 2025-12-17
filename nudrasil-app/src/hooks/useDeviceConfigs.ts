import { useQuery } from "@tanstack/react-query";
import { fetchDeviceConfigs } from "@/controllers/deviceConfigsController";

export const useDeviceConfigs = () => {
  const result = useQuery({
    queryKey: ["deviceConfigs"],
    queryFn: async () => {
      return await fetchDeviceConfigs();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes in ms
    retry: false,
    throwOnError: false,
  });

  return result;
};
