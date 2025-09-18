#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_TSL2561_U.h>

// Create TSL2561 sensor object
Adafruit_TSL2561_Unified tsl = Adafruit_TSL2561_Unified(TSL2561_ADDR_FLOAT, 12345);

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Initialize I²C on D2 (SDA), D1 (SCL)
  Wire.begin(D2, D1);

  // Start TSL2561
  if (!tsl.begin()) {
    Serial.println("Could not find a valid TSL2561 sensor. Check wiring!");
    while (1);
  }

  // Configure the sensor
  tsl.enableAutoRange(true);  // Auto gain
  tsl.setIntegrationTime(TSL2561_INTEGRATIONTIME_402MS);  // Longer time = more sensitivity

  Serial.println("TSL2561 initialized!");
}

void loop() {
  sensors_event_t event;
  tsl.getEvent(&event);

  if (event.light) {
    Serial.print("Ambient Light: ");
    Serial.print(event.light);
    Serial.println(" lux");
  } else {
    Serial.println("Sensor overload or failed to read light data.");
  }

  delay(1000);
}
