#ifndef SCHEDULE_H
#define SCHEDULE_H

#include <map>
#include <vector>
#include <Arduino.h>
#include <Ticker.h>
#include <Time.h>
#include <TimeAlarms.h>
#include <ArduinoJson.h>

#include "sprinkler-config.h"

class SprinklerTimer
{
protected:
  timeDayOfWeek_t Day;

  unsigned int Duration;
  AlarmID_t AlarmID;
  OnTick_t OnTick;
  time_t Time;

public:
  typedef std::function<void(SprinklerTimer *)> OnTimerTick;

  SprinklerTimer(timeDayOfWeek_t day, OnTimerTick onTick)
      : OnTick([this, onTick]() { onTick(this); }), Day(day), Time(0), Duration(0), AlarmID(dtINVALID_ALARM_ID)
  {
  }

  bool isEnabled() { return Alarm.isAllocated(AlarmID); }

  void disable();
  bool enable();

  unsigned int hours() { return hour(Time); }
  unsigned int minutes() { return minute(Time); }
  unsigned int duration() { return Duration; }

  void hours(unsigned int value);
  void minutes(unsigned int value);
  void duration(unsigned int value);

  void fromJSON(JsonObject json);
  String toJSON();

  void fromConfig(SprinklerTimerConfig &config);
  SprinklerTimerConfig toConfig();
};

class ScheduleDay
{

public:
  ScheduleDay(timeDayOfWeek_t day) : Day(day) {}

  timeDayOfWeek_t dow() { return Day; }

  bool isEnabled() { return Timers.size() > 0; }

  void enable()
  {
    for (auto &timer : Timers)
    {
      if (!timer->isEnabled())
      {
        timer->enable();
      }
    }
  }

  void disable()
  {
    for (auto &timer : Timers)
    {
      timer->disable();
    }
  }

  void onTimer(SprinklerTimer::OnTimerTick onTick) { onTimerTick = onTick; }

  void fromJSON(JsonArray json);
  String toJSON();

  void fromConfig(SprinklerTimerConfig &config);
  SprinklerTimerConfig toConfig();

protected:
  timeDayOfWeek_t Day;
  std::vector<SprinklerTimer *> Timers;
  SprinklerTimer::OnTimerTick onTimerTick;
};

class SprinklerSchedule
{
public:
  ScheduleDay Everyday;
  ScheduleDay Mon;
  ScheduleDay Tue;
  ScheduleDay Wed;
  ScheduleDay Thu;
  ScheduleDay Fri;
  ScheduleDay Sat;
  ScheduleDay Sun;

  SprinklerSchedule() : Everyday(dowInvalid),
                        Mon(dowMonday),
                        Tue(dowTuesday),
                        Wed(dowWednesday),
                        Thu(dowThursday),
                        Fri(dowFriday),
                        Sat(dowSaturday),
                        Sun(dowSunday)
  {
    days["all"] = &Everyday;
    days["mon"] = &Mon;
    days["tue"] = &Tue;
    days["wed"] = &Wed;
    days["thu"] = &Thu;
    days["fri"] = &Fri;
    days["sat"] = &Sat;
    days["sun"] = &Sun;
  }

  bool isEnabled()
  {
    for (const auto &kv : days)
    {
      ScheduleDay *day = kv.second;
      if (day->isEnabled())
      {
        return true;
      }
    }

    return false;
  }

  void enable()
  {
    for (const auto &kv : days)
    {
      ScheduleDay *day = kv.second;
      day->enable();
    }
  }

  void disable()
  {
    for (const auto &kv : days)
    {
      ScheduleDay *day = kv.second;
      day->disable();
    }
  }

  void onTimer(SprinklerTimer::OnTimerTick onTick)
  {
    for (const auto &kv : days)
    {
      ScheduleDay *day = kv.second;
      day->onTimer(onTick);
    }
  }

  void fromJSON(JsonObject json);
  String toJSON();

  void fromConfig(SprinklerZoneConfig &config);
  SprinklerZoneConfig toConfig();

private:
  std::map<String, ScheduleDay *> days;
};

#endif
