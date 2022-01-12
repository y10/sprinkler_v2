#include "sprinkler-device.h"

#include <WsConsole.h>

static WsConsole console("esp");

SprinklerDevice::SprinklerDevice(uint8_t RL1, uint8_t RL2, uint8_t RL3, uint8_t RL4, uint8_t RL5, uint8_t RL6, uint8_t RL7, uint8_t RL8)
    : pins({RL1, RL2, RL3, RL4, RL5, RL6, RL7, RL8}) {
  disp_name = "Sprinkler";
  host_name = "sprinkler-" + String(ESP.getChipId(), HEX);
  full_name = "sprinkler-v" + (String)SKETCH_VERSION_MAJOR + "." + (String)SKETCH_VERSION_MINOR + "." + (String)SKETCH_VERSION_RELEASE + "_" + String(ESP.getChipId(), HEX);
  loglevel = logInfo;
  version = 1;
}

const char *SprinklerDevice::builtDate(time_t *dt) const {
  if (dt) {
    struct tm t;
    if (strptime(__DATE__ " " __TIME__ " GMT", "%b %d %Y %H:%M:%S GMT", &t)) {
      *dt = mktime(&t);
    }
  }
  return __DATE__ " " __TIME__ " GMT";
}

const char *SprinklerDevice::logLevel() {
  switch (loglevel) {
    case logError:
      return "error";
    case logWarn:
      return "warn";
    case logInfo:
      return "info";
  }
  return "none";
}

logLevel_t SprinklerDevice::logLevel(const char *level) {
  if (strcmp(level, "none") == 0) {
    loglevel = logNone;
  } else if (strcmp(level, "error") == 0) {
    loglevel = logError;
  } else if (strcmp(level, "warn") == 0) {
    loglevel = logWarn;
  } else if (strcmp(level, "info") == 0) {
    loglevel = logInfo;
  }
  return (logLevel_t)loglevel;
}

const String SprinklerDevice::hostname(const char *name) {
  if (strlen(name) > 0) {
    if (!host_name.equals(name)) {
      host_name = name;
    }
  }

  return host_name;
}

const String SprinklerDevice::dispname(const char *name) {
  if (strlen(name) > 0) {
    if (!disp_name.equals(name)) {
      disp_name = name;
    }
  }

  return disp_name;
}

SprinklerConfig SprinklerDevice::load() {
  console.println("Reading...");
  EEPROM.begin(EEPROM_SIZE);

  SprinklerConfig cfg;
  EEPROM.get(0, cfg);

  if (full_name.equals(cfg.full_name)) {
    console.print("Log Level: ");
    console.println(cfg.loglevel);
    loglevel = cfg.loglevel;
    console.print("Disp. Name: ");
    console.println(cfg.disp_name);
    disp_name = cfg.disp_name;
    console.print("Host. Name: ");
    console.println(cfg.host_name);
    host_name = cfg.host_name;
    console.print("Revision: ");
    console.println(cfg.version);
    version = cfg.version;
  } else {
    console.println("not found.");
  }

  EEPROM.end();

  return cfg;
}

void SprinklerDevice::save(SprinklerConfig cfg) {
  strcpy(cfg.disp_name, disp_name.c_str());
  strcpy(cfg.host_name, host_name.c_str());
  strcpy(cfg.full_name, full_name.c_str());
  cfg.loglevel = loglevel;
  cfg.version = version + 1;
  console.println("save");
  EEPROM.begin(EEPROM_SIZE);
  EEPROM.put(0, cfg);
  EEPROM.end()
}

void SprinklerDevice::clear() {
  console.println("clear");
  for (int i = 0; i < EEPROM.length(); i++) {
    EEPROM.write(i, 0);
  }
  EEPROM.commit();
}

uint8_t SprinklerDevice::toggle(uint8_t relay) {
  if (relay < sizeof(pins)) {
    uint8_t val = digitalRead(pins[relay]);
    digitalWrite(pins[relay], !val);
    bitWrite(relays, relay, val);

    return !val;
  }

  return 255;
}

uint8_t SprinklerDevice::turnOn(uint8_t relay) {
  if (relay < sizeof(pins) && !bitRead(relays, relay)) {
    digitalWrite(pins[relay], LOW);
    bitWrite(relays, relay, 1);

    return 1;
  }

  return 255;
}

uint8_t SprinklerDevice::turnOff(uint8_t relay) {
  if (relay < sizeof(pins) && bitRead(relays, relay)) {
    digitalWrite(pins[relay], HIGH);
    bitWrite(relays, relay, 0);

    return 0;
  }

  return 255;
}

void SprinklerDevice::reset() {
  console.println("clear");
  for (int i = 0; i < EEPROM.length(); i++) {
    EEPROM.write(i, 0);
  }
  EEPROM.commit();

  WiFi.disconnect(true);
  ESP.restart();
}

void SprinklerDevice::restart() {
  ESP.restart();
}