#include "Arduino.h"
#include "WsConsole.h"

std::unique_ptr<AsyncWebSocket> wss;
logLevel_t loglevel = logInfo;
std::vector<log_t> logs;
size_t logIndex = 0;

WsConsole::WsConsole(const char *scope)
    : logScope(scope)
{
}

void WsConsole::begin(unsigned long baud)
{
    Serial.begin(baud);
    Serial.println();
}

void WsConsole::logLevel(logLevel_t level) { loglevel = level; }

void WsConsole::attach(AsyncWebSocket *wsp)
{
    if (loglevel == logNone)
        return;

    if (!wss)
        wss.reset(wsp);
}

void WsConsole::error(const String text)
{
    if (loglevel != logError)
        return;

    Serial.printf("[error] %s\r\n", text.c_str());

    broadcast((log_t){
        logError,
        logScope,
        text});
}

void WsConsole::warn(const String text)
{
    if (loglevel < logWarn)
        return;

    Serial.printf("[warn] %s\r\n", text.c_str());

    broadcast((log_t){
        logWarn,
        logScope,
        text});
}

size_t WsConsole::write(const uint8_t *data, size_t size)
{
    if (loglevel == logNone)
        return 0;

    size_t len = Serial.write(data, size);
    log.write(data, size);
    int index = log.indexOf("\r\n");
    if (index != -1)
    {
        String line = log.substring(0, index);
        broadcast((log_t){
            logInfo,
            logScope,
            line});

        String rem = log.substring(index + 2);
        log.clear();
        log.concat(rem);
    }

    return len;
}

void WsConsole::broadcast(log_t log)
{
    log.entry.replace("\"", "\\\"");
    log.entry.replace("\r", "");
    log.entry.replace("\n", "");

    logs.push_back(log);

    if (logs.size() > 1000)
    {
        if (logIndex > 0)
            logIndex--;
        logs.erase(logs.begin());
    }

    if (wss)
    {
        wss->textAll("{ \"event\": " + log.toJson() + " }");
        logIndex++;
    }
}

size_t WsConsole::printTo(Print &p) const
{
    size_t i = 0;
    size_t len = 0;
    len += p.write('[');
    for (auto &log : logs)
    {
        String json = log.toJson();
        if (i != 0)
        {
            len += p.write(", ");
        }

        len += p.write(json.c_str(), json.length());
        i++;
    }
    len += p.write(']');
    return len;
}

WsConsole Console = WsConsole();