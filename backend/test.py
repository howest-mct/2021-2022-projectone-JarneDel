from model.pms5003 import Pms5003
from RPi import GPIO
from serial import Serial, PARITY_NONE
from time import sleep

pms = Pms5003(set=20, reset=21)
pms.setup()
trans_pin_PMS = 19
trans_pin_mhz = 26


def setup_gpio():
    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)
    GPIO.setup((trans_pin_PMS, trans_pin_mhz), GPIO.OUT, initial=0)


def read_mhz19b():
    GPIO.output(trans_pin_mhz, 1)
    GPIO.output(trans_pin_PMS, 0)
    data = serial_send_and_receive(b"\xff\x01\x86\x00\x00\x00\x00\x00\x79")
    GPIO.output(trans_pin_mhz, 0)
    val = int.from_bytes(data[2:4], "big")
    return val


def serial_send_and_receive(msg):

    with Serial(
        "/dev/ttyS0",
        9600,
        bytesize=8,
        parity=PARITY_NONE,
        stopbits=1,
        timeout=3,
    ) as port:
        try:
            port.write(msg)
            return port.read(9)

        except Exception as ex:
            print(f"Er is een fout opgetreden: {ex}")
            return " "


def read_pms():
    GPIO.output(trans_pin_mhz, 0)
    GPIO.output(trans_pin_PMS, 1)
    list_data, dict_data = pms.read()
    GPIO.output(trans_pin_PMS, 0)
    return list_data, dict_data


setup_gpio()

while True:
    print(read_mhz19b())
    sleep(1)
    list_data, dict_data = read_pms()
    print(dict_data)
    sleep(1)
