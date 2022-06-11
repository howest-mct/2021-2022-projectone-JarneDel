from model.BME import Bme
import logging
from time import sleep

logging.basicConfig(level=logging.DEBUG)


while True:
    Bme()
    sleep(3)
