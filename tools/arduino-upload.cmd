@set ip=%1
@echo off
if "%ip%"=="" set /p "ip=Enter IP or Hostname: " || set ip=192.168.1.110
@echo on
curl -F "firmware=@../.bin/arduino.ino.bin" %ip%/esp/update > ../.logs/update.log
