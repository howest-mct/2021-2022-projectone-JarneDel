import imp
from model.Fan import Fan
from time import sleep

fan = Fan(6, 13, 2, initial=100)

while True:
    print(fan.rpm)
    sleep(0.2)
