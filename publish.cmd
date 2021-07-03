xcopy /s .\.bin\arduino.ino.bin \\nuc\sites\ota\sprinkler_v2.bin* /Y
rem curl -F "firmware=@./.bin/arduino.ino.bin" 192.168.1.210/esp/update