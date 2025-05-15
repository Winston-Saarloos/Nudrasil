#include <Arduino.h>

#define RELAY_PIN D7          // active-LOW
void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);   // relay OFF
}
void loop() {
  digitalWrite(RELAY_PIN, LOW);    // ON  (pump runs)
  delay(3000);
  digitalWrite(RELAY_PIN, HIGH);   // OFF (pump stops)
  delay(5000);
}
