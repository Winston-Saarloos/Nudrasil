#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include "DHT.h"
#include "secrets.h"  // Contains WIFI_SSID, WIFI_PASSWORD, DEVICE_ID, SERVER_URL, CONFIG_PATH, DEVICE_SECRET

// --- Board Setup ---
ESP8266WebServer server(80);

// --- DHT Sensor Setup ---
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// --- Config ---
String serverIp = "";
int serverPort = 0;
const char* temperatureSensorName = "dht22-temp-001";
const char* humiditySensorName = "dh22-humidity-001";

// --- Timers ---
unsigned long lastSent = 0;
const unsigned long sendInterval = (60 * 1000) * 10; // 10 minutes in ms
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

  if (serverIp == "") return false; // Fallback

  HTTPClient http;
  WiFiClient client;
  http.setTimeout(1000);
  String probeUrl = "http://app.nudrasil.com/api/probe";
  debug(probeUrl);
  http.begin(client, probeUrl);
  int code = http.GET();
  http.end();

  if (code == 200) return true;

  debug("Probe failed (" + String(code) + "): " + HTTPClient::errorToString(code));
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
    delay(500);
    debugInline(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    debug("\n[WiFi] Reconnected");
    return true;
  } else {
    debug("\n[WiFi] Failed to reconnect");
    return false;
  }
}

// --- Fetch Config ---
void fetchServerConfig() {
  if (WiFi.status() != WL_CONNECTED) {
    debug("Skipping config fetch: no WiFi.");
    return;
  }

  HTTPClient http;
  WiFiClient client;
  String url = String(SERVER_URL) + CONFIG_PATH + "?secret=" + DEVICE_SECRET + "&deviceId=" + DEVICE_ID;

  debug("Fetching config: " + url);
  http.begin(client, url);
  int code = http.GET();

  if (code == 200) {
    String payload = http.getString();
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (error) {
      debug("JSON parse error: " + String(error.c_str()));
      return;
    }

    JsonObject env = doc[0]["config"]["environments"][doc[0]["config"]["defaultEnv"] | "prod"];
    serverIp = env["ip"].as<String>();
    serverPort = env["port"].as<int>();

    debug("Server IP: " + serverIp);
    debug("Server Port: " + String(serverPort));
  } else {
    debug("Failed to fetch config. HTTP code: " + String(code));
  }

  http.end();
}

// --- POST Sensor Data ---
void postSensorData(float tempC, float humidity) {
  if (serverIp == "") return;

  String url = "http://" + serverIp + ":" + String(serverPort) + "/api/sensor";
  WiFiClient client;
  HTTPClient http;

  // Temperature
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  String tempPayload = "{\"sensor\":\"" + String(temperatureSensorName) + "\",\"value\":" + String(tempC, 2) + "}";
  int tempStatus = http.POST(tempPayload);
  debug("Temp POST: " + String(tempStatus));
  http.end();

  // Humidity
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  String humPayload = "{\"sensor\":\"" + String(humiditySensorName) + "\",\"value\":" + String(humidity, 2) + "}";
  int humStatus = http.POST(humPayload);
  debug("Humidity POST: " + String(humStatus));
  http.end();
}

void setup() {
  Serial.begin(115200);
  dht.begin();

  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  debug("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    debugInline(".");
  }

  debug("\nConnected!");
  debug("IP: " + WiFi.localIP().toString());

  server.on("/health", HTTP_GET, []() {
    server.send(200, "text/plain", "healthy");
  });
  server.begin();
  debug("Web server started");

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

    if (isnan(tempC) || isnan(hum)) {
      debug("DHT read failed.");
      return;
    }

    debug("Sending readings: Temp=" + String(tempC) + "C, Humidity=" + String(hum) + "%");
    postSensorData(tempC, hum);
  }
}
