/**************************************************************
 * WiFiManager is a library for the ESP8266/Arduino platform
 * (https://github.com/esp8266/Arduino) to enable easy 
 * configuration and reconfiguration of WiFi credentials and 
 * store them in EEPROM.
 * inspired by http://www.esp8266.com/viewtopic.php?f=29&t=2520
 * https://github.com/chriscook8/esp-arduino-apboot 
 * Built by AlexT https://github.com/tzapu
 * Licensed under MIT license
 **************************************************************/

#ifndef SPRINKLER_WIFI_MNG_H
#define SPRINKLER_WIFI_MNG_H

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <DNSServer.h>
#include <memory>

#include "../../includes/files.h"

typedef enum {
    WM_CONNECT_FAILED   = 0,
    WM_FIRST_TIME_CONNECTED = 1,
    WM_CONNECTED  = 2
} wm_status_t;

class WiFiManager
{
public:
    WiFiManager();
        
    wm_status_t autoConnect();
    wm_status_t autoConnect(char const *apName);
    wm_status_t autoConnect(char const *apName, char const *apPasswd);

    String  getDeviceName();
    String  getFriendlyName();
    String  setFriendlyName(char const *name);

    String  getSSID();
    String  getPassword();

    void    resetSettings();
    //for convenience
    String  urldecode(const char*);

    //sets timeout before webserver loop ends and exits even if there has been no setup. 
    //usefully for devices that failed to connect at some point and got stuck in a webserver loop
    //in seconds
    void    setTimeout(unsigned long seconds);
    void    setDebugOutput(boolean debug);

    //sets a custom ip /gateway /subnet configuration
    void    setAPConfig(IPAddress ip, IPAddress gw, IPAddress sn);
    void    setAPCallback( void (*func)(void) );    
 
private:
    std::unique_ptr<DNSServer> dnsServer;
    std::unique_ptr<ESP8266WebServer> server;

    const int WM_DONE = 0;
    const int WM_WAIT = 10;

    void    begin();
    void    begin(char const *apName);
    void    begin(char const *apName, char const *apPasswd);
    
    int         _eepromStart;
    String      _apName = "no-net";
    const char* _apPasswd = NULL;
    String      _ssid = "";
    String      _pass = "";
    unsigned long timeout = 0;
    unsigned long start = 0;
    IPAddress   _ip;
    IPAddress   _gw;
    IPAddress   _sn;
    
    String getEEPROMString(int start, int len);
    void setEEPROMString(int start, int len, String string);

    bool keepLooping = true;
    int status = WL_IDLE_STATUS;
    void connectWifi(String ssid, String pass);

    void handleRoot();
    void handleHostInfo();
    void handleWifiScan();
    void handleRootPost();
    void handleNotFound();
    void handle204();
    boolean captivePortal();
    
    // DNS server
    const byte DNS_PORT = 53;

    //helpers
    int getRSSIasQuality(int RSSI);
    boolean isIp(String str);
    String toStringIp(IPAddress ip);

    boolean connect;
    boolean _debug = false;

    void (*_apcallback)(void) = NULL;

    template <typename Generic>
    void DEBUG_PRINT(Generic text);
};

#endif
