#ifndef AsyncHTTPUpdateHandler_H
#define AsyncHTTPUpdateHandler_H

#include <Arduino.h>
#include <WsConsole.h>
#include <Ticker.h>

static WsConsole update_console("esp");

class AsyncHTTPUpdateHandler : public AsyncWebHandler
{
public:
  AsyncHTTPUpdateHandler(const String &uri)
    : AsyncHTTPUpdateHandler(uri, ASYNC_HTTP_POST)
  { }

  AsyncHTTPUpdateHandler(const String &uri, WebRequestMethodComposite method)
      : _uri(uri), _method(method)
  { }

protected:
  virtual bool canHandle(AsyncWebServerRequest *request) override final
  {
    if (!(_method & request->method()))
      return false;

    if (_uri.length() && (_uri != request->url() && !request->url().startsWith(_uri + "/")))
      return false;

    return true;
  }

  virtual void handleRequest(AsyncWebServerRequest *request) override final
  {
    request->client()->setNoDelay(true);

    if (!Update.hasError())
    {
      request->send(200, "text/html", "Restarting...\n");
      ticker.once_ms_scheduled(100, []{
        update_console.println("Restarting.");
        ESP.restart();
      });
    }
    else
    {
      request->send(500, "text/html", "Failed.\n");
    }
  }

  virtual void handleBody(AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) override final
  {
  }

  virtual void handleUpload(AsyncWebServerRequest *request, const String &filename, size_t index, uint8_t *data, size_t len, bool final) override final
  {
    if (len == 0)
      return;

    if (!Update.isRunning())
    {
      Update.runAsync(true);

      if (filename.length() == 0)
      {
        update_console.println("No file uploaded.");
        request->client()->close(true);
        Update.end();
        return;
      }

      update_console.println("Update from file: " + filename);
      uint32_t maxSketchSpace = (ESP.getFreeSketchSpace() - 0x1000) & 0xFFFFF000;
      if (!Update.begin(maxSketchSpace, U_FLASH))
      {
        request->client()->close(true);
        Update.printError(update_console);
        Update.end();
        return;
      }
    }

    Serial.print(".");
    if (Update.write(data, len) != len)
    {
      request->client()->close(true);
      Update.printError(update_console);
      Update.end();
      return;
    }

    if (final)
    {
      Serial.println();
      if (!Update.end(true))
      {
        Update.printError(update_console);
      }
    }
  }

  virtual bool isRequestHandlerTrivial() override final { return false; }

private:
  const String _uri;
  WebRequestMethodComposite _method;
  Ticker ticker;
};

#endif