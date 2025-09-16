import { SensorDataController } from "@/controllers/sensorDataController";
import { useQuery } from "@tanstack/react-query";

const useSensorData = (sensorId: number) => {
  const result = useQuery({
    queryKey: ["sensor", sensorId],
    queryFn: async () => await SensorDataController.getSensorData(sensorId),
    staleTime: 30000, // 30 seconds in ms
  });
  return result;
};

export default useSensorData;
