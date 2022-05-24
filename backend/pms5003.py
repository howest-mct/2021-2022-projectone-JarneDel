from model.pms5003 import Pms5003
from RPi import GPIO

pms = Pms5003(set=20, reset=21)

try:
    pms.setup()
    while True:
        print(pms.read())
except KeyboardInterrupt:
    pass
finally:
    pms.cleanup()
    GPIO.cleanup
