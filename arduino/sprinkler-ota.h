#include <functional>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
#include <WsConsole.h>

#include "sprinkler.h"

static WsConsole ota_console("ota");

void setupOTA()
{
  ota_console.println("Setup OTA");

  ArduinoOTA.onStart([]() {
    ota_console.println("OTA: Start");
  });
  ArduinoOTA.onEnd([]() {
    ota_console.println("\nOTA: End");
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    ota_console.printf("progress: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) {
    char errormsg[100];
    sprintf(errormsg, "Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR)
      strcpy(errormsg + strlen(errormsg), "Auth Failed");
    else if (error == OTA_BEGIN_ERROR)
      strcpy(errormsg + strlen(errormsg), "Begin Failed");
    else if (error == OTA_CONNECT_ERROR)
      strcpy(errormsg + strlen(errormsg), "Connect Failed");
    else if (error == OTA_RECEIVE_ERROR)
      strcpy(errormsg + strlen(errormsg), "Receive Failed");
    else if (error == OTA_END_ERROR)
      strcpy(errormsg + strlen(errormsg), "End Failed");
    ota_console.error(errormsg);
  });
  ArduinoOTA.setHostname(Sprinkler.hostname().c_str());
  ArduinoOTA.begin();
}

void handleOTA()
{
    ArduinoOTA.handle();
}
