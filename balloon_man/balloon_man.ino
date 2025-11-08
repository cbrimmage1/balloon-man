#include "secret.hpp"  //wifi details

#include <WiFiNINA.h>
#include <WebSocketClient.h>
#include <ArduinoJson.h>

char ssid[] = SECRET_SSID;  // WIFI network SSID (name)
char pass[] = SECRET_PASS;  // WIFI network password

// WebSocket server
const char* websocket_server = "balloon-man.onrender.com";  // render server name
const int websocket_port = 443;                             // SSL port for wss://

// pin definitions
int motorPump = 9;
int valve = 10;
int motorSuck = 11;

// WebSocket client (use WiFiSSLClient for SSL/TLS)
WiFiSSLClient wifiClient;
WebSocketClient wsClient = WebSocketClient(wifiClient, websocket_server, websocket_port);

// air pump states
bool pumpState = false;
bool suckState = false;

// connection tracking
unsigned long lastReconnectAttempt = 0;
const unsigned long reconnectInterval = 5000;

// "keepalive" tracking
unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 30000;  // Send heartbeat every 30 seconds

void setup() {
  Serial.begin(9600);
  /* while (!Serial) { */
  /*   ; // Wait for serial port to connect */
  /* } */

  // setup pins
  pinMode(motorPump, OUTPUT);
  pinMode(valve, OUTPUT);
  pinMode(motorSuck, OUTPUT);

  // initialize motors to off
  digitalWrite(motorPump, LOW);
  digitalWrite(valve, LOW);
  digitalWrite(motorSuck, LOW);

  // connect to wifi
  connectWiFi();

  // Connect to WebSocket server
  connectWebSocket();
}

void loop() {
  if (wsClient.connected()) {  // check if connected to websocket client

    // check for incoming messages
    int messageSize = wsClient.parseMessage();
    if (messageSize > 0) {  //if we have a message, do the following ~
      Serial.print("Incoming message size: ");
      Serial.println(messageSize);

      String message = "";                 //start with an empty string
      while (wsClient.available()) {       //while there are messages to read
        message += (char)wsClient.read();  //read the message and concatenate to message string
      }

      if (message.length() > 0) {  //if there's anything in the message (aka anything greater than 0)
        handleMessage(message);    //call our helper fuction to parse the message
      }
    }


    // send heartbeat every 'x' seconds (refer to line 33) to keep connection alive
    if (millis() - lastHeartbeat > heartbeatInterval) {
      Serial.println("Sending heartbeat ping...");
      wsClient.beginMessage(TYPE_TEXT);
      wsClient.print("{\"type\":\"ping\"}");  //sends {"type":"ping"} to the server (not broadcasted to clients)
      wsClient.endMessage();
      lastHeartbeat = millis();
    }

  } else {
    // try to reconnect if disconnected
    Serial.print("Connection status: ");
    Serial.println(wsClient.connected() ? "Connected" : "Disconnected");
    if (millis() - lastReconnectAttempt > reconnectInterval) {
      Serial.println("WebSocket disconnected, reconnecting...");
      connectWebSocket();
      lastReconnectAttempt = millis();
    }
  }

  delay(10);
}

// handles connecting to wifi
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  while (WiFi.begin(ssid, pass) != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);
  }

  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// handles connecting to the socket server
void connectWebSocket() {
  Serial.print("Connecting to WebSocket server: ");
  Serial.print(websocket_server);
  Serial.print(":");
  Serial.println(websocket_port);

  wsClient.begin();

  if (wsClient.connected()) {
    Serial.println("WebSocket connected!");
    lastHeartbeat = millis();  // reset heartbeat timer on new connection
  } else {
    Serial.println("WebSocket connection failed!");
  }
}

//help function to parse the message from the server
//called whenever a message is received
void handleMessage(String message) {
  Serial.print("Received: ");
  Serial.println(message);

  // parse JSON using ArduinoJson
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.print("JSON parsing failed: ");
    Serial.println(error.c_str());
    return;
  }

  // extract the "type" field of the incoming data
  const char* type = doc["type"];

  // check for "initialState" message
  String typeStr = String(type);    //typecast the char* to a string for comparision
  if (typeStr == "initialState") {  //all the data
    if (doc["state"].containsKey("inflateOn")) {
      pumpState = doc["state"]["inflateState"];  //update inflate state to match server state
      digitalWrite(motorPump, LOW);
      digitalWrite(valve, LOW);
      digitalWrite(motorSuck, HIGH);
      delay(3000);
      Serial.print("Initial Motor Pump state: ");
      Serial.println(pumpState ? "ON" : "OFF");
    }

    if (doc["state"].containsKey("deflateOn")) {
      suckState = doc["state"]["deflateState"];  //update deflate state to match server state
      digitalWrite(motorPump, HIGH);
      digitalWrite(valve, HIGH);
      digitalWrite(motorSuck, LOW);
      delay(3000);
      Serial.print("Initial Deflate Pump state: ");
      Serial.println(suckState ? "ON" : "OFF");
    }


  }


  // check for pumpState message
  else if (typeStr == "pumpState") {
    pumpState = doc["value"];                         //parse the motor pump state from the returned json.
    digitalWrite(motorPump, pumpState ? HIGH : LOW);  //toggle the motor pump value accordingly
    Serial.print("Motor Pump toggled to: ");
    Serial.println(pumpState ? "ON" : "OFF");
  }

  // Check for suckState message
  else if (typeStr == "suckState") {
    suckState = doc["value"];                         //parse the motor suck state from the returned json.
    digitalWrite(motorSuck, suckState ? HIGH : LOW);  //toggle the motor suck value accordingly
    Serial.print("Motor Suck toggled to: ");
    Serial.println(suckState ? "ON" : "OFF");
  }

}