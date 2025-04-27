#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include "DHT.h"
#include "secrets.h" 

// DHT sensor config
#define DHTPIN 4        // GPIO4 (D2 on NodeMCU)
#define DHTTYPE DHT22   // Can also be DHT11
DHT dht(DHTPIN, DHTTYPE);

// Server details fetched from config
String serverIp = "";
int serverPort = 0;

void fetchServerConfig() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    WiFiClient wifiClient;

    Serial.println("Fetching config from server...");
    String configUrl = String(SERVER_URL) + String(CONFIG_PATH) + "?secret=" + DEVICE_SECRET + "&deviceId=" + DEVICE_ID;

    http.begin(wifiClient, configUrl);
    int httpCode = http.GET();

    if (httpCode == 200) {
      String payload = http.getString();

      // Parse JSON
      JsonDocument doc;
      DeserializationError error = deserializeJson(doc, payload);

      if (error) {
        Serial.print("JSON parse error: ");
        Serial.println(error.c_str());
        return;
      }

      JsonObject device = doc[0];
      JsonObject config = device["config"];
      
      String defaultEnv = config["defaultEnv"] | "prod";
      JsonObject env = config["environments"][defaultEnv];
      
      serverIp = env["ip"].as<String>();
      serverPort = env["port"].as<int>();

      Serial.println("Using server IP: " + serverIp);
      Serial.println("Using server Port: " + String(serverPort));
    } else {
      Serial.print("Failed to fetch config, HTTP code: ");
      Serial.println(httpCode);
    }

    http.end();
  } else {
    Serial.println("WiFi not connected when fetching config.");
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();

  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.println("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnected to WiFi!");
  Serial.print("ESP IP address: ");
  Serial.println(WiFi.localIP());

  // Fetch configuration from server
  fetchServerConfig();
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

    // --- Post Temperature ---
    HTTPClient http;
    WiFiClient wifiClient;

    http.begin(wifiClient, serverUrl);
    http.addHeader("Content-Type", "application/json");
    String tempPayload = "{\"sensor\":\"dht22-temp\",\"value\":" + String(t, 2) + "}";
    int httpCode1 = http.POST(tempPayload);
    Serial.println("Temp POST status: " + String(httpCode1));
    http.end();

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
