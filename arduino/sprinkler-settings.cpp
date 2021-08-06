#include "sprinkler-settings.h"
#include "html/settings.json.h"

void SprinklerZone::name(const char *value)
{
    uint8_t val_Len = strlen(value);
    uint8_t name_len = sizeof(Name);
    strncpy(Name, value, name_len);
    if (val_Len > name_len)
    {
        Name[name_len - 1] = 0;
    }
}

void SprinklerZone::fromJSON(JsonObject json)
{
    name(json["name"].as<char *>());
    Schedule.fromJSON(json["days"].as<JsonObject>());
}

void SprinklerZone::fromConfig(SprinklerZoneConfig &config)
{
    if (config.defined)
    {
        name(config.disp_name);
        Schedule.fromConfig(config);
    }
}

SprinklerZoneConfig SprinklerZone::toConfig()
{
    SprinklerZoneConfig cfg = Schedule.toConfig();
    cfg.defined = true;
    strcpy(cfg.disp_name, name().c_str());
    return cfg;
}

void SprinklerSettings::fromJSON(JsonObject json)
{
    reset();

    for (JsonPair kv : json)
    {
        String key = kv.key().c_str();
        unsigned int zoneid = key.toInt();
        JsonObject value = kv.value().as<JsonObject>();
        SprinklerZone *zone = new SprinklerZone(zoneid, onTimerTick);
        zone->fromJSON(value);
        zones[zoneid] = zone;
    }
}

void SprinklerSettings::fromConfig(SprinklerConfig &config)
{
    reset();

    for (uint8_t i = 0; i < SKETCH_MAX_ZONES; i++)
    {
        unsigned int zoneid = i + 1;
        if (config.zones[i].defined)
        {
            SprinklerZone *zone = new SprinklerZone(zoneid, onTimerTick);
            zone->fromConfig(config.zones[i]);
            zones[zoneid] = zone;
        }
    }
}

SprinklerConfig SprinklerSettings::toConfig()
{
    SprinklerConfig config;
    memset(&config, 0, sizeof(SprinklerConfig));
    for (const auto &kv : zones)
    {
        unsigned int zoneid = kv.first;
        SprinklerZone *zone = kv.second;
        config.zones[zoneid-1] = zone->toConfig();
    }
    return config;
}

String SprinklerSettings::toJSON()
{
    String json = "{";
    String coma = "";
    for (const auto &kv : zones)
    {
        unsigned int zoneid = kv.first;
        SprinklerZone *zone = kv.second;
        json += coma + "\"" + (String)zoneid + "\": " + zone->toJSON();
        coma = ",";
    }
    json += "}";
    return json;
}
