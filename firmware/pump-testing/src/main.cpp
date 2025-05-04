#include <Arduino.h>

#define PUMP_RELAY_PIN D6  // Use your actual GPIO pin

void setup() {
  Serial.begin(115200);
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  
  // Turn relay ON (active LOW)
  Serial.println("Pump ON");
  digitalWrite(PUMP_RELAY_PIN, LOW);  // Relay activated
  delay(5000);                         // Run pump for 5 seconds

  // Turn relay OFF
  Serial.println("Pump OFF");
  digitalWrite(PUMP_RELAY_PIN, HIGH); // Relay deactivated
}

void loop() {
  // Do nothing
}
