#include "sprinkler-state.h"

#include <WsConsole.h>

#include "includes/Files.h"

size_t SprinklerState::count() {
  size_t count = 0;
  for (const auto &kv : Timers) {
    SprinklerZoneTimer *timer = kv.second;
    if (!timer->PauseTime)
      count += 1;
  }

  return count;
}

bool SprinklerState::isWatering() {
  for (const auto &kv : Timers) {
    SprinklerZoneTimer *timer = kv.second;
    if (!timer->PauseTime)
      return true;
  }

  return false;
}

bool SprinklerState::isPaused(unsigned int zone) {
  if (Timers.find(zone) != Timers.end()) {
    return (Timers[zone]->PauseTime);
  }
  return false;
}

bool SprinklerState::isWatering(unsigned int zone) {
  if (Timers.find(zone) != Timers.end()) {
    return (!Timers[zone]->PauseTime);
  }
  return false;
}

const String SprinklerState::toJSON() {
  String json = "{";
  String coma = "";
  for (auto &kv : Timers)
  {
    SprinklerZoneTimer *timer = kv.second;
    json += coma + "\"" + (String) timer->Zone + "\": " + timer->toJSON();
    coma = ",";
  }
  json += "}";
  return json;
}

const String SprinklerState::toJSON(unsigned int zone) 
{
  if (Timers.find(zone) != Timers.end())
  {
    return Timers[zone]->toJSON();
  }

  return "{ \"state\": \"stopped\", \"zone\":" + (String)zone + "}";
}

void SprinklerState::start(unsigned int zone, unsigned int duration, OnStopCallback onStop) {
  if (Timers.find(zone) != Timers.end()) {
    delete Timers[zone];
  }

  Timers[zone] = new SprinklerZoneTimer(zone, duration, onStop);
}

void SprinklerState::stop(unsigned int zone) {
  if (Timers.find(zone) != Timers.end()) {
    Timers[zone]->stop();
    delete Timers[zone];
    Timers.erase(zone);
  }
}

void SprinklerState::pause(unsigned int zone) {
  if (Timers.find(zone) != Timers.end()) {
    Timers[zone]->pause();
  }
}

void SprinklerState::resume(unsigned int zone) {
  if (Timers.find(zone) != Timers.end()) {
    Timers[zone]->resume();
  }
}