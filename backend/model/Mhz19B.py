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

    def read(self):
        data = Mhz19B.serial_send_and_receive(b"\xff\x01\x86\x00\x00\x00\x00\x00\x79")
        val = int.from_bytes(data[2:4], "big")
        self.__co2 = val
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

    def __init__(self) -> None:
        self.__co2 = 0

    # ********** property co2 - (enkel getter) ***********
    @property
    def co2(self):
        """The co2 property."""
        return self.__co2

    # ********** property co2_percentage - (enkel getter) ***********
    @property
    def co2_percentage(self):
        """The co2_percentage property."""
        return (self.__co2 - 400) / 2000 * 100
