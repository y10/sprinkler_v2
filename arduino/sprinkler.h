#ifndef SPRINKLER_H
#define SPRINKLER_H

#include <ArduinoJson.h>
#include <Ticker.h>

#include <functional>
#include <map>
#include <vector>

#include "sprinkler-d1r2.h"
#include "sprinkler-device.h"
#include "sprinkler-settings.h"
#include "sprinkler-state.h"

class SprinklerControl {
 public:
  SprinklerSettings Settings;
  SprinklerDevice Device;
  SprinklerState Timers;

  SprinklerControl()
      : Device(RL1_PIN, RL2_PIN, RL3_PIN, RL4_PIN, RL5_PIN, RL6_PIN, RL7_PIN, RL8_PIN),
        Settings([&](SprinklerZone *zone, SprinklerTimer *timer) { start(zone->index(), timer->duration()); }) {
  }

  const char *builtDate() const { return Device.builtDate(NULL); }

  const char *builtDate(time_t *dt) const { return Device.builtDate(dt); }

  const String safename() { return Device.safename(); }

  const String dispname() const { return Device.dispname(); }

  const String dispname(const char *name) { return Device.dispname(name); }

  const String hostname() const { return Device.hostname(); }

  const String hostname(const char *name) { return Device.hostname(name); }

  void logLevel(const char *level) {
    Device.logLevel(level);
    Device.restart();
  }

  String toJSON() {
    return (String) "{ \"logLevel\": \"" + (String)Device.logLevel() + "\", \"name\": \"" + Device.dispname() + "\", \"chip\": \"" + Device.hostname() + "\",  \"zones\": " + Settings.toJSON() + " }";
  }

  bool fromJSON(JsonObject json);

  bool isWatering() { return Timers.isWatering(); }

  void start(unsigned int zone, unsigned int duration);
  void stop(unsigned int zone);
  void pause(unsigned int zone);
  void resume(unsigned int zone);

  void attach();
  void load();
  void save();
  void reset();
  void restart();

  typedef std::function<void(const char *)> OnEvent;
  void on(const char *eventType, OnEvent event);

 protected:
  void fireEvent(const char *eventType) { fireEvent(eventType, ""); }
  void fireEvent(const char *eventType, const String evenDescription) { fireEvent(eventType, evenDescription.c_str()); }
  void fireEvent(const char *eventType, const char *evenDescription);

 private:
  std::map<const char *, std::vector<OnEvent>> onEventHandlers;
};

extern SprinklerControl Sprinkler;
#endif