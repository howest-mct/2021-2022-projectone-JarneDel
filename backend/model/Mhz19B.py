from serial import Serial, PARITY_NONE


class Mhz19B:
    @staticmethod
    def calibrate_mhz10b():
        # zero point calibration
        data = Mhz19B.serial_send_and_receive(b"\xff\x01\x86\x00\x00\x00\x00\x00\x79")
        val = int.from_bytes(data[2:4], "big")
        if val < 420:
            Mhz19B.serial_send_and_receive(b"\xff\x01\x87\x00\x00\x00\x00\x00")
            print("calibrated")

    @staticmethod
    def read():
        data = Mhz19B.serial_send_and_receive(b"\xff\x01\x86\x00\x00\x00\x00\x00\x79")
        val = int.from_bytes(data[2:4], "big")
        return val

    @staticmethod
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
