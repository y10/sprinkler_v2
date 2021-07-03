#include <WsConsole.h>

#include "sprinkler-setup.h"
#include "sprinkler-http.h"
#include "sprinkler-wifi.h"
#include "sprinkler-ota.h"
#include "sprinkler-alexa.h"
#include "sprinkler-time.h"
#include "sprinkler.h"

void setup()
{
  Console.begin(115200);
  Console.println("Reset reason: " + ESP.getResetReason());
  setupSprinkler();
  setupWifi();
  setupTime();
  setupHttp();
  setupOTA();
  setupAlexa();
  Console.println("System started.");
}

void loop()
{
  handleOTA();
  handleAlexa();
  handleTicks();
}