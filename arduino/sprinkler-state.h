#ifndef SprinklerState_H
#define SprinklerState_H

#include <ArduinoJson.h>
#include <functional>
#include <Ticker.h>
#include <map>

class SprinklerZoneTimer {
 public:
  typedef std::function<void()> OnStopCallback;

  SprinklerZoneTimer(unsigned int zone, unsigned int duration, OnStopCallback onStop)
      : Zone(zone), Duration(duration), StartTime(millis()), PauseTime(0), OnStop(onStop) {
    unsigned long d = (duration ? duration : 5);
    unsigned long ms = d * 1000 * 60;
    timer.once_ms(ms, onStop);
  }

  unsigned int Zone;
  unsigned int Duration;
  unsigned long StartTime;
  unsigned long PauseTime;

  ~SprinklerZoneTimer() {
    stop();
  }

  void pause() {
    PauseTime = millis();
    timer.detach();
  }

  void resume() {
    if (!PauseTime)
      return;

    uint32_t d = (uint32_t)Duration * 60 * 1000;
    uint32_t p = PauseTime - StartTime;
    uint32_t ms = d - p;
    timer.once_ms(ms, OnStop);
    StartTime = millis() - p;
    PauseTime = 0;
  }

  void stop() { 
    PauseTime = 0;
    timer.detach(); 
  }

  const String toJSON() {
    return "{ \"state\": \"" + (String)(PauseTime ? "paused" : "started") +
           "\", \"zone\":" + (String)Zone +
           ", \"millis\":" + (String)(PauseTime ? PauseTime - StartTime : millis() - StartTime) +
           ", \"duration\": " + (String)Duration + " }";
  }

 private:
  OnStopCallback OnStop;
  Ticker timer;
};


class SprinklerState {
 public:

  std::map<unsigned int, SprinklerZoneTimer *> Timers;

  bool isPaused(unsigned int zone);
  bool isWatering(unsigned int zone);
  bool isWatering();
  size_t count();

  typedef std::function<void()> OnStopCallback;
  void start(unsigned int zone, unsigned int duration, OnStopCallback onStop);
  void stop(unsigned int zone);
  void pause(unsigned int zone);
  void resume(unsigned int zone);

  const String toJSON(unsigned int zone);
  const String toJSON();
};


#endif