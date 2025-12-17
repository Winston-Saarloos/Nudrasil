import { useQuery } from "@tanstack/react-query";
import { fetchSensors } from "@/controllers/sensorsController";

export const useSensors = () => {
  const result = useQuery({
    queryKey: ["sensors"],
    queryFn: async () => {
      return await fetchSensors();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes in ms
    retry: false,
    throwOnError: false,
  });

  return result;
};
