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
#if ENABLE_LUX_SENSOR
Adafruit_TSL2561_Unified tsl = Adafruit_TSL2561_Unified(TSL2561_ADDR_FLOAT, 1);
#endif

// --- Board Setup ---
ESP8266WebServer server(80);
Adafruit_ADS1115* ads = nullptr;
bool adsInitialized = false;

// --- DHT Sensor Setup ---
#define DHTPIN 14  // D5 (GPIO14)
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// --- Onboard LED Setup ---
#define LED_PIN 2  // D4 (GPIO2) - Onboard LED (active LOW)

// --- Moisture Sensor Configuration ---
struct MoistureSensorConfig {
  const char* name;
  int channel;
};

#if MOISTURE_SENSOR_COUNT > 0
MoistureSensorConfig moistureSensors[] = {
  { MOISTURE_SENSOR_1_NAME, MOISTURE_SENSOR_1_CHANNEL }
  #if MOISTURE_SENSOR_COUNT > 1
  , { MOISTURE_SENSOR_2_NAME, MOISTURE_SENSOR_2_CHANNEL }
  #endif
  #if MOISTURE_SENSOR_COUNT > 2
  , { MOISTURE_SENSOR_3_NAME, MOISTURE_SENSOR_3_CHANNEL }
  #endif
  #if MOISTURE_SENSOR_COUNT > 3
  , { MOISTURE_SENSOR_4_NAME, MOISTURE_SENSOR_4_CHANNEL }
  #endif
};
#endif

// --- Config ---
String serverIp = "";
int serverPort = 0;
bool configNeedsFetch = false;  // Fetch config in main loop

// --- Timers ---
unsigned long lastSent = 0;
const unsigned long sendInterval = (60UL * 1000UL) * 10UL;  // 10 minutes

unsigned long lastConnectivityCheck = 0;
const unsigned long connectivityCheckInterval = 10000;

unsigned long lastConfigFetchAttempt = 0;
const unsigned long configFetchRetryInterval = 5000;  // Retry every 5 seconds if needed

// --- Health/Recovery ---
unsigned long lastSuccessfulPostMs = 0;
const unsigned long maxNoPostBeforeRestartMs = 15UL * 60UL * 1000UL; // 15 minutes
const unsigned long maxWiFiDownBeforeRestartMs = 8UL * 60UL * 1000UL; // 8 minutes
const unsigned long maxConfigFetchFailBeforeRestartMs = 2UL * 60UL * 1000UL; // 2 minutes

// --- Config fetch failure tracking ---
unsigned long firstConfigFetchFailureMs = 0; // Track when config fetch started failing

// --- WiFi transition tracking ---
static wl_status_t lastWiFiStatus = WL_DISCONNECTED;
static unsigned long lastWiFiTransitionMs = 0;
static unsigned long lastReconnectTimeMs = 0;

// --- Manual reconnect backoff ---
unsigned long lastManualReconnectAttemptMs = 0;
const unsigned long reconnectBackoffMs = 60000; // 60 seconds between manual attempts

// --- Probe logging (non-blocking) ---
unsigned long lastProbeAttemptMs = 0;
const unsigned long probeIntervalMs = 60000; // 1 minute
unsigned long lastProbeFailLogMs = 0;

// --- Debug Mode ---
const bool debugMode = true;
template <typename T> void debug(const T& msg) { if (debugMode) Serial.println(msg); }
template <typename T> void debugInline(const T& msg) { if (debugMode) Serial.print(msg); }

// --- Forward Declarations ---
void fetchServerConfig();
bool checkConnectivityNonBlocking();
bool postSensorData(float tempC, float humidity, int* moistureValues, int light);
void runSensorCycle();

// --- WiFi Event Handlers ---
void onWiFiConnected(const WiFiEventStationModeConnected& evt) {
  debug("WiFi connected to: " + String(evt.ssid));
  debug("Channel: " + String(evt.channel));
  digitalWrite(LED_PIN, HIGH); // Turn off LED
}

void onWiFiGotIP(const WiFiEventStationModeGotIP& evt) {
  debug("WiFi IP: " + evt.ip.toString());
  debug("Gateway: " + evt.gw.toString());
  debug("Subnet: " + evt.mask.toString());
  debug("RSSI: " + String(WiFi.RSSI()) + " dBm");

  // Config fetch should happen in main loop
  if (serverIp == "") {
    debug("Server config not initialized, will fetch in main loop");
    configNeedsFetch = true;
    // Clear failure tracking on WiFi reconnect to give config fetch a fresh chance
    firstConfigFetchFailureMs = 0;
  } else {
    debug("Server config already initialized: " + serverIp + ":" + String(serverPort));
  }
}

void onWiFiDisconnected(const WiFiEventStationModeDisconnected& evt) {
  debug("WiFi disconnected. Reason: " + String(evt.reason));
  debug("Attempting to reconnect...");
}

// --- Helper: track WiFi state transitions reliably ---
void updateWiFiTransitionTracking() {
  wl_status_t cur = WiFi.status();
  if (cur != lastWiFiStatus) {
    lastWiFiTransitionMs = millis();

    if (cur == WL_CONNECTED) {
      lastReconnectTimeMs = millis();
    }

    lastWiFiStatus = cur;
  }
}

// --- Connectivity Check (non-blocking for sending) ---
// This function may attempt reconnection, but it does NOT return false just because a probe fails.
// It returns true only if WiFi is connected at the end, false otherwise.
bool checkConnectivityNonBlocking() {
  updateWiFiTransitionTracking();

  unsigned long now = millis();
  if (now - lastConnectivityCheck < connectivityCheckInterval) {
    return WiFi.status() == WL_CONNECTED;
  }
  lastConnectivityCheck = now;

  if (WiFi.status() != WL_CONNECTED) {
    // Respect a backoff between manual reconnect attempts to avoid hammering the AP
    if (now - lastManualReconnectAttemptMs < reconnectBackoffMs) {
      return false;
    }

    lastManualReconnectAttemptMs = now;
    debug("WiFi not connected, attempting manual reconnection (backed off)...");
    debug("Current WiFi status: " + String(WiFi.status()));

    // Disconnect and clear before reconnecting
    WiFi.disconnect();
    delay(100);
    
    // Let auto-reconnect handle most cases; just (re)issue WiFi.begin here.
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    // Don't block here; just report current status. Future calls will see if it connected.
    return WiFi.status() == WL_CONNECTED;
  }

  // WiFi is connected. Optionally run a probe, but do not block sending.
  // Avoid probing immediately after reconnect
  unsigned long sinceReconnect = millis() - lastReconnectTimeMs;
  if (sinceReconnect > 5000 && (millis() - lastProbeAttemptMs) > probeIntervalMs) {
    lastProbeAttemptMs = millis();

    // Probe the server using the same domain as config fetch
    String probeUrl = String(SERVER_URL) + "api/probe";
    HTTPClient http;
    WiFiClient client;
    http.setTimeout(3000);
    http.setReuse(false);

    if (http.begin(client, probeUrl)) {
      int code = http.GET();
      http.end();

      if (code != 200) {
        if (millis() - lastProbeFailLogMs > 30000) {
          debug("Probe failed (HTTP " + String(code) + ") but WiFi is connected; continuing.");
          lastProbeFailLogMs = millis();
        }
      }
    } else {
      http.end();
    }
  }

  return true;
}

// --- Fetch Config ---
void fetchServerConfig() {
  if (WiFi.status() != WL_CONNECTED) {
    debug("Not connected to WiFi, skipping config fetch");
    configNeedsFetch = true;
    // Don't track failure time if WiFi is down - that's handled separately
    return;
  }

  HTTPClient http;
  WiFiClient client;
  String url = String(SERVER_URL) + CONFIG_PATH + "?deviceId=" + DEVICE_ID;
  debug("Fetching config from: " + url);

  http.setTimeout(5000);
  http.setReuse(false);

  if (!http.begin(client, url)) {
    debug("Failed to begin HTTP connection");
    http.end();
    configNeedsFetch = true;
    if (firstConfigFetchFailureMs == 0) {
      firstConfigFetchFailureMs = millis();
    }
    return;
  }

  http.addHeader("Authorization", DEVICE_SECRET);
  debug("Sending Authorization header: " + String(DEVICE_SECRET));

  int code = http.GET();
  String body = http.getString();
  debug("Config fetch HTTP " + String(code) + ": " + body);

  http.end();
  yield();

  if (code != 200) {
    debug("Config fetch failed with HTTP " + String(code));
    configNeedsFetch = true;
    if (firstConfigFetchFailureMs == 0) {
      firstConfigFetchFailureMs = millis();
    }
    return;
  }

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, body);
  if (err) {
    debug("Failed to parse config: " + String(err.c_str()));
    configNeedsFetch = true;
    if (firstConfigFetchFailureMs == 0) {
      firstConfigFetchFailureMs = millis();
    }
    return;
  }

  if (!doc["success"].as<bool>()) {
    debug("Config fetch returned success: false");
    configNeedsFetch = true;
    if (firstConfigFetchFailureMs == 0) {
      firstConfigFetchFailureMs = millis();
    }
    return;
  }

  JsonArray dataArray = doc["value"]["data"];
  if (dataArray.size() == 0) {
    debug("No device config data found");
    configNeedsFetch = true;
    if (firstConfigFetchFailureMs == 0) {
      firstConfigFetchFailureMs = millis();
    }
    return;
  }

  JsonObject deviceConfig = dataArray[0]["config"];
  String defaultEnv = deviceConfig["defaultEnv"] | "prod";
  JsonObject env = deviceConfig["environments"][defaultEnv];

  serverIp = env["ip"].as<String>();
  serverPort = env["port"].as<int>();

  if (serverIp != "" && serverPort > 0) {
    debug("Parsed server config: " + serverIp + ":" + String(serverPort));
    configNeedsFetch = false;
    firstConfigFetchFailureMs = 0; // Clear failure tracking on success
  } else {
    debug("Config parsed but serverIp or serverPort is invalid");
    configNeedsFetch = true;
    if (firstConfigFetchFailureMs == 0) {
      firstConfigFetchFailureMs = millis();
    }
  }
}

// --- POST Sensor Data ---
// Returns true if ALL sensor posts succeeded in this cycle, false otherwise.
// Includes max retries per sensor so the device cannot hang forever.
bool postSensorData(float tempC, float humidity, int* moistureValues, int light) {
  // Use the same domain as config fetch instead of IP from config
  String url = String(SERVER_URL) + "api/sensor";
  debug("POST target URL: " + url);

  struct Sensor {
    const char* name;
    float value;
  };

  Sensor sensors[10];
  int idx = 0;

  if (strlen(TEMP_SENSOR_NAME) > 0 && !isnan(tempC)) {
    sensors[idx++] = { TEMP_SENSOR_NAME, tempC };
  }

  if (strlen(HUMIDITY_SENSOR_NAME) > 0 && !isnan(humidity)) {
    sensors[idx++] = { HUMIDITY_SENSOR_NAME, humidity };
  }

  #if MOISTURE_SENSOR_COUNT > 0
  for (int i = 0; i < MOISTURE_SENSOR_COUNT; i++) {
    if (strlen(moistureSensors[i].name) > 0) {
      sensors[idx++] = { moistureSensors[i].name, static_cast<float>(moistureValues[i]) };
    }
  }
  #endif

  #if ENABLE_LUX_SENSOR
  if (strlen(LUX_SENSOR_NAME) > 0 && light >= 0) {
    sensors[idx++] = { LUX_SENSOR_NAME, static_cast<float>(light) };
  }
  #endif

  bool allOk = true;

  for (int i = 0; i < idx; i++) {
    // Use StaticJsonDocument; it's deprecated but still supported in this ArduinoJson version.
    // The replacement JsonDocument type in v7 doesn't take a capacity in the constructor.
    StaticJsonDocument<128> doc;
    doc["sensor"] = sensors[i].name;
    doc["value"] = sensors[i].value;

    char payload[128];
    size_t n = serializeJson(doc, payload, sizeof(payload));

    debug("Sending payload: " + String(payload));

    const int maxAttempts = 6;
    bool success = false;

    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
      // Try to keep WiFi alive, but do not block forever.
      checkConnectivityNonBlocking();

      if (WiFi.status() != WL_CONNECTED) {
        debug("WiFi not connected before POST (attempt " + String(attempt) + ")");
        delay(1000);
        yield();
        continue;
      }

      WiFiClient client;
      HTTPClient http;
      http.setTimeout(5000);
      http.setReuse(false);

      if (!http.begin(client, url)) {
        debug("http.begin failed (attempt " + String(attempt) + ")");
        http.end();
        delay(750);
        yield();
        continue;
      }

      http.addHeader("Content-Type", "application/json");
      http.addHeader("Connection", "close");
      http.addHeader("Authorization", DEVICE_SECRET);
      debug("Sending Authorization header: " + String(DEVICE_SECRET) + " (POST to sensor endpoint)");

      int status = http.POST(reinterpret_cast<const uint8_t*>(payload), n);

      if (status > 0 && status >= 200 && status < 300) {
        String response = http.getString();
        debug("POST response code: " + String(status));
        debug("POST response body: " + response);
        success = true;
        http.end();
        break;
      }

      if (status > 0) {
        debug("POST failed HTTP " + String(status) + " (attempt " + String(attempt) + ")");
      } else {
        debug("POST transport error (attempt " + String(attempt) + "): " + http.errorToString(status));
      }

      http.end();
      delay(1500);
      yield();
    }

    if (!success) {
      debug("Giving up on sensor after max attempts: " + String(sensors[i].name));
      allOk = false;
      // Continue to next sensor instead of hanging forever
    }
  }

  if (allOk) {
    lastSuccessfulPostMs = millis();
  }

  return allOk;
}

// --- Sensor Cycle ---
void runSensorCycle() {
  debug("Send interval reached");

  if (WiFi.status() != WL_CONNECTED) {
    debug("WiFi not connected, skipping sensor cycle");
    return;
  }

  float tempC = NAN;
  float hum = NAN;

  if (strlen(TEMP_SENSOR_NAME) > 0 || strlen(HUMIDITY_SENSOR_NAME) > 0) {
    debug("Reading DHT22");
    yield();
    tempC = dht.readTemperature();
    hum = dht.readHumidity();
    yield();

    if (isnan(tempC) || isnan(hum)) {
      debug("DHT22 read failed. Temp: " + String(tempC) + ", Humidity: " + String(hum));
    } else {
      debug("DHT22 values: Temp = " + String(tempC) + " C, Humidity = " + String(hum) + " %");
    }
  }

  int moistureValues[4] = {0};

  #if MOISTURE_SENSOR_COUNT > 0
  debug("Reading soil moisture from ADS1115");
  yield();

  if (adsInitialized && ads != nullptr) {
    for (int i = 0; i < MOISTURE_SENSOR_COUNT; i++) {
      moistureValues[i] = ads->readADC_SingleEnded(moistureSensors[i].channel);
      debug("Moisture " + String(moistureSensors[i].name) + " (A" + String(moistureSensors[i].channel) + "): " + String(moistureValues[i]));
    }
  } else {
    debug("ADS1115 not initialized or failed - skipping moisture readings");
  }

  yield();
  #endif

  int light = -1;

  #if ENABLE_LUX_SENSOR
  debug("Reading light from TSL2561");
  yield();

  sensors_event_t event;
  tsl.getEvent(&event);
  yield();

  if (event.light) {
    light = static_cast<int>(event.light);
    debug("TSL2561 lux: " + String(light));
  } else {
    debug("TSL2561 read failed or sensor saturated");
  }
  #endif

  bool ok = postSensorData(tempC, hum, moistureValues, light);
  if (ok) {
    debug("Sensor data posted successfully");
  } else {
    debug("Sensor data post had failures");
  }
}

void setup() {
  Serial.begin(115200);

  if (strlen(TEMP_SENSOR_NAME) > 0 || strlen(HUMIDITY_SENSOR_NAME) > 0) {
    dht.begin();
  }

  Wire.begin(D2, D1);
  delay(100);

  #if MOISTURE_SENSOR_COUNT > 0
  debug("Initializing ADS1115...");
  debug("I2C pins: SDA=D2 (GPIO4), SCL=D1 (GPIO5)");

  uint8_t addresses[] = {0x48, 0x49, 0x4A, 0x4B};
  const char* addrNames[] = {"0x48 (ADDR to GND)", "0x49 (ADDR to VDD)", "0x4A (ADDR to SDA)", "0x4B (ADDR to SCL)"};

  ads = new Adafruit_ADS1115();
  Wire.setClock(100000);

  for (int i = 0; i < 4; i++) {
    debug("Trying ADS1115 at address " + String(addrNames[i]) + "...");
    yield();

    unsigned long startTime = millis();
    bool success = ads->begin(addresses[i]);
    unsigned long elapsed = millis() - startTime;

    if (elapsed > 50) {
      debug("  (took " + String(elapsed) + "ms)");
    }

    if (success) {
      adsInitialized = true;
      debug("ADS1115 initialized successfully at " + String(addrNames[i]));
      break;
    }

    yield();
    delay(10);
  }

  Wire.setClock(400000);

  if (!adsInitialized) {
    delete ads;
    ads = nullptr;
    debug("ADS1115 initialization failed!");
    debug("Moisture sensor readings will be skipped.");
  }
  #endif

  #if ENABLE_LUX_SENSOR
  if (!tsl.begin()) {
    debug("TSL2561 not found");
  } else {
    tsl.enableAutoRange(true);
    tsl.setIntegrationTime(TSL2561_INTEGRATIONTIME_402MS);
    debug("TSL2561 initialized");
  }
  #endif

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);

  // Clear any stored WiFi credentials that might be corrupted
  debug("Clearing stored WiFi credentials...");
  WiFi.persistent(false);
  WiFi.disconnect(true);
  delay(500); // Give time for disconnect to complete
  
  // Configure WiFi settings
  WiFi.mode(WIFI_STA);
  WiFi.setSleepMode(WIFI_NONE_SLEEP);
  WiFi.setOutputPower(20.5);
  WiFi.hostname("nodemcu-sensor");
  // Don't force 11N mode - let it auto-negotiate for better compatibility
  // WiFi.setPhyMode(WIFI_PHY_MODE_11N);
  
  // Enable auto-reconnect for background reconnection attempts
  WiFi.setAutoReconnect(true);
  
  // Now enable persistent storage after clearing
  WiFi.persistent(true);

  static WiFiEventHandler onConnectedHandler = WiFi.onStationModeConnected(onWiFiConnected);
  static WiFiEventHandler onGotIPHandler = WiFi.onStationModeGotIP(onWiFiGotIP);
  static WiFiEventHandler onDisconnectedHandler = WiFi.onStationModeDisconnected(onWiFiDisconnected);

  // Scan for available networks to help diagnose
  debug("Scanning for WiFi networks...");
  int n = WiFi.scanNetworks();
  debug("Found " + String(n) + " networks");
  bool foundSSID = false;
  for (int i = 0; i < n; i++) {
    String ssid = WiFi.SSID(i);
    int rssi = WiFi.RSSI(i);
    if (ssid == WIFI_SSID) {
      foundSSID = true;
      debug("  * " + ssid + " (RSSI: " + String(rssi) + " dBm) [TARGET]");
    } else if (i < 5) { // Show first 5 networks for reference
      debug("  - " + ssid + " (RSSI: " + String(rssi) + " dBm)");
    }
  }
  if (!foundSSID) {
    debug("WARNING: Target SSID '" + String(WIFI_SSID) + "' not found in scan!");
  }

  debug("Connecting to WiFi: " + String(WIFI_SSID));
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  bool ledState = false;
  unsigned long wifiStartTime = millis();
  const unsigned long wifiTimeout = 60000; // Increased to 60 seconds for slow DHCP
  unsigned long apConnectedTime = 0; // Track when we connect to AP

  int lastStatus = -1;
  while (WiFi.status() != WL_CONNECTED && (millis() - wifiStartTime < wifiTimeout)) {
    wl_status_t status = WiFi.status();
    
    // Log status changes for debugging
    if (status != lastStatus) {
      lastStatus = status;
      String statusStr = "Unknown";
      switch (status) {
        case WL_IDLE_STATUS: statusStr = "Idle"; break;
        case WL_NO_SSID_AVAIL: statusStr = "No SSID Available"; break;
        case WL_SCAN_COMPLETED: statusStr = "Scan Completed"; break;
        case WL_CONNECTED: statusStr = "Connected"; break;
        case WL_CONNECT_FAILED: statusStr = "Connect Failed"; break;
        case WL_CONNECTION_LOST: statusStr = "Connection Lost"; break;
        case WL_DISCONNECTED: statusStr = "Disconnected"; break;
        case WL_NO_SHIELD: statusStr = "No Shield"; break;
        case WL_WRONG_PASSWORD: statusStr = "Wrong Password"; break;
        default: statusStr = "Unknown (" + String(status) + ")"; break;
      }
      debug("WiFi status: " + statusStr + " (" + String(status) + ")");
      
      // Check if we're connected to AP but waiting for IP
      IPAddress currentIP = WiFi.localIP();
      if (status == WL_CONNECTED || (currentIP != IPAddress(0, 0, 0, 0) && currentIP != IPAddress(255, 255, 255, 255))) {
        if (apConnectedTime == 0) {
          apConnectedTime = millis();
          debug("Connected to AP, waiting for DHCP IP assignment...");
        } else {
          unsigned long waitingTime = millis() - apConnectedTime;
          if (waitingTime > 10000 && waitingTime % 5000 < 500) {
            debug("Still waiting for IP... (" + String(waitingTime / 1000) + "s)");
            debug("Current IP: " + currentIP.toString());
          }
        }
      }
    }
    
    delay(500);
    debugInline(".");
    digitalWrite(LED_PIN, ledState ? HIGH : LOW);
    ledState = !ledState;
    yield();
  }

  digitalWrite(LED_PIN, HIGH);

  if (WiFi.status() == WL_CONNECTED) {
    debug("");
    debug("WiFi connected successfully");
    debug("ESP IP address: " + WiFi.localIP().toString());
    debug("Gateway: " + WiFi.gatewayIP().toString());
    debug("Subnet: " + WiFi.subnetMask().toString());
    debug("RSSI: " + String(WiFi.RSSI()) + " dBm");
  } else {
    debug("");
    wl_status_t finalStatus = WiFi.status();
    IPAddress currentIP = WiFi.localIP();
    debug("WiFi connection failed after " + String((millis() - wifiStartTime) / 1000) + " seconds");
    debug("Final status: " + String(finalStatus));
    debug("Current IP: " + currentIP.toString());
    debug("SSID: " + String(WIFI_SSID));
    
    // Additional diagnostics
    if (apConnectedTime > 0) {
      unsigned long dhcpWaitTime = millis() - apConnectedTime;
      debug("Connected to AP but DHCP failed after " + String(dhcpWaitTime / 1000) + " seconds");
      debug("Possible causes: Router DHCP disabled, MAC filtering, or network issue");
    }
    
    debug("Will retry in connectivity check");
  }

  // Initialize tracking baselines
  lastWiFiStatus = WiFi.status();
  lastWiFiTransitionMs = millis();
  if (lastWiFiStatus == WL_CONNECTED) {
    lastReconnectTimeMs = millis();
  }

  // Health check endpoint
  server.on("/health", HTTP_GET, []() {
    if (WiFi.status() == WL_CONNECTED) {
      server.send(200, "text/plain", "healthy");
    } else {
      server.send(503, "text/plain", "unhealthy");
    }
  });

  // Status endpoint with more detailed info
  server.on("/status", HTTP_GET, []() {
    unsigned long now = millis();
    unsigned long lastPostAgeSec = (lastSuccessfulPostMs == 0) ? 0 : (now - lastSuccessfulPostMs) / 1000;
    unsigned long lastWiFiChangeSec = (now - lastWiFiTransitionMs) / 1000;

    String response = "{";
    response += "\"status\":\"" + String(WiFi.status() == WL_CONNECTED ? "healthy" : "unhealthy") + "\",";
    response += "\"wifi\":\"" + String(WiFi.status() == WL_CONNECTED ? "connected" : "disconnected") + "\",";
    response += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
    response += "\"rssi\":" + String(WiFi.RSSI()) + ",";
    response += "\"uptime\":" + String(now / 1000) + ",";
    response += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
    response += "\"server_ip\":\"" + serverIp + "\",";
    response += "\"server_port\":" + String(serverPort) + ",";
    response += "\"free_heap\":" + String(ESP.getFreeHeap()) + ",";
    response += "\"reset_reason\":\"" + String(ESP.getResetReason()) + "\",";
    response += "\"last_post_age_sec\":" + String(lastPostAgeSec) + ",";
    response += "\"last_wifi_change_age_sec\":" + String(lastWiFiChangeSec);
    response += "}";

    server.send(200, "application/json", response);
  });

  server.on("/", HTTP_GET, []() {
    String info = "ESP8266 Sensor Node\n";
    info += "Device ID: " + String(DEVICE_ID) + "\n";
    info += "IP: " + WiFi.localIP().toString() + "\n";
    info += "WiFi: " + String(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected") + "\n";
    info += "RSSI: " + String(WiFi.RSSI()) + " dBm\n";
    info += "Uptime: " + String(millis() / 1000) + " seconds\n";
    info += "FreeHeap: " + String(ESP.getFreeHeap()) + "\n";
    info += "ResetReason: " + String(ESP.getResetReason()) + "\n";
    info += "Server: " + (serverIp == "" ? String("<unset>") : serverIp + ":" + String(serverPort));
    server.send(200, "text/plain", info);
  });

  server.onNotFound([]() {
    server.send(404, "text/plain", "Not Found");
  });

  server.begin();
  debug("Web server started on port 80");
  debug("Health endpoint: http://" + WiFi.localIP().toString() + "/health");

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
  yield();

  // Always try to keep WiFi connected (non-blocking)
  bool wifiOk = checkConnectivityNonBlocking();

  // Check if WiFi just got an IP address (fallback if onWiFiGotIP didn't fire)
  if (WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0)) {
    // WiFi is connected and has an IP, ensure config fetch is triggered
    if (serverIp == "" && !configNeedsFetch) {
      debug("WiFi has IP but config not fetched, triggering config fetch");
      configNeedsFetch = true;
      firstConfigFetchFailureMs = 0; // Clear failure tracking
    }
  }

  // Fetch config if needed (rate-limited)
  if (configNeedsFetch && WiFi.status() == WL_CONNECTED && WiFi.localIP() != IPAddress(0, 0, 0, 0)) {
    unsigned long now = millis();
    if (now - lastConfigFetchAttempt >= configFetchRetryInterval) {
      lastConfigFetchAttempt = now;
      // Initialize failure tracking if this is the first attempt and serverIp is empty
      if (serverIp == "" && firstConfigFetchFailureMs == 0) {
        firstConfigFetchFailureMs = now;
      }
      fetchServerConfig();
      yield();
    }
  }

  // Failsafe restart if config fetch has been failing for too long
  if (serverIp == "" && configNeedsFetch && WiFi.status() == WL_CONNECTED && firstConfigFetchFailureMs != 0) {
    unsigned long sinceFirstFailure = millis() - firstConfigFetchFailureMs;
    if (sinceFirstFailure > maxConfigFetchFailBeforeRestartMs) {
      debug("Failsafe: config fetch failing for too long (" + String(sinceFirstFailure / 1000) + "s). Restarting...");
      delay(100);
      ESP.restart();
    }
  }

  // Failsafe restart if we've gone too long without a successful post
  if (lastSuccessfulPostMs != 0) {
    unsigned long sinceLastPost = millis() - lastSuccessfulPostMs;
    if (sinceLastPost > maxNoPostBeforeRestartMs) {
      debug("Failsafe: no successful post for too long. Restarting...");
      delay(100);
      ESP.restart();
    }
  }

  // Failsafe restart if WiFi has been down for an extended period
  if (WiFi.status() != WL_CONNECTED) {
    unsigned long sinceLastWiFiChange = millis() - lastWiFiTransitionMs;
    if (sinceLastWiFiChange > maxWiFiDownBeforeRestartMs) {
      debug("Failsafe: WiFi down too long. Restarting...");
      delay(100);
      ESP.restart();
    }
  }

  // Run sensor cycle on interval if WiFi is connected (do not gate on probe)
  if (wifiOk && WiFi.status() == WL_CONNECTED) {
    unsigned long now = millis();
    if (now - lastSent >= sendInterval) {
      lastSent = now;
      runSensorCycle();
    }
  }
}
