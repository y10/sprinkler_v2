#include <WsConsole.h>
#include <fauxmoESP.h>
#include "sprinkler.h"

static WsConsole alexa_console("alexa");

std::unique_ptr<fauxmoESP> fauxmo;

void handleAlexa()
{
    fauxmo->handle();
}

void setupAlexa()
{
  fauxmo.reset(new fauxmoESP());

  // Setup Alexa devices
  if (Sprinkler.dispname().length() > 0)
  {
    fauxmo->addDevice(Sprinkler.dispname().c_str());
    alexa_console.print("Added alexa device: ");
    alexa_console.println(Sprinkler.dispname());
  }

  fauxmo->onSet([&](unsigned char device_id, const char *device_name, bool state, unsigned char value) {
    alexa_console.printf("Set Device #%d (%s) state: %s\n", device_id, device_name, state ? "ON" : "OFF");
    //TODO: pass zone
    //state ? Sprinkler.start() : Sprinkler.stop();
  });

  fauxmo->onGet([&](unsigned char device_id, const char *device_name, bool &state, unsigned char &value) {
    state = Sprinkler.isWatering();
    alexa_console.printf("Get Device #%d (%s) state: %s\n", device_id, device_name, state ? "ON" : "OFF");
  });
}
