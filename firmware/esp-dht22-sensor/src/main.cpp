#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include "DHT.h"

const char* ssid = "";
const char* password = "";

const char* configUrl = "https://app.nudrasil.com/api/admin/device-configs?deviceId=3&key=mySecret";

// DHT sensor config
#define DHTPIN 4        // GPIO4 (D2 on NodeMCU)
#define DHTTYPE DHT22   // Can also be DHT11
DHT dht(DHTPIN, DHTTYPE);

String serverIp = "";
int serverPort = 0;

void setup() {
  Serial.begin(115200);
  dht.begin();

  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  WiFi.begin(ssid, password);

  Serial.println("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnected to WiFi!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // fetch config from server
  fetchServerConfig();
}

void fetchServerConfig() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    WiFiClient wifiClient;

    Serial.println("Fetching config from server...");
    http.begin(wifiClient, configUrl);
    int httpCode = http.GET();

    if (httpCode == 200) {
      String payload = http.getString();
      Serial.println("Received config:");
      Serial.println(payload);

      // Parse JSON
      StaticJsonDocument<1024> doc;
      DeserializationError error = deserializeJson(doc, payload);

      if (error) {
        Serial.print("JSON parse failed: ");
        Serial.println(error.c_str());
      } else {
        String defaultEnv = doc["defaultEnv"] | "prod";
        serverIp = doc["environments"][defaultEnv]["ip"].as<String>();
        serverPort = doc["environments"][defaultEnv]["port"].as<int>();

        Serial.println("Using Server IP: " + serverIp);
        Serial.println("Using Server Port: " + String(serverPort));
      }
    } else {
      Serial.print("Failed to fetch config. HTTP code: ");
      Serial.println(httpCode);
    }

    http.end();
  } else {
    Serial.println("WiFi not connected during config fetch.");
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED && serverIp != "") {
    float h = dht.readHumidity();
    float t = dht.readTemperature(); // Celsius

    if (isnan(h) || isnan(t)) {
      Serial.println("Failed to read from DHT sensor!");
      delay(10000);
      return;
    }

    String serverUrl = "http://" + serverIp + ":" + String(serverPort) + "/api/sensor";

    HTTPClient http;
    WiFiClient wifiClient;

    // --- Post Temperature ---
    http.begin(wifiClient, serverUrl);
    http.addHeader("Content-Type", "application/json");
    String tempPayload = "{\"sensor\":\"dht22-temp\",\"value\":" + String(t, 2) + "}";
    int httpCode1 = http.POST(tempPayload);
    Serial.println("Temp POST status: " + String(httpCode1));
    http.end();

    delay(1000);

    // --- Post Humidity ---
    http.begin(wifiClient, serverUrl);
    http.addHeader("Content-Type", "application/json");
    String humPayload = "{\"sensor\":\"dht22-humidity\",\"value\":" + String(h, 2) + "}";
    int httpCode2 = http.POST(humPayload);
    Serial.println("Humidity POST status: " + String(httpCode2));
    http.end();
  } else {
    Serial.println("WiFi not connected or server config missing.");
  }

  delay(60000 * 10); // Wait 10 minutes
}