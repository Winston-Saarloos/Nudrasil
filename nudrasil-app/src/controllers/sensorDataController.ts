import { axiosRequest } from "@/utils/axiosRequest";
import {
  SensorDataResponse,
  CalibrationResponse,
  SensorReading,
  CalibrationData,
} from "@/models/SensorTypes";

export class SensorDataController {
  private static baseUrl = "/api/sensor";

  /**
   * Fetches sensor data for a specific sensor ID
   */
  static async getSensorData(sensorId: number): Promise<SensorReading[]> {
    const response = await axiosRequest<SensorDataResponse>({
      method: "GET",
      url: `${this.baseUrl}?sensorId=${sensorId}`,
    });

    if (!response.success || !response.value) {
      throw new Error(
        `Failed to fetch sensor data for sensor ${sensorId}: ${response.message}`,
      );
    }

    return response.value.data;
  }

  /**
   * Fetches calibration data for a specific sensor ID
   */
  static async getCalibrationData(sensorId: number): Promise<CalibrationData> {
    const response = await axiosRequest<CalibrationResponse>({
      method: "GET",
      url: `${this.baseUrl}/calibration?sensorId=${sensorId}`,
    });

    if (!response.success || !response.value) {
      throw new Error(
        `Failed to fetch calibration data for sensor ${sensorId}: ${response.message}`,
      );
    }

    return response.value.data;
  }
}
