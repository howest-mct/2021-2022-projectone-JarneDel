from serial import Serial, PARITY_NONE
import logging
import time

logging.basicConfig(level=logging.DEBUG)


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
            logging.error(f"Er is een fout opgetreden: {ex}")
            return " "


n = 0
tot_val = 0
once = False
# zero point calibration
try:
    while True:
        ding = serial_send_and_receive(b"\xff\x01\x86\x00\x00\x00\x00\x00\x79")
        val = int.from_bytes(ding[2:4], "big")
        if val < 420 and once:
            serial_send_and_receive(b"\xff\x01\x87\x00\x00\x00\x00\x00")
            once = False
            print("calibrate")
        n += 1
        tot_val += val

        print(
            f"val: {val}, avg: {round(tot_val/n,2)} , color = {'green' if val < 900 else ''}{'orange' if 900 < val < 1500 else ''}{'Red' if val > 1500 else ''}"
        )
        time.sleep(1)
except KeyboardInterrupt:
    pass
finally:
    pass
