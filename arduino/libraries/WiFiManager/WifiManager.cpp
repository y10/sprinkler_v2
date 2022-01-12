/**************************************************************
 * WiFiManager is a library for the ESP8266/Arduino platform
 * (https://github.com/esp8266/Arduino) to enable easy
 * configuration and reconfiguration of WiFi credentials and
 * store them in EEPROM.
 * inspired by: 
 * http://www.esp8266.com/viewtopic.php?f=29&t=2520
 * https://github.com/chriscook8/esp-arduino-apboot
 * https://github.com/esp8266/Arduino/tree/esp8266/hardware/esp8266com/esp8266/libraries/DNSServer/examples/CaptivePortalAdvanced
 * Built by AlexT https://github.com/tzapu
 * Licensed under MIT license
 **************************************************************/

#include "WiFiManager.h"

WiFiManager::WiFiManager()
{
}

void WiFiManager::begin()
{
  begin("NoNetESP");
}

void WiFiManager::begin(char const *apName)
{
  begin(apName, NULL);
}

void WiFiManager::begin(char const *apName, char const *apPasswd)
{
  dnsServer.reset(new DNSServer());
  server.reset(new ESP8266WebServer(80));

  DEBUG_PRINT(F(""));
  _apName = apName;
  _apPasswd = apPasswd;
  start = millis();

  DEBUG_PRINT(F("Configuring access point... "));
  if (_apPasswd != NULL)
  {
    if (strlen(_apPasswd) < 8 || strlen(_apPasswd) > 63)
    {
      // fail passphrase to short or long!
      DEBUG_PRINT(F("Invalid AccessPoint password"));
    }
    DEBUG_PRINT(_apPasswd);
  }

  //optional soft ip config
  if (_ip)
  {
    DEBUG_PRINT(F("Custom IP/GW/Subnet"));
    WiFi.softAPConfig(_ip, _gw, _sn);
  }

  if (_apPasswd != NULL)
  {
    WiFi.softAP(_apName, _apPasswd); //password option
  }
  else
  {
    WiFi.softAP(_apName);
  }

  delay(500); // Without delay I've seen the IP address blank
  DEBUG_PRINT(F("AP IP address: "));
  DEBUG_PRINT(WiFi.softAPIP());

  
  dnsServer->setErrorReplyCode(DNSReplyCode::NoError);
  dnsServer->start(DNS_PORT, "*", WiFi.softAPIP());

  server->on("/", HTTP_GET, std::bind(&WiFiManager::handleRoot, this));
  server->on("/", HTTP_POST, std::bind(&WiFiManager::handleRootPost, this));
  server->on("/info", HTTP_GET, std::bind(&WiFiManager::handleHostInfo, this));
  server->on("/scan", HTTP_GET, std::bind(&WiFiManager::handleWifiScan, this));
  server->on("/generate_204", std::bind(&WiFiManager::handle204, this)); //Android/Chrome OS captive portal check.
  server->on("/fwlink", std::bind(&WiFiManager::handleRoot, this));      //Microsoft captive portal. Maybe not needed. Might be handled by notFound handler.
  server->onNotFound(std::bind(&WiFiManager::handleNotFound, this));
  server->begin(); // Web server start
  DEBUG_PRINT(F("HTTP server started"));
}

bool WiFiManager::autoConnect()
{
  String ssid = "ESP" + String(ESP.getChipId());
  return autoConnect(ssid.c_str(), NULL, NULL);
}

bool WiFiManager::autoConnect(char const *apName)
{
  return autoConnect(apName, NULL, NULL);
}

bool WiFiManager::autoConnect(char const *apName, char const *apPasswd)
{
  return autoConnect(apName, NULL, NULL);
}

bool WiFiManager::autoConnect(char const *apName, std::function<void()> onConnected)
{
  return autoConnect(apName, NULL, onConnected);
}

bool WiFiManager::autoConnect(char const *apName, char const *apPasswd, std::function<void()> onConnected)
{
  DEBUG_PRINT(F(""));
  DEBUG_PRINT(F("AutoConnect"));
  String ssid = getSSID();
  String pass = getPassword();
  WiFi.mode(WIFI_STA);
  connectWifi(ssid, pass);
  if (WiFi.status() == WL_CONNECTED)
  {
    DEBUG_PRINT(F("IP Address:"));
    DEBUG_PRINT(WiFi.localIP());

    return WM_CONNECTED;
  }

  WiFi.mode(WIFI_AP);
  connect = false;
  begin(apName, apPasswd);

  bool looping = true;
  while (timeout == 0 || millis() < start + timeout)
  {
    //DNS
    dnsServer->processNextRequest();
    //HTTP
    server->handleClient();

    if (connect)
    {
      delay(2000);
      DEBUG_PRINT("Connecting to new AP as " + _apName);
      connect = false;
      WiFi.hostname(_apName.c_str());
      connectWifi(_ssid, _pass);
      int s = WiFi.status();
      if (s == WL_CONNECTED)
      {
        WiFi.mode(WIFI_STA);
        server.reset();
        dnsServer.reset();
        if (onConnected)
          onConnected();
      }
      else
      {
        DEBUG_PRINT(F("Failed to connect."));
      }
    }
    yield();
  }

  server.reset();
  dnsServer.reset();
  return WiFi.status() == WL_CONNECTED ? WM_CONNECTED : WM_CONNECT_FAILED;
}

void WiFiManager::connectWifi(String ssid, String pass)
{
  DEBUG_PRINT(F("Connecting as wifi client..."));
  WiFi.begin(ssid.c_str(), pass.c_str());
  int connRes = WiFi.waitForConnectResult();
  DEBUG_PRINT("Connection result: ");
  DEBUG_PRINT(connRes);
}

String WiFiManager::getSSID()
{
  if (_ssid == "")
  {
    DEBUG_PRINT(F("Reading SSID"));
    _ssid = WiFi.SSID();
    DEBUG_PRINT(F("SSID: "));
    DEBUG_PRINT(_ssid);
  }
  return _ssid;
}

String WiFiManager::getPassword()
{
  if (_pass == "")
  {
    DEBUG_PRINT(F("Reading Password"));
    _pass = WiFi.psk(); 
    DEBUG_PRINT("Password: " + _pass);
  }
  return _pass;
}

String WiFiManager::urldecode(const char *src)
{
  String decoded = "";
  char a, b;
  while (*src)
  {
    if ((*src == '%') &&
        ((a = src[1]) && (b = src[2])) &&
        (isxdigit(a) && isxdigit(b)))
    {
      if (a >= 'a')
        a -= 'a' - 'A';
      if (a >= 'A')
        a -= ('A' - 10);
      else
        a -= '0';
      if (b >= 'a')
        b -= 'a' - 'A';
      if (b >= 'A')
        b -= ('A' - 10);
      else
        b -= '0';

      decoded += char(16 * a + b);
      src += 3;
    }
    else if (*src == '+')
    {
      decoded += ' ';
      *src++;
    }
    else
    {
      decoded += *src;
      *src++;
    }
  }
  decoded += '\0';

  return decoded;
}

void WiFiManager::resetSettings()
{
  DEBUG_PRINT(F("settings invalidated"));
  DEBUG_PRINT(F("THIS MAY CAUSE AP NOT TO STRT UP PROPERLY. YOU NEED TO COMMENT IT OUT AFTER ERASING THE DATA."));
  WiFi.disconnect(true);
  delay(200);
}

void WiFiManager::setTimeout(unsigned long seconds)
{
  timeout = seconds * 1000;
}

void WiFiManager::setDebugOutput(boolean debug)
{
  _debug = debug;
}

void WiFiManager::setAPConfig(IPAddress ip, IPAddress gw, IPAddress sn)
{
  _ip = ip;
  _gw = gw;
  _sn = sn;
}

void WiFiManager::handleRoot()
{
  DEBUG_PRINT(F("Handle root"));
  if (captivePortal())
  { // If caprive portal redirect instead of displaying the page.
    return;
  }

  server->sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server->sendHeader("Pragma", "no-cache");
  server->sendHeader("Expires", "-1");
  server->setContentLength(sizeof(SKETCH_SETUP_HTML_GZ));
  server->sendHeader("Content-Encoding", "gzip");
  server->send_P(200, "text/html", (const char*)SKETCH_SETUP_HTML_GZ, sizeof(SKETCH_SETUP_HTML_GZ));

  server->client().stop(); // Stop is needed because we sent no content length
}

void WiFiManager::handleHostInfo()
{
  server->sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server->sendHeader("Pragma", "no-cache");
  server->sendHeader("Expires", "-1");
  server->send(200, "application/json", "{ \"name\": \"" + _apName + "\" }"); 
  server->client().stop();

  DEBUG_PRINT(F("Sent info"));
}

void WiFiManager::handleWifiScan()
{
  server->sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server->sendHeader("Pragma", "no-cache");
  server->sendHeader("Expires", "-1");
  
  int n = WiFi.scanNetworks();
  String content = "[";
  DEBUG_PRINT(F("Scan done"));
  if (n == 0)
  {
    DEBUG_PRINT(F("No networks found"));
  }
  else
  {
    for (int i = 0; i < n; ++i)
    {
      DEBUG_PRINT(WiFi.SSID(i));
      DEBUG_PRINT(WiFi.RSSI(i));
      String ssid = WiFi.SSID(i);
      int quality = getRSSIasQuality(WiFi.RSSI(i));
      bool locked = WiFi.encryptionType(i) != ENC_TYPE_NONE;
      String coma = (i > 0) ? "," : " ";
      content += coma + "{\"ssid\": \"" + WiFi.SSID(i) + "\", \"q\": " + quality + ", \"l\": \"" + locked + "\"}";
    }
  }

  content += "]";

  server->send(200, "application/json", content);
  server->client().stop();

  DEBUG_PRINT(F("Sent config page"));
}

void WiFiManager::handleRootPost()
{
  DEBUG_PRINT(F("WiFi save"));

  _apName = urldecode(server->arg("name").c_str());
  _ssid = urldecode(server->arg("ssid").c_str());
  _pass = urldecode(server->arg("pass").c_str());

  server->sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server->sendHeader("Pragma", "no-cache");
  server->sendHeader("Expires", "-1");
  server->setContentLength(sizeof(SKETCH_STATUS_HTML_GZ));
  server->sendHeader("Content-Encoding", "gzip");
  server->send_P(200, "text/html", (const char*)SKETCH_STATUS_HTML_GZ, sizeof(SKETCH_STATUS_HTML_GZ));
  DEBUG_PRINT(F("Sent wifi save page"));

  connect = true; //signal ready to connect/reset
}

void WiFiManager::handle204()
{
  DEBUG_PRINT(F("204 No Response"));
  server->sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server->sendHeader("Pragma", "no-cache");
  server->sendHeader("Expires", "-1");
  server->send(204, "text/plain", "");
}

void WiFiManager::handleNotFound()
{
  if (captivePortal())
  { // If captive portal redirect instead of displaying the error page.
    return;
  }
  String message = "File Not Found\n\n";
  message += "URI: ";
  message += server->uri();
  message += "\nMethod: ";
  message += (server->method() == HTTP_GET) ? "GET" : "POST";
  message += "\nArguments: ";
  message += server->args();
  message += "\n";

  for (uint8_t i = 0; i < server->args(); i++)
  {
    message += " " + server->argName(i) + ": " + server->arg(i) + "\n";
  }
  server->sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server->sendHeader("Pragma", "no-cache");
  server->sendHeader("Expires", "-1");
  server->send(404, "text/plain", message);
}


boolean WiFiManager::captivePortal()
{
  if (!isIp(server->hostHeader()))
  {
    DEBUG_PRINT(F("Request redirected to captive portal"));
    server->sendHeader("Location", String("http://") + toStringIp(server->client().localIP()), true);
    server->send(302, "text/plain", ""); // Empty content inhibits Content-length header so we have to close the socket ourselves.
    server->client().stop();             // Stop is needed because we sent no content length
    return true;
  }
  return false;
}

template <typename Generic>
void WiFiManager::DEBUG_PRINT(Generic text)
{
  if (_debug)
  {
    Serial.print("*WM: ");
    Serial.println(text);
  }
}

int WiFiManager::getRSSIasQuality(int RSSI)
{
  int quality = 0;

  if (RSSI <= -100)
  {
    quality = 0;
  }
  else if (RSSI >= -50)
  {
    quality = 100;
  }
  else
  {
    quality = 2 * (RSSI + 100);
  }
  return quality;
}


boolean WiFiManager::isIp(String str)
{
  for (int i = 0; i < str.length(); i++)
  {
    int c = str.charAt(i);
    if (c != '.' && (c < '0' || c > '9'))
    {
      return false;
    }
  }
  return true;
}


String WiFiManager::toStringIp(IPAddress ip)
{
  String res = "";
  for (int i = 0; i < 3; i++)
  {
    res += String((ip >> (8 * i)) & 0xFF) + ".";
  }
  res += String(((ip >> 8 * 3)) & 0xFF);
  return res;
}