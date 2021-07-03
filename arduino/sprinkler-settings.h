#ifndef SPRINKLER_SETTINGS_H
#define SPRINKLER_SETTINGS_H

#include <map>
#include <functional>
#include <ArduinoJson.h>
#include "sprinkler-config.h"
#include "sprinkler-schedule.h"

class SprinklerZone
{

public:
  typedef std::function<void(SprinklerZone *, SprinklerTimer *)> OnTimerTick;

  SprinklerZone(unsigned int zoneid, OnTimerTick onTick)
      : Index(zoneid)
  {
    memset(Name, 0, sizeof(Name));

    Schedule.onTimer([this, onTick](SprinklerTimer *timer) {
      onTick(this, timer);
    });
  }

  unsigned int index() const { return Index; }
  const String name() const { return Name; }
  void name(const char *value);

  void attach() { Schedule.enable(); }

  void detach() { Schedule.disable(); }

  void fromConfig(SprinklerZoneConfig &config);
  SprinklerZoneConfig toConfig();

  void fromJSON(JsonObject json);
  String toJSON()
  {
    return "{\"name\": \"" + name() + "\", \"days\": " + Schedule.toJSON() + "}";
  }

private:
  char Name[35];
  unsigned int Index;
  SprinklerSchedule Schedule;
};

class SprinklerSettings
{
public:
  SprinklerSettings(SprinklerZone::OnTimerTick onTick)
    : onTimerTick(onTick)
  { }

  void fromJSON(JsonObject json);
  String toJSON();

  void fromConfig(SprinklerConfig &config);
  SprinklerConfig toConfig();

  void reset()
  {
    for (const auto &kv : zones)
    {
      SprinklerZone *zone = kv.second;
      zone->detach();
      delete zone;
    }

    zones.clear();
  }

  void detach()
  {
    for (const auto &kv : zones)
    {
      SprinklerZone *zone = kv.second;
      zone->detach();
    }
  }

  void attach()
  {
    for (const auto &kv : zones)
    {
      SprinklerZone *zone = kv.second;
      zone->attach();
    }
  }

private:
  std::map<unsigned int, SprinklerZone *> zones;
  SprinklerZone::OnTimerTick onTimerTick;
};

#endif
