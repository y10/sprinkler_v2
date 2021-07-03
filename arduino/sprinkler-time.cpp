#include "sprinkler-time.h"

static WsConsole console("time");
time_t builtDateTime = (time_t)0;
time_t syncTime = (time_t)0;

time_t sync() {
  console.println("Connecting time server...");
  int tryCount = 0;
  while (tryCount++ < 8)  // wait for 2 seconds
  {
    delay(250);
    Serial.print(".");
    time_t t = syncTime = time(nullptr);
    if (t > builtDateTime) {
      Serial.println(".");
      setTime(t);
      console.println((String)day(t) + " " + (String)monthShortStr(month(t)) + " " + (String)year(t) + " " + (String)hour(t) + ":" + (String)minute(t));
      Sprinkler.attach();
      return t;
    }
  }
  return (time_t)0;
}

void setupTime() {
  console.print("Built: ");
  const char* builtDate = Sprinkler.builtDate(&builtDateTime);
  console.println(builtDate);
  setSyncProvider(0);
  configTime(60 * 60 * NTP_TIMEZONE, 0, NTP_SERVER1, NTP_SERVER2, NTP_SERVER3);
  if (!sync()) {
    setTime(builtDateTime);
    Sprinkler.attach();
    console.warn("Failed.");
  }
}

void handleTicks() {
  time_t t = time(nullptr);
  if (t < builtDateTime) {
    if ((t - syncTime) > 60000) {
      if (!sync()) return;
    }
  }

  Alarm.serviceAlarms();
}
