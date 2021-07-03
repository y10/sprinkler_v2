#ifndef AsyncHTTPUpgradeHandler_H
#define AsyncHTTPUpgradeHandler_H

#include <Arduino.h>
#include <ESPAsyncTCP.h>
#include <Ticker.h>
#include <WsConsole.h>

#include "StreamString.h"
#include "Url.h"

const char OTA_REQUEST_TEMPLATE[] PROGMEM =
    "GET %s HTTP/1.1\r\n"
    "Host: %s\r\n"
    "User-Agent: Sprinkler\r\n"
    "Connection: close\r\n"
    "Content-Type: application/x-www-form-urlencoded\r\n"
    "Content-Length: 0\r\n\r\n\r\n";

static WsConsole upgrade_console("esp");

class AsyncHTTPUpgradeHandler : public AsyncWebHandler {
 public:
  AsyncHTTPUpgradeHandler(const String &uri, WebRequestMethodComposite method, const String &firmwareUri)
      : firmwareUrl(firmwareUri),
        acceptedUri(uri),
        acceptedMethod(method),
        connected(false),
        completed(false),
        totalSize(0) {
    client.onConnect([](void *obj, AsyncClient *c) { ((AsyncHTTPUpgradeHandler *)(obj))->onClientConnect(); },
                     this);
  }

 protected:
  virtual bool canHandle(AsyncWebServerRequest *request) override final {
    if (!(acceptedMethod & request->method()))
      return false;

    if (acceptedUri.length() && (acceptedUri != request->url() && !request->url().startsWith(acceptedUri + "/")))
      return false;

    return true;
  }

  virtual void handleRequest(AsyncWebServerRequest *request) override final {
    AsyncWebServerResponse *response = handleDownload(request);
    (!response)
        ? request->send(400, "text/html", "Unknown error")
        : request->send(response);
  }

  virtual void handleBody(AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) override final {
  }

  virtual void handleUpload(AsyncWebServerRequest *request, const String &filename, size_t index, uint8_t *data, size_t len, bool final) override final {
  }

  virtual bool isRequestHandlerTrivial() override final { return false; }

 protected:
  AsyncWebServerResponse *handleDownload(AsyncWebServerRequest *request) {
    if (Update.isRunning()) {
      return request->beginResponse(400, "text/html", "Upgrade is in progress.");
    }

    String firmwareAddr = request->arg("firmware-addr");
    if (firmwareAddr.length() != 0) {
      Url url(firmwareAddr);
      if ((!url.protocol.equals("http")) && (!url.protocol.equals("https"))) {
        return request->beginResponse(400, "text/html", "Not supported protocol specified.");
      }
      firmwareUrl = url;
    }

#if ASYNC_TCP_SSL_ENABLED
    connected = client.connect(firmwareUrl.host.c_str(), firmwareUrl.port, 443 == firmwareUrl.port);
#else
    connected = client.connect(firmwareUrl.host.c_str(), firmwareUrl.port);
#endif

    if (!connected) {
      client.close(true);
      return request->beginResponse(400, "text/html", "No connection could be made.");
    }

    return request->beginChunkedResponse("text/html", [&](uint8_t *buffer, size_t bufferLen, size_t totalLen) -> size_t {
      if (connected) {
        return RESPONSE_TRY_AGAIN;
      }

      if (completed) {
        ticker.once_ms(200, [] { ESP.restart(); });
        return 0;
      }

      completed = true;

      if (!Update.hasError()) {
        return RESPONSE_TRY_AGAIN;
      }

      StreamString error;
      Update.printError(error);
      memcpy((void *)(buffer), (const void *)error.c_str(), error.length());
      return (size_t)error.length();
    });
  }

  void onClientConnect() {
    connected = true;
    client.onData([](void *obj, AsyncClient *c, void *data, size_t len) { ((AsyncHTTPUpgradeHandler *)(obj))->onClientData(data, len); },
                  this);
    client.onTimeout([](void *obj, AsyncClient *c, uint32_t time) { ((AsyncHTTPUpgradeHandler *)(obj))->onClientTimeout(time); },
                     this);
    client.onDisconnect([](void *obj, AsyncClient *c) { ((AsyncHTTPUpgradeHandler *)(obj))->onClientDisconnect(); },
                        this);

    upgrade_console.printf("Upgrading from: %s\r\n", firmwareUrl.path.c_str());
    char buffer[strlen_P(OTA_REQUEST_TEMPLATE) + firmwareUrl.path.length() + firmwareUrl.host.length()];
    snprintf_P(buffer, sizeof(buffer), OTA_REQUEST_TEMPLATE, firmwareUrl.path.c_str(), firmwareUrl.host.c_str());
    client.write(buffer);
  }

  void onClientData(void *data, size_t len) {
    char *p = (char *)data;

    if (totalSize == 0) {
      Update.runAsync(true);

      uint32_t space = ESP.getFreeSketchSpace();

      if (!Update.begin((space - 0x1000) & 0xFFFFF000)) {
        Update.printError(upgrade_console);
        client.close(true);
        Update.runAsync(false);
        return;
      }

      p = strstr((char *)data, "\r\n\r\n") + 4;
      len = len - (p - (char *)data);
    }

    if (!Update.hasError()) {
      if (Update.write((uint8_t *)p, len) != len) {
        Update.printError(upgrade_console);
        client.close(true);
        Update.end();
        return;
      } else {
        Serial.print(".");
      }
    }

    totalSize += len;
  }

  void onClientDisconnect() {
    Serial.println();

    if (Update.end(true)) {
      upgrade_console.printf("Success: %u bytes\r\n", totalSize);
    } else {
      Update.printError(upgrade_console);
    }

    connected = false;
  }

  void onClientTimeout(uint32_t time) {
    upgrade_console.println("Timeout");
    client.close(true);
  }

 private:
  WebRequestMethodComposite acceptedMethod;
  const String acceptedUri;
  AsyncClient client;
  size_t totalSize;
  Url firmwareUrl;
  bool connected;
  bool completed;
  Ticker ticker;
};

#endif