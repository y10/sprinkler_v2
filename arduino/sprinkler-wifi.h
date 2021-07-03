#ifndef SPRINKLER_WIFI_H
#define SPRINKLER_WIFI_H

#include <ESP8266WiFi.h>          
#include <ESP8266mDNS.h>
#include <WifiManager.h>
#include <WsConsole.h>

#include "Sprinkler.h"

static WsConsole wifi_console("wifi");

WiFiManager wifiManager;

void setupWifi()
{
    wifiManager.setFriendlyName(Sprinkler.dispname().c_str());

    WiFi.setSleepMode(WIFI_NONE_SLEEP);  
    WiFi.hostname(Sprinkler.hostname().c_str());
    
    wm_status_t status = wifiManager.autoConnect(Sprinkler.hostname().c_str());
    switch (status)
    {
    case WM_FIRST_TIME_CONNECTED:
        Sprinkler.hostname(wifiManager.getDeviceName().c_str());
        Sprinkler.dispname(wifiManager.getFriendlyName().c_str());
        Sprinkler.save();
        wifi_console.println("connected to Wifi.");
        wifi_console.println("resetting.");
        ESP.reset();
        break;
    case WM_CONNECT_FAILED:
        wifi_console.println("failed to connect and hit timeout.");
        ESP.reset();
        return;
    }

    //if you get here you have connected to the WiFi
    
}

#endif
