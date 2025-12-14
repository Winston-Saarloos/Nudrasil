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

// Build moisture sensor array from configuration
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

// --- Timers ---
unsigned long lastSent = 0;
const unsigned long sendInterval = (60 * 1000) * 10;
unsigned long lastConnectivityCheck = 0;
const unsigned long connectivityCheckInterval = 10000;

// --- Debug Mode ---
const bool debugMode = true;
template <typename T> void debug(const T& msg) { if (debugMode) Serial.println(msg); }
template <typename T> void debugInline(const T& msg) { if (debugMode) Serial.print(msg); }

// --- WiFi Event Handlers ---
void onWiFiConnected(const WiFiEventStationModeConnected& evt) {
  debug("WiFi connected to: " + String(evt.ssid));
  debug("Channel: " + String(evt.channel));
  digitalWrite(LED_PIN, HIGH); // Turn off LED
}

void onWiFiGotIP(const WiFiEventStationModeGotIP& evt) {
  debug("WiFi IP: " + evt.ip.toString());
  debug("Gateway: " + evt.gw.toString());
  debug("RSSI: " + String(WiFi.RSSI()) + " dBm");
}

void onWiFiDisconnected(const WiFiEventStationModeDisconnected& evt) {
  debug("WiFi disconnected. Reason: " + String(evt.reason));
  debug("Attempting to reconnect...");
  // LED will flash during reconnection in checkConnectivity
}

// --- Connectivity Check ---
bool checkConnectivity() {
  unsigned long now = millis();
  if (now - lastConnectivityCheck < connectivityCheckInterval) {
    // Quick check - just verify WiFi is still connected
    return WiFi.status() == WL_CONNECTED;
  }
  lastConnectivityCheck = now;

  // First check if WiFi is connected
  if (WiFi.status() != WL_CONNECTED) {
    debug("WiFi not connected, attempting reconnection...");
    WiFi.disconnect();
    delay(100);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    unsigned long start = millis();
    bool ledState = false;
    while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
      delay(500);
      debugInline(".");
      // Flash LED while connecting
      digitalWrite(LED_PIN, ledState ? HIGH : LOW);
      ledState = !ledState;
      yield(); // Allow other tasks
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      digitalWrite(LED_PIN, HIGH); // Turn off LED
      debug("");
      debug("WiFi reconnected. RSSI: " + String(WiFi.RSSI()) + " dBm");
      return true;
    } else {
      digitalWrite(LED_PIN, HIGH);
      debug("");
      debug("WiFi reconnection failed");
      return false;
    }
  }

  // WiFi is connected, do a quick probe if server IP is configured
  // Skip probe if we just reconnected (avoid immediate failure)
  static unsigned long lastReconnectTime = 0;
  unsigned long timeSinceReconnect = millis() - lastReconnectTime;
  
  if (serverIp != "" && timeSinceReconnect > 5000) { // Wait 5 seconds after reconnect
    HTTPClient http;
    WiFiClient client;
    http.setTimeout(3000); // 3 second timeout
    String probeUrl = "http://app.nudrasil.com/api/probe";
    
    if (http.begin(client, probeUrl)) {
      int code = http.GET();
      http.end();

      if (code == 200) {
        return true;
      } else {
        // Probe failed but WiFi is still connected - don't disconnect
        // Just log it and return false for this check
        // Only log occasionally to avoid spam
        static unsigned long lastProbeFailLog = 0;
        if (millis() - lastProbeFailLog > 30000) { // Log once every 30 seconds
          debug("Probe failed (HTTP " + String(code) + ") but WiFi still connected");
          lastProbeFailLog = millis();
        }
        return false;
      }
    } else {
      http.end();
      return false;
    }
  }
  
  // Update reconnect time if we just connected
  if (WiFi.status() == WL_CONNECTED) {
    static wl_status_t lastStatus = WL_DISCONNECTED;
    if (lastStatus != WL_CONNECTED) {
      lastReconnectTime = millis();
    }
    lastStatus = WL_CONNECTED;
  }

  return true;
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
  
  if (!doc["success"].as<bool>()) {
    debug("Config fetch returned success: false");
    http.end();
    return;
  }
  
  JsonArray dataArray = doc["value"]["data"];
  if (dataArray.size() == 0) {
    debug("No device config data found");
    http.end();
    return;
  }
  
  JsonObject deviceConfig = dataArray[0]["config"];
  String defaultEnv = deviceConfig["defaultEnv"] | "prod";
  JsonObject env = deviceConfig["environments"][defaultEnv];
  
  serverIp = env["ip"].as<String>();
  serverPort = env["port"].as<int>();
  
  debug("Parsed server config: " + serverIp + ":" + String(serverPort));
  http.end();
}

// --- POST Sensor Data ---
void postSensorData(float tempC, float humidity, int* moistureValues, int light) {
  if (serverIp == "") {
    debug("Cannot post: serverIp is empty");
    return;
  }

  String url = "http://" + serverIp + ":" + String(serverPort) + "/api/sensor";
  debug("POST target URL: " + url);

  WiFiClient client;
  HTTPClient http;

  // Build sensor list dynamically based on configuration
  struct Sensor {
    const char* name;
    float value;
    bool enabled;
  };

  // Count enabled sensors to allocate array
  int sensorCount = 0;
  #if MOISTURE_SENSOR_COUNT > 0
  sensorCount += MOISTURE_SENSOR_COUNT;
  #endif
  if (strlen(TEMP_SENSOR_NAME) > 0) sensorCount++;
  if (strlen(HUMIDITY_SENSOR_NAME) > 0) sensorCount++;
  #if ENABLE_LUX_SENSOR
  if (strlen(LUX_SENSOR_NAME) > 0) sensorCount++;
  #endif

  Sensor sensors[10]; // Max 10 sensors
  int idx = 0;

  // Add temperature sensor if configured and value is valid
  if (strlen(TEMP_SENSOR_NAME) > 0 && !isnan(tempC)) {
    sensors[idx++] = { TEMP_SENSOR_NAME, tempC, true };
  }

  // Add humidity sensor if configured and value is valid
  if (strlen(HUMIDITY_SENSOR_NAME) > 0 && !isnan(humidity)) {
    sensors[idx++] = { HUMIDITY_SENSOR_NAME, humidity, true };
  }

  // Add moisture sensors if configured
  #if MOISTURE_SENSOR_COUNT > 0
  for (int i = 0; i < MOISTURE_SENSOR_COUNT; i++) {
    if (strlen(moistureSensors[i].name) > 0) {
      sensors[idx++] = { moistureSensors[i].name, static_cast<float>(moistureValues[i]), true };
    }
  }
  #endif

  // Add lux sensor if configured
  #if ENABLE_LUX_SENSOR
  if (strlen(LUX_SENSOR_NAME) > 0 && light >= 0) {
    sensors[idx++] = { LUX_SENSOR_NAME, static_cast<float>(light), true };
  }
  #endif

  // Post all enabled sensors with retry logic
  for (int i = 0; i < idx; i++) {
    String payload = String("{\"sensor\":\"") + sensors[i].name + "\",\"value\":" + sensors[i].value + "}";
    debug("Sending payload: " + payload);

    bool success = false;
    int retries = 3;
    
    for (int attempt = 0; attempt < retries && !success; attempt++) {
      // Check WiFi status before each attempt
      if (WiFi.status() != WL_CONNECTED) {
        debug("WiFi disconnected, waiting for reconnection...");
        unsigned long waitStart = millis();
        while (WiFi.status() != WL_CONNECTED && (millis() - waitStart < 5000)) {
          delay(100);
          yield();
        }
        if (WiFi.status() != WL_CONNECTED) {
          debug("WiFi not available, skipping this sensor");
          break;
        }
      }

      // Create new client for each attempt
      WiFiClient client;
      HTTPClient http;
      http.setTimeout(5000); // 5 second timeout
      http.begin(client, url);
      http.addHeader("Content-Type", "application/json");

      int status = http.POST(payload);
      
      if (status > 0) {
        String response = http.getString();
        debug("POST response code: " + String(status));
        debug("POST response body: " + response);
        success = true;
      } else {
        if (attempt < retries - 1) {
          debug("POST failed (HTTP " + String(status) + "), retrying... (" + String(attempt + 1) + "/" + String(retries) + ")");
          delay(500); // Wait before retry
        } else {
          debug("POST failed with error: " + http.errorToString(status));
        }
      }

      http.end();
      yield(); // Allow other tasks
    }
    
    if (!success) {
      debug("Failed to post sensor: " + String(sensors[i].name));
    }
  }
}

// --- Sensor Cycle ---
void runSensorCycle() {
  debug("Send interval reached");
  
  // Ensure WiFi is connected before proceeding
  if (WiFi.status() != WL_CONNECTED) {
    debug("WiFi not connected, skipping sensor cycle");
    return;
  }

  float tempC = NAN;
  float hum = NAN;

  // --- Read DHT22 (if configured) ---
  if (strlen(TEMP_SENSOR_NAME) > 0 || strlen(HUMIDITY_SENSOR_NAME) > 0) {
    debug("Reading DHT22");
    yield();
    tempC = dht.readTemperature();
    hum = dht.readHumidity();
    yield();

    if (isnan(tempC) || isnan(hum)) {
      debug("DHT22 read failed. Temp: " + String(tempC) + ", Humidity: " + String(hum));
      // Continue with other sensors even if DHT22 fails
    } else {
      debug("DHT22 values: Temp = " + String(tempC) + " C, Humidity = " + String(hum) + " %");
    }
  }

  // --- Read soil moisture sensors (if configured) ---
  int moistureValues[4] = {0}; // Support up to 4 moisture sensors
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

  // --- Read TSL2561 (if configured) ---
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

  postSensorData(tempC, hum, moistureValues, light);
  debug("Sensor data posted successfully");
}

void setup() {
  Serial.begin(115200);
  
  // Initialize DHT22 only if temp or humidity sensor is configured
  if (strlen(TEMP_SENSOR_NAME) > 0 || strlen(HUMIDITY_SENSOR_NAME) > 0) {
    dht.begin();
  }
  
  // Initialize I2C with internal pull-ups enabled (automatic on ESP8266)
  // ADS1115 can run on 3.3V (VDD to 3.3V, GND to ground)
  Wire.begin(D2, D1);
  // Internal pull-ups are automatically enabled, but they're weak (30-100kΩ)
  // For better reliability with longer wires or multiple devices, add external 4.7kΩ resistors
  delay(100); // Give I2C time to initialize
  
  // Initialize ADS1115 only if moisture sensors are configured
  #if MOISTURE_SENSOR_COUNT > 0
  debug("Initializing ADS1115...");
  debug("I2C pins: SDA=D2 (GPIO4), SCL=D1 (GPIO5)");
  
  // Try to initialize with different addresses
  // ADDR pin connections determine address:
  // GND = 0x48, VDD = 0x49, SDA = 0x4A, SCL = 0x4B
  uint8_t addresses[] = {0x48, 0x49, 0x4A, 0x4B};
  const char* addrNames[] = {"0x48 (ADDR to GND)", "0x49 (ADDR to VDD)", "0x4A (ADDR to SDA)", "0x4B (ADDR to SCL)"};
  
  ads = new Adafruit_ADS1115();
  
  // Set slower I2C clock for initialization to be more reliable
  Wire.setClock(100000);
  
  for (int i = 0; i < 4; i++) {
    debug("Trying ADS1115 at address " + String(addrNames[i]) + "...");
    yield(); // Allow other tasks
    
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
    delay(10); // Small delay between attempts
  }
  
  // Reset to normal I2C clock speed
  Wire.setClock(400000);
  
  if (!adsInitialized) {
    delete ads;
    ads = nullptr;
    debug("ADS1115 initialization failed!");
    debug("Moisture sensor readings will be skipped.");
  }
  #endif

  // TSL2561 Init
  #if ENABLE_LUX_SENSOR
  if (!tsl.begin()) {
    debug("TSL2561 not found");
  } else {
    tsl.enableAutoRange(true);
    tsl.setIntegrationTime(TSL2561_INTEGRATIONTIME_402MS);
    debug("TSL2561 initialized");
  }
  #endif

  // Initialize onboard LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH); // Start with LED off (HIGH = off for active LOW LED)

  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  WiFi.mode(WIFI_STA);
  
  // Disable WiFi power saving mode for better stability
  WiFi.setSleepMode(WIFI_NONE_SLEEP);
  
  // Set WiFi output power (0-20.5 dBm, default is 20.5)
  WiFi.setOutputPower(20.5);
  
  // Set hostname for easier identification
  WiFi.hostname("nodemcu-sensor");
  
  // Configure WiFi to be more aggressive about maintaining connection
  WiFi.setPhyMode(WIFI_PHY_MODE_11N); // Use 802.11n for better stability
  
  // Register WiFi event handlers
  static WiFiEventHandler onConnectedHandler = WiFi.onStationModeConnected(onWiFiConnected);
  static WiFiEventHandler onGotIPHandler = WiFi.onStationModeGotIP(onWiFiGotIP);
  static WiFiEventHandler onDisconnectedHandler = WiFi.onStationModeDisconnected(onWiFiDisconnected);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  debug("Connecting to WiFi...");
  bool ledState = false;
  unsigned long wifiStartTime = millis();
  const unsigned long wifiTimeout = 30000; // 30 second timeout
  
  while (WiFi.status() != WL_CONNECTED && (millis() - wifiStartTime < wifiTimeout)) {
    delay(500);
    debugInline(".");
    // Flash LED while connecting
    digitalWrite(LED_PIN, ledState ? HIGH : LOW);
    ledState = !ledState;
    yield(); // Allow other tasks to run
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    // Turn off LED when connected (HIGH = LED off for active LOW LED)
    digitalWrite(LED_PIN, HIGH);
    debug("");
    debug("WiFi connected successfully");
    debug("ESP IP address: " + WiFi.localIP().toString());
    debug("RSSI: " + String(WiFi.RSSI()) + " dBm");
  } else {
    digitalWrite(LED_PIN, HIGH);
    debug("");
    debug("WiFi connection failed after " + String((millis() - wifiStartTime) / 1000) + " seconds");
    debug("Will retry in connectivity check");
  }

  // Health check endpoint - returns simple "healthy" for dashboard compatibility
  server.on("/health", HTTP_GET, []() {
    // Dashboard expects simple "healthy" text response
    if (WiFi.status() == WL_CONNECTED) {
      server.send(200, "text/plain", "healthy");
    } else {
      server.send(503, "text/plain", "unhealthy");
    }
  });
  
  // Status endpoint with detailed JSON info (optional)
  server.on("/status", HTTP_GET, []() {
    String response = "{\"status\":\"" + String(WiFi.status() == WL_CONNECTED ? "healthy" : "unhealthy") + "\",";
    response += "\"wifi\":\"" + String(WiFi.status() == WL_CONNECTED ? "connected" : "disconnected") + "\",";
    response += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
    response += "\"rssi\":" + String(WiFi.RSSI()) + ",";
    response += "\"uptime\":" + String(millis() / 1000) + ",";
    response += "\"device_id\":\"" + String(DEVICE_ID) + "\"";
    response += "}";
    server.send(200, "application/json", response);
  });
  
  // Root endpoint for basic info
  server.on("/", HTTP_GET, []() {
    String info = "ESP8266 Sensor Node\n";
    info += "Device ID: " + String(DEVICE_ID) + "\n";
    info += "IP: " + WiFi.localIP().toString() + "\n";
    info += "WiFi: " + String(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected") + "\n";
    info += "RSSI: " + String(WiFi.RSSI()) + " dBm\n";
    info += "Uptime: " + String(millis() / 1000) + " seconds";
    server.send(200, "text/plain", info);
  });
  
  // 404 handler for unknown routes
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
  
  // Always handle server requests, even if connectivity check fails
  // This ensures health endpoint is always accessible
  server.handleClient();
  yield(); // Allow other tasks

  // Only run sensor cycle if connectivity is good
  if (checkConnectivity()) {
    unsigned long now = millis();
    if (now - lastSent >= sendInterval) {
      lastSent = now;
      runSensorCycle();
    }
  }
}
