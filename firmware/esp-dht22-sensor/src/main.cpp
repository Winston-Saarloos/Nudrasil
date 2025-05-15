#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <ArduinoOTA.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include <Adafruit_TSL2561_U.h>
#include "DHT.h"
#include "secrets.h"

// --- TSL2561 Setup ---
Adafruit_TSL2561_Unified tsl = Adafruit_TSL2561_Unified(TSL2561_ADDR_FLOAT, 1);

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
const char* lightSensorName = "lux-sensor-001";

// Soil Sensors
const char* moistureSensor1Name = "soil-moisture-001";
const char* moistureSensor2Name = "soil-moisture-002";
const char* moistureSensor3Name = "soil-moisture-003";

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
  if (WiFi.status() != WL_CONNECTED) {
    debug("Not connected to WiFi, skipping config fetch");
    return;
  }

  HTTPClient http;
  WiFiClient client;
  String url = String(SERVER_URL) + CONFIG_PATH + "?deviceId=" + DEVICE_ID;
  debug("Fetching config from: " + url);
  http.begin(client, url);
  http.addHeader("Authorization", DEVICE_SECRET);
  
  int code = http.GET();
  String body = http.getString();
  debug("Config fetch HTTP " + String(code) + ": " + body);
  
  if (code != 200) {
    debug("Config fetch failed");
    http.end();
    return;
  }
  
  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, body);
  if (err) {
    debug("Failed to parse config: " + String(err.c_str()));
    http.end();
    return;
  }
  
  JsonObject env = doc[0]["config"]["environments"][doc[0]["config"]["defaultEnv"] | "prod"];
  serverIp = env["ip"].as<String>();
  serverPort = env["port"].as<int>();
  
  debug("Parsed server config: " + serverIp + ":" + String(serverPort));
  http.end();
}

// --- POST Sensor Data ---
void postSensorData(float tempC, float humidity, int moisture1, int moisture2, int moisture3, int light) {
  if (serverIp == "") {
    debug("Cannot post: serverIp is empty");
    return;
  }

  String url = "http://" + serverIp + ":" + String(serverPort) + "/api/sensor";
  debug("POST target URL: " + url);

  WiFiClient client;
  HTTPClient http;

  struct Sensor {
    const char* name;
    float value;
  } sensors[] = {
    { temperatureSensorName, tempC },
    { humiditySensorName, humidity },
    { moistureSensor1Name, static_cast<float>(moisture1) },
    { moistureSensor2Name, static_cast<float>(moisture2) },
    { moistureSensor3Name, static_cast<float>(moisture3) },
    { lightSensorName, static_cast<float>(light) }
  };

  for (auto s : sensors) {
    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");

    String payload = String("{\"sensor\":\"") + s.name + "\",\"value\":" + s.value + "}";
    debug("Sending payload: " + payload);

    int status = http.POST(payload);
    debug("POST response code: " + String(status));

    if (status > 0) {
      String response = http.getString();
      debug("POST response body: " + response);
    } else {
      debug("POST failed with error: " + http.errorToString(status));
    }

    http.end();
  }
}

// --- Sensor Cycle ---
void runSensorCycle() {
  debug("Send interval reached");

  // --- Read DHT22 ---
  debug("Reading DHT22");
  yield();
  float tempC = dht.readTemperature();
  float hum = dht.readHumidity();
  yield();

  if (isnan(tempC) || isnan(hum)) {
    debug("DHT22 read failed. Temp: " + String(tempC) + ", Humidity: " + String(hum));
    return;
  }

  debug("DHT22 values: Temp = " + String(tempC) + " C, Humidity = " + String(hum) + " %");

  // --- Read soil moisture ---
  debug("Reading soil moisture from ADS1115 A0, A1, A2");
  yield();

  int moisture1 = 0, moisture2 = 0, moisture3 = 0;

  if (ads.begin()) {
    moisture1 = ads.readADC_SingleEnded(0);
    moisture2 = ads.readADC_SingleEnded(1);
    moisture3 = ads.readADC_SingleEnded(2);
    debug("Moisture A0: " + String(moisture1));
    debug("Moisture A1: " + String(moisture2));
    debug("Moisture A2: " + String(moisture3));
  } else {
    debug("ADS1115 not initialized or failed");
  }
  yield();

  // --- Read TSL2561 ---
  debug("Reading light from TSL2561");
  yield();
  sensors_event_t event;
  int light = -1;
  tsl.getEvent(&event);
  yield();

  if (event.light) {
    light = static_cast<int>(event.light);
    debug("TSL2561 lux: " + String(light));
  } else {
    debug("TSL2561 read failed or sensor saturated");
  }

  postSensorData(tempC, hum, moisture1, moisture2, moisture3, light);
  debug("Sensor data posted successfully");
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  Wire.begin(D2, D1);
  ads.begin();

  // TSL2561 Init
  if (!tsl.begin()) {
    debug("TSL2561 not found");
  } else {
    tsl.enableAutoRange(true);
    tsl.setIntegrationTime(TSL2561_INTEGRATIONTIME_402MS);
    debug("TSL2561 initialized");
  }

  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  debug("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    debugInline(".");
  }
  debug("");
  debug("WiFi connected successfully");
  debug("ESP IP address: " + WiFi.localIP().toString());

  server.on("/health", HTTP_GET, []() { server.send(200, "text/plain", "healthy"); });
  server.begin();
  fetchServerConfig();

  // --- OTA Setup ---
  ArduinoOTA.setHostname("nodemcu");
  ArduinoOTA.onStart([]() { debug("OTA Update Start"); });
  ArduinoOTA.onEnd([]() { debug("OTA Update Complete"); });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    debug("OTA Progress: " + String((progress * 100) / total) + "%");
  });
  ArduinoOTA.onError([](ota_error_t error) {
    debug("OTA Error [" + String(error) + "]");
  });
  ArduinoOTA.begin();
  debug("OTA Ready");
}

void loop() {
  ArduinoOTA.handle();
  server.handleClient();

  if (checkConnectivity()) {
    unsigned long now = millis();
    if (now - lastSent >= sendInterval) {
      lastSent = now;
      runSensorCycle();
    }
  }
}
