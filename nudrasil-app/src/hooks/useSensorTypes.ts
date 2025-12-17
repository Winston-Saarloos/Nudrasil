import { useQuery } from "@tanstack/react-query";
import { fetchSensorTypes } from "@/controllers/sensorTypesController";

export const useSensorTypes = () => {
  const result = useQuery({
    queryKey: ["sensorTypes"],
    queryFn: async () => {
      return await fetchSensorTypes();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes in ms
    retry: false,
    throwOnError: false,
  });

  return result;
};
