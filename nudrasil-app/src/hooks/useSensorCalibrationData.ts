import { SensorDataController } from "@/controllers/sensorDataController";
import { useQuery } from "@tanstack/react-query";

const useSensorCalibrationData = (sensorId: number) => {
  const result = useQuery({
    queryKey: ["calibration", sensorId],
    queryFn: async () =>
      await SensorDataController.getCalibrationData(sensorId),
    staleTime: 300000, // 5 minutes in ms
  });
  return result;
};

export default useSensorCalibrationData;
