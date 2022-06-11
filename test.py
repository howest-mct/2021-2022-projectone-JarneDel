#!/usr/bin/env python

from tests.init import BME680
from tests.constants import BME680Data
import time

print(
    """read-all.py - Displays temperature, pressure, humidity, and gas.
Press Ctrl+C to exit!
"""
)
sensor = BME680(0x77)

# These calibration data can safely be commented
# out, if desired.

print("Calibration data:")
for name in dir(sensor.calibration_data):

    if not name.startswith("_"):
        value = getattr(sensor.calibration_data, name)

        if isinstance(value, int):
            print("{}: {}".format(name, value))

# These oversampling settings can be tweaked to
# change the balance between accuracy and noise in
# the data.

sensor.set_humidity_oversample(2)
sensor.set_pressure_oversample(3)
sensor.set_temperature_oversample(4)
sensor.set_filter(2)
sensor.set_gas_status(-1)

print("\n\nInitial reading:")
for name in dir(sensor.data):
    value = getattr(sensor.data, name)

    if not name.startswith("_"):
        print("{}: {}".format(name, value))

sensor.set_gas_heater_temperature(320)
sensor.set_gas_heater_duration(150)
sensor.select_gas_heater_profile(0)

# Up to 10 heater profiles can be configured, each
# with their own temperature and duration.
# sensor.set_gas_heater_profile(200, 150, nb_profile=1)
# sensor.select_gas_heater_profile(1)

print("\n\nPolling:")
try:
    while True:
        if sensor.get_sensor_data():
            output = "{0:.2f} C,{1:.2f} hPa,{2:.2f} %RH".format(
                sensor.data.temperature, sensor.data.pressure, sensor.data.humidity
            )

            if sensor.data.heat_stable:
                print("{0},{1} Ohms".format(output, sensor.data.gas_resistance))

            else:
                print(output)

        time.sleep(1)

except KeyboardInterrupt:
    pass
