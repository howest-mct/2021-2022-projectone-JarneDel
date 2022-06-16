from model.BME680 import Bme680
from time import sleep

bme = Bme680(0x77)
bme.soft_reset()
bme.set_oversampling(1, 2, 16)
bme.set_heater_temp(300)
bme.set_nb_conv(0)
bme.enable_run_gas(True)
print(hex(bme.get_sensor_id()))
try:
    while True:
        bme.turn_on()
        # bme.wait_for_measurement()
        print(bme.get_temp_in_c())
        print(bme.get_pressure())
        print(bme.get_humidity())
        print(bme.read_gas())
        # bme.sleep()
        sleep(5)
except KeyboardInterrupt:
    pass
finally:
    pass
