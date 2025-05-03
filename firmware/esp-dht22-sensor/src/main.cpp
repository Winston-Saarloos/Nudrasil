#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include "DHT.h"
#include "secrets.h"

// --- Board Setup ---
ESP8266WebServer server(80);
Adafruit_ADS1115 ads;

// --- DHT Sensor Setup ---
#define DHTPIN 14  // D5 (GPIO14)
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// --- Sensor Identifiers ---
const char* temperatureSensorName = "dht22-temp-001";
const char* humiditySensorName = "dh22-humidity-001";
const char* moistureSensorName = "soil-moisture-001";
const char* lightSensorName = "light-sensor-001";

// --- Config ---
String serverIp = "";
int serverPort = 0;

// --- Timers ---
unsigned long lastSent = 0;
const unsigned long sendInterval = (60 * 1000) * 10;
unsigned long lastConnectivityCheck = 0;
const unsigned long connectivityCheckInterval = 10000;

// --- Debug Mode ---
const bool debugMode = false;
template <typename T> void debug(const T& msg) { if (debugMode) Serial.println(msg); }
template <typename T> void debugInline(const T& msg) { if (debugMode) Serial.print(msg); }

// --- Connectivity Check ---
bool checkConnectivity() {
  unsigned long now = millis();
  if (now - lastConnectivityCheck < connectivityCheckInterval) return true;
  lastConnectivityCheck = now;

  if (serverIp == "") return false;

  HTTPClient http;
  WiFiClient client;
  http.setTimeout(1000);
  String probeUrl = "http://app.nudrasil.com/api/probe";
  http.begin(client, probeUrl);
  int code = http.GET();
  http.end();

  if (code == 200) return true;

  WiFi.disconnect(true);
  delay(100);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
    delay(500);
    debugInline(".");
  }

  return WiFi.status() == WL_CONNECTED;
}

// --- Fetch Config ---
void fetchServerConfig() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  WiFiClient client;
  String url = String(SERVER_URL) + CONFIG_PATH + "?secret=" + DEVICE_SECRET + "&deviceId=" + DEVICE_ID;
  http.begin(client, url);
  int code = http.GET();

  if (code == 200) {
    String payload = http.getString();
    JsonDocument doc;
    if (!deserializeJson(doc, payload)) {
      JsonObject env = doc[0]["config"]["environments"][doc[0]["config"]["defaultEnv"] | "prod"];
      serverIp = env["ip"].as<String>();
      serverPort = env["port"].as<int>();
    }
  }

  http.end();
}

// --- POST Sensor Data ---
void postSensorData(float tempC, float humidity, int moisture, int light) {
  if (serverIp == "") return;
  String url = "http://" + serverIp + ":" + String(serverPort) + "/api/sensor";
  WiFiClient client;
  HTTPClient http;

  struct Sensor {
    const char* name;
    float value;
  } sensors[] = {
    { temperatureSensorName, tempC },
    { humiditySensorName, humidity },
    { moistureSensorName, static_cast<float>(moisture) },
    { lightSensorName, static_cast<float>(light) }
  };

  for (auto s : sensors) {
    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");
    String payload = String("{\"sensor\":\"") + s.name + "\",\"value\":" + s.value + "}";
    int status = http.POST(payload);
    debug(String(s.name) + " POST: " + String(status));
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  Wire.begin(D2, D1);  // SDA, SCL
  ads.begin();
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    debugInline(".");
  }

  server.on("/health", HTTP_GET, []() { server.send(200, "text/plain", "healthy"); });
  server.begin();
  fetchServerConfig();
}

void loop() {
  server.handleClient();
  if (!checkConnectivity()) return;

  unsigned long now = millis();
  if (now - lastSent >= sendInterval) {
    lastSent = now;

    float tempC = dht.readTemperature();
    float hum = dht.readHumidity();
    int moisture = ads.readADC_SingleEnded(0);
    int lightRaw = ads.readADC_SingleEnded(1);

    // Calibrate light (inverted range 200–20000)
    int minLight = 20000;  // Dark
    int maxLight = 200;    // Bright
    int light = map(lightRaw, minLight, maxLight, 0, 100);
    light = constrain(light, 0, 100);

    if (isnan(tempC) || isnan(hum)) {
      debug("DHT read failed.");
      return;
    }

    debug("Readings => Temp: " + String(tempC) + "C, Humidity: " + String(hum) + "%");
    debug("Moisture: " + String(moisture));
    debug("Light Raw: " + String(lightRaw) + " | Brightness: " + String(light) + "%");

    postSensorData(tempC, hum, moisture, lightRaw);
  }
}
