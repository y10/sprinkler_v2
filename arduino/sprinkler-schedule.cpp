#include <WsConsole.h>
#include "sprinkler-schedule.h"

static WsConsole console("schd");

void SprinklerTimer::disable()
{
  if (Alarm.isAllocated(AlarmID))
  {
    Alarm.free(AlarmID);
    AlarmID = dtINVALID_ALARM_ID;
  }
}

bool SprinklerTimer::enable()
{
  disable();

  if (Duration)
  {
    AlarmID = (Day == dowInvalid)
                  ? Alarm.alarmRepeat(hour(Time), minute(Time), 0, OnTick)
                  : Alarm.alarmRepeat(Day, hour(Time), minute(Time), 0, OnTick);
  }

  if (!Alarm.isAllocated(AlarmID))
  {
    if (Duration)
    {
      console.warn("#" + (String)Day + ": failed to enable " + (String)hours() + ":" + (String)minutes() + " " + (String)Duration + " timer.");
    }
    return false;
  }

  return true;
}

void SprinklerTimer::duration(unsigned int value)
{
  disable();

  Duration = value;
}

void SprinklerTimer::hours(unsigned int value)
{
  disable();
  tmElements_t te;
  breakTime(Time ? Time : now(), te);
  te.Hour = value;
  if (!Time)
  {
    te.Minute = 0;
  }
  Time = makeTime(te);
}

void SprinklerTimer::minutes(unsigned int value)
{
  disable();

  tmElements_t te;
  breakTime(Time ? Time : now(), te);
  te.Minute = value;
  if (!Time)
  {
    te.Hour = 0;
  }
  Time = makeTime(te);
}

void SprinklerTimer::fromJSON(JsonObject json)
{
  disable();

  if (json.containsKey("d"))
  {
    duration(json["d"].as<String>().toInt());
  }

  if (json.containsKey("h"))
  {
    hours(json["h"].as<String>().toInt());
  }

  if (json.containsKey("m"))
  {
    minutes(json["m"].as<String>().toInt());
  }
}

void SprinklerTimer::fromConfig(SprinklerTimerConfig &config)
{
  disable();

  hours(config.h);

  minutes(config.m);

  duration(config.d);
}

SprinklerTimerConfig SprinklerTimer::toConfig()
{
  SprinklerTimerConfig cfg;
  cfg.defined = true;
  cfg.h = hours();
  cfg.m = minutes();
  cfg.d = duration();
  return cfg;
}

String SprinklerTimer::toJSON()
{
  return "{ \"d\": " + (String)Duration + ", \"h\": " + (String)hour(Time) + ", \"m\": " + (String)minute(Time) + " }";
}

SprinklerTimerConfig ScheduleDay::toConfig()
{
  for (auto &t : Timers)
  {
    return t->toConfig();
  }
}

void ScheduleDay::fromConfig(SprinklerTimerConfig &config)
{
  for (auto &t : Timers)
  {
    t->disable();
    delete t;
  }

  Timers.clear();

  if (!config.defined)
    return;

  SprinklerTimer *timer = new SprinklerTimer(Day, onTimerTick);
  timer->fromConfig(config);
  Timers.push_back(timer);
}

void ScheduleDay::fromJSON(JsonArray json)
{
  for (auto &t : Timers)
  {
    t->disable();
    delete t;
  }

  Timers.clear();

  for (JsonVariant value : json)
  {
    SprinklerTimer *timer = new SprinklerTimer(Day, onTimerTick);
    timer->fromJSON(value.as<JsonObject>());
    Timers.push_back(timer);
  }
}

String ScheduleDay::toJSON()
{
  String json = "[";
  String coma = "";
  for (auto &timer : Timers)
  {
    json += coma + timer->toJSON();
    coma = ",";
  }
  json += "]";

  return json;
}

void SprinklerSchedule::fromJSON(JsonObject json)
{
  for (JsonPair kv : json)
  {
    String key = kv.key().c_str();
    ScheduleDay *day = days[key];
    JsonArray arr = kv.value().as<JsonArray>();
    day->fromJSON(arr);
  }
}

String SprinklerSchedule::toJSON()
{
  String json = "{";
  String coma = "";
  for (const auto &kv : days)
  {
    String dayid = kv.first;
    ScheduleDay *day = kv.second;
    if (day->isEnabled())
    {
      json += coma + "\"" + dayid + "\": " + day->toJSON();
      coma = ",";
    }
  }
  json += "}";
  return json;
}

SprinklerZoneConfig SprinklerSchedule::toConfig()
{
  SprinklerZoneConfig config;
  memset(&config, 0, sizeof(SprinklerZoneConfig));
  uint8_t i = 0;
  for (const auto &kv : days)
  {
    ScheduleDay *day = kv.second;
    config.days[day->dow()] = day->toConfig();
    i++;
  }

  return config;
}

void SprinklerSchedule::fromConfig(SprinklerZoneConfig &config)
{
  for (const auto &kv : days)
  {
    ScheduleDay *day = kv.second;
    day->fromConfig(config.days[day->dow()]);
  }
}
