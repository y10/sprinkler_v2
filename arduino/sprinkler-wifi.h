#ifndef SPRINKLER_WIFI_H
#define SPRINKLER_WIFI_H

#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include <WiFiManager.h>
#include <WsConsole.h>

#include "Sprinkler.h"

const uint8_t WIFI_CONFIG_SEC = 180;       // seconds before restart
const uint8_t WIFI_CHECK_SEC = 20;         // seconds
const uint8_t WIFI_RETRY_OFFSET_SEC = 12;  // seconds

static WsConsole wifi_console("wifi");

WiFiManager wifi_manager;

struct WIFI {
  uint8_t counter;
  uint8_t retry_init;
  uint8_t retry;
  uint8_t max_retry;
  uint8_t status;
} Wifi;

inline bool WifiCheck_hasIP(IPAddress const &ip_address) {
#ifdef LWIP2_IPV6
  return !a.isLocal();
#else
  return static_cast<uint32_t>(ip_address) != 0;
#endif
}

void connectWifi() {
  WiFi.persistent(false);  // Solve possible wifi init errors
  if (wifi_manager.autoConnect(Sprinkler.hostname().c_str(), NULL, []() {
      wifi_console.println("connected.");
      Sprinkler.hostname(WiFi.hostname().c_str());
      Sprinkler.save();
    }) == false) {
    wifi_console.println("failed.");
    wifi_console.println("rebooting.");
    ESP.reset();
  }

  WiFi.persistent(false);  // Solve possible wifi init errors
  Wifi.status = WL_CONNECTED;
  Wifi.retry_init = WIFI_RETRY_OFFSET_SEC + (ESP.getChipId() & 0xF);  // Add extra delay to stop overrun by simultanous re-connects
  Wifi.retry = Wifi.retry_init;
  Wifi.max_retry = 0;
  Wifi.counter = 1;
}

void setupWifi() {
  WiFi.setSleepMode(WIFI_NONE_SLEEP);
  WiFi.hostname(Sprinkler.hostname().c_str());
  wifi_manager.setTimeout(120);
  wifi_manager.setDebugOutput(true);
  wifi_console.println("Connecting...");
  connectWifi();
}

void handleWifi() {
  Wifi.counter--;

  if (Wifi.counter <= 0) {
    Wifi.counter = WIFI_CHECK_SEC;

    if ((WL_CONNECTED == WiFi.status()) && WifiCheck_hasIP(WiFi.localIP())) {
      Wifi.counter = WIFI_CHECK_SEC;
      Wifi.retry = Wifi.retry_init;
      Wifi.max_retry = 0;
      if (Wifi.status != WL_CONNECTED) {
        wifi_console.println("Connected");
      }
      Wifi.status = WL_CONNECTED;
    } else {
      switch (Wifi.status) {
        case WL_CONNECTED:
          wifi_console.println("Disconected No IP");
          Wifi.status = 0;
          Wifi.retry = Wifi.retry_init;
          break;
        case WL_NO_SSID_AVAIL:
          wifi_console.println("Disconected No AP reached");
          if (Wifi.retry > (Wifi.retry_init / 2)) {
            Wifi.retry = Wifi.retry_init / 2;
          } else if (Wifi.retry) {
            Wifi.retry = 0;
          }
          break;
        case WL_CONNECT_FAILED:
          wifi_console.println("Connect to AP failed due to the wrong password");
          if (Wifi.retry > (Wifi.retry_init / 2)) {
            Wifi.retry = Wifi.retry_init / 2;
          } else if (Wifi.retry) {
            Wifi.retry = 0;
          }
          break;
        default:  // WL_IDLE_STATUS and WL_DISCONNECTED
          if (!Wifi.retry || ((Wifi.retry_init / 2) == Wifi.retry)) {
            wifi_console.println("Connect to AP failed due to timeout");
            Wifi.max_retry++;
            if (100 == Wifi.max_retry) {  // Restart after 100 * (WIFI_RETRY_OFFSET_SEC + MAC) / 2 seconds
              wifi_console.println("Restarting...");
              ESP.restart();
            }
          }
      }

      if (Wifi.retry) {
        wifi_console.println("Reconnecting...");
        connectWifi();
      }
    }
  }
}

#endif
