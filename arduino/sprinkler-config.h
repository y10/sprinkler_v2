#ifndef SPRINKLER_CONFIG_H
#define SPRINKLER_CONFIG_H

#include "html/settings.json.h"

struct SprinklerTimerConfig
{
  bool defined;
  unsigned int h;
  unsigned int m;
  unsigned int d;

  SprinklerTimerConfig(): defined(false), h(0), m(0), d(0) {}
};

struct SprinklerZoneConfig
{
  bool defined;
  char disp_name[50];
  SprinklerTimerConfig days[8]; // 7 weekdays + 1 for everyday
  SprinklerZoneConfig() : defined(false), disp_name({0}) {}
};

struct SprinklerConfig
{
  uint8_t version;
  uint8_t loglevel;
  char full_name[50];
  char host_name[50];
  char disp_name[50];
  SprinklerZoneConfig zones[SKETCH_MAX_ZONES];
  SprinklerConfig(): version(0), full_name({0}), host_name({0}), disp_name({0}) {}
};

#endif