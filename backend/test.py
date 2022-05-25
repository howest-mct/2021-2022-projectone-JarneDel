from model.BME680 import Bme680

bme = Bme680(0x76)
bme.turn_on()
print(hex(bme.get_sensor_id()))
bme.set_oversampling(1, 2, 16)
