#ifndef SPRINKLER_WIFI_H
#define SPRINKLER_WIFI_H

#include <ESP8266WiFi.h>          
#include <ESP8266mDNS.h>
#include <WifiManager.h>
#include <WsConsole.h>

#include "Sprinkler.h"

static WsConsole wifi_console("wifi");

WiFiManager wifi_manager;

void setupWifi()
{
    WiFi.setSleepMode(WIFI_NONE_SLEEP);  
    WiFi.hostname(Sprinkler.hostname().c_str());
    wifi_manager.setTimeout(120);

    wm_status_t status = wifi_manager.autoConnect(Sprinkler.hostname().c_str());
    switch (status)
    {
    case WM_FIRST_TIME_CONNECTED:
        wifi_console.println("connected.");
        Sprinkler.hostname(WiFi.hostname().c_str());
        Sprinkler.save();
        wifi_console.println("rebooting.");
        ESP.reset();
        break;
    case WM_CONNECT_FAILED:
        wifi_console.println("failed.");
        wifi_console.println("rebooting.");
        ESP.reset();
        return;
    }
}

#endif
