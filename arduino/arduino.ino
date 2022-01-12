#include <WsConsole.h>
#include <Ticker.h>

#include "sprinkler-setup.h"
#include "sprinkler-http.h"
#include "sprinkler-wifi.h"
#include "sprinkler-ota.h"
#include "sprinkler-alexa.h"
#include "sprinkler-time.h"
#include "sprinkler.h"

Ticker ticker;

void begin()
{
  ticker.attach(0.6, tick);
  Console.begin(115200);
  Console.println("Reset reason: " + ESP.getResetReason());
  Console.println();
}

void setup()
{
  begin();

  setupSprinkler();
  setupWifi();
  setupTime();
  setupHttp();
  setupOTA();
  setupAlexa();
  
  end();
}

void loop()
{
  handleWifi();
  handleOTA();
  handleAlexa();
  handleTicks();
}

void tick()
{
  int state = digitalRead(LED_PIN); 
  digitalWrite(LED_PIN, !state); 
}

void end()
{
  digitalWrite(LED_PIN, LOW); 
  ticker.detach();
  Console.println("System started.");
}