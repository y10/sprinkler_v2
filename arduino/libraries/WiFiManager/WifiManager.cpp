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

#include "WifiManager.h"

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
  server.reset(new AsyncWebServer(80));

  DEBUG_PRINT(F(""));
  _chip = apName;
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
    WiFi.softAP(_chip, _apPasswd); //password option
  }
  else
  {
    WiFi.softAP(_chip);
  }

  delay(500); // Without delay I've seen the IP address blank
  DEBUG_PRINT(F("AP IP address: "));
  DEBUG_PRINT(WiFi.softAPIP());

  
  dnsServer->setErrorReplyCode(DNSReplyCode::NoError);
  dnsServer->start(DNS_PORT, "*", WiFi.softAPIP());

  server->on("/", HTTP_GET, std::bind(&WiFiManager::handleRoot, this, std::placeholders::_1)); 
  server->on("/", HTTP_POST, std::bind(&WiFiManager::handleRootPost, this, std::placeholders::_1)); 
  server->on("/info", HTTP_GET, std::bind(&WiFiManager::handleHostInfo, this, std::placeholders::_1)); 
  server->on("/scan", HTTP_GET, std::bind(&WiFiManager::handleWifiScan, this, std::placeholders::_1)); 
  server->on("/generate_204", std::bind(&WiFiManager::handle204, this, std::placeholders::_1)); //Android/Chrome OS captive portal check.
  server->on("/fwlink", std::bind(&WiFiManager::handleRoot, this, std::placeholders::_1));      //Microsoft captive portal. Maybe not needed. Might be handled by notFound handler.
  server->onNotFound(std::bind(&WiFiManager::handleNotFound, this, std::placeholders::_1));
  server->begin(); // Web server start
  DEBUG_PRINT(F("HTTP server started"));
}

wm_status_t WiFiManager::autoConnect()
{
  String ssid = "ESP" + String(ESP.getChipId());
  return autoConnect(ssid.c_str(), NULL);
}

wm_status_t WiFiManager::autoConnect(char const *apName)
{
  return autoConnect(apName, NULL);
}

wm_status_t WiFiManager::autoConnect(char const *apName, char const *apPasswd)
{
  DEBUG_PRINT(F(""));
  DEBUG_PRINT(F("AutoConnect"));
  String ssid = getSSID();
  String pass = getPassword();
  WiFi.mode(WIFI_STA);
  connectWifi(ssid, pass);
  int s = WiFi.status();
  if (s == WL_CONNECTED)
  {
    DEBUG_PRINT(F("IP Address:"));
    DEBUG_PRINT(WiFi.localIP());

    return WM_CONNECTED;
  }

  WiFi.mode(WIFI_AP);
  if (_apcallback != NULL)
  {
    _apcallback();
  }
  connect = false;
  begin(apName, apPasswd);

  bool looping = true;
  while (timeout == 0 || millis() < start + timeout)
  {
    //DNS
    dnsServer->processNextRequest();

    if (connect)
    {
      delay(2000);
      DEBUG_PRINT("Connecting to new AP as " + _chip);
      connect = false;
      WiFi.hostname(_chip.c_str());
      connectWifi(_ssid, _pass);
      int s = WiFi.status();
      if (s == WL_CONNECTED)
      {
        WiFi.mode(WIFI_STA);
        server.reset();
        dnsServer.reset();
        return WM_FIRST_TIME_CONNECTED;
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

String WiFiManager::getDeviceName()
{
  if (_chip == "")
  {
    DEBUG_PRINT(F("Reading AP name"));
    _chip = "ESP" + String(ESP.getChipId());
    DEBUG_PRINT("AP name: " + _chip);
  }
  return _chip;
}

String WiFiManager::getFriendlyName()
{
  if (_name == "")
  {
    DEBUG_PRINT(F("Reading Friendly Name"));
    _name = getDeviceName();
    DEBUG_PRINT("Friendly Name: " + _name);
  }
  return _name;
}

String WiFiManager::setFriendlyName(const char * friendlyName)
{
  String name = friendlyName;
  if (name == "")
  {
    name = getDeviceName();
  }
  _name = name;
  return _name;
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
  //delay(200);
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

void WiFiManager::handleRoot(AsyncWebServerRequest *request)
{
  DEBUG_PRINT(F("Handle root"));
  if (captivePortal(request))
  { // If caprive portal redirect instead of displaying the page.
    return;
  }

  AsyncWebServerResponse *response = request->beginResponse_P(200, "text/html", SKETCH_SETUP_HTML_GZ, sizeof(SKETCH_SETUP_HTML_GZ));
  response->addHeader("Content-Encoding", "gzip");
  response->addHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  response->addHeader("Pragma", "no-cache");
  response->addHeader("Expires", "-1");

  request->send(response);
}

void WiFiManager::handleHostInfo(AsyncWebServerRequest *request)
{
  AsyncWebServerResponse *response = request->beginResponse(200, "application/json", "{ \"name\": \"" + _name + "\", \"chip\": \"" + _chip + "\" }");
  response->addHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  response->addHeader("Pragma", "no-cache");
  response->addHeader("Expires", "-1");
  request->send(response);

  DEBUG_PRINT(F("Sent info"));
}

void WiFiManager::handleWifiScan(AsyncWebServerRequest *request)
{
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

  AsyncWebServerResponse *response = request->beginResponse(200, "application/json", content);
  response->addHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  response->addHeader("Pragma", "no-cache");
  response->addHeader("Expires", "-1");
  request->send(response);

  DEBUG_PRINT(F("Sent config page"));
}

void WiFiManager::handleRootPost(AsyncWebServerRequest *request)
{
  DEBUG_PRINT(F("WiFi save"));

  _name = urldecode(request->arg("name").c_str());
  _chip = urldecode(request->arg("chip").c_str());
  _ssid = urldecode(request->arg("ssid").c_str());
  _pass = urldecode(request->arg("pass").c_str());


  AsyncWebServerResponse *response = request->beginResponse_P(200, "text/html", SKETCH_STATUS_HTML_GZ, sizeof(SKETCH_STATUS_HTML_GZ));
  response->addHeader("Content-Encoding", "gzip");
  response->addHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  response->addHeader("Pragma", "no-cache");
  response->addHeader("Expires", "-1");
 
  DEBUG_PRINT(F("Sent wifi save page"));

  connect = true; //signal ready to connect/reset
}

void WiFiManager::handle204(AsyncWebServerRequest *request)
{
  AsyncWebServerResponse *response = request->beginResponse(204, "text/plain", "");
  response->addHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  response->addHeader("Pragma", "no-cache");
  response->addHeader("Expires", "-1");
  request->send(response);
}

void WiFiManager::handleNotFound(AsyncWebServerRequest *request)
{
  if (captivePortal(request))
  { // If captive portal redirect instead of displaying the error page.
    return;
  }
  
  DEBUG_PRINT("NOT_FOUND: ");
  if(request->method() == HTTP_GET)
    DEBUG_PRINT("GET");
  else if(request->method() == HTTP_POST)
    DEBUG_PRINT("POST");
  else if(request->method() == HTTP_DELETE)
    DEBUG_PRINT("DELETE");
  else if(request->method() == HTTP_PUT)
    DEBUG_PRINT("PUT");
  else if(request->method() == HTTP_PATCH)
    DEBUG_PRINT("PATCH");
  else if(request->method() == HTTP_HEAD)
    DEBUG_PRINT("HEAD");
  else if(request->method() == HTTP_OPTIONS)
    DEBUG_PRINT("OPTIONS");
  else
    DEBUG_PRINT("UNKNOWN");

  DEBUG_PRINT(" http://" + request->host() + request->url() + "\n");

  AsyncWebServerResponse *response = request->beginResponse(404, "text/plain", "");
  response->addHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  response->addHeader("Pragma", "no-cache");
  response->addHeader("Expires", "-1");
  request->send(response);
}

boolean WiFiManager::captivePortal(AsyncWebServerRequest *request)
{
  if (!isIp(request->host()))
  {
    DEBUG_PRINT(F("Request redirected to captive portal"));
    AsyncWebServerResponse *response = request->beginResponse(302,"text/plain","");
    response->addHeader("Location", String("http://") + toStringIp(request->client()->localIP()));
    request->send(response);
    return true;
  }
  return false;
}

//start up config portal callback
void WiFiManager::setAPCallback(void (*func)(void))
{
  _apcallback = func;
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