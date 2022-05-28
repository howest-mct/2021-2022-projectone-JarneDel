from serial import Serial, PARITY_NONE
from RPi import GPIO
from time import sleep, time


GPIO.setmode(GPIO.BCM)


class Pms5003:
    def __init__(self, set=20, reset=21, interface="/dev/ttyS0") -> None:
        self.PMS5003_SOF = b"\x42\x4d"
        self.SET = set
        self.RESET = reset
        self.interface = interface

    def setup(self):

        GPIO.setup((self.SET, self.RESET), GPIO.OUT, initial=GPIO.HIGH)



    @staticmethod
    def __convert_big_indian(list_bytes):
        value = list_bytes[1] | (list_bytes[0] << 8)
        if value & 0x8000:
            value -= 2**16
        return value

    def ruwe_waarden_uitlezen(self):
        start = time()

        sof_index = 0
        with Serial(
            self.interface,
            9600,
            8,
            PARITY_NONE,
            1,
            4,
        ) as port:
            while True:
                delta_t = time() - start
                if delta_t > 5:
                    print("Timout, start niet gevonden")

                # eerste keer: lees eerste SOF byte uit
                # tweede keer: lees tweede SOF byte uit
                sof = port.read(1)
                # print(sof)
                # print("SOF", hex(ord(sof)))
                if len(sof) == 0:
                    print("leesfout ofzo")
                # checken of de start of frame bytes wel van het type bytes zijn
                if type(sof) is bytes:
                    # bytes zijn ambetant omda ze veranderd worden naar een ascii teken
                    # ord(start of frame, verandert dit gewoon terug in een hex waarde)
                    sof = ord(sof)

                # doet twee dingen: checkt of de eerste byte overeenkomt, zelfde voor de tweede, als 0x4d niet volgt op 0x42
                # wordt er opnieuw
                if sof == self.PMS5003_SOF[sof_index]:
                    if sof_index == 0:
                        sof_index = 1
                    elif sof_index == 1:
                        # Start of frame gevonden, nu uitlezen
                        break
                else:
                    sof_index = 0

            # print("'t is gelukt")

            data = port.read(2)  # framelengte checken
            if len(data) != 2:
                print("lengte packet niet gevonden")
            # print("Frame lengte", data)  # print 0x001c --> lengte 28
            list_frame_lengte = list(data)
            converted_frame_length = self.__convert_big_indian(list_frame_lengte)

            sensorData = port.read(converted_frame_length)
            # print(sensorData)
            if len(sensorData) != converted_frame_length:
                print("Lengte van de data is verkeerd")

            # print(
            #     sensorData
            # )  # enkel de bytes die je uitleest, moet nog verder omgezet worden.
            return sensorData[:-4]

    def read(self):
        ruwe_data = self.ruwe_waarden_uitlezen()
        list_val = []
        print(int(len(ruwe_data) / 2))

        for i in range(int(len(ruwe_data) / 2)):
            list_val.append(self.__convert_big_indian(ruwe_data[i * 2 : i * 2 + 2]))
        # besloten om toch gewoon de lijst terug te sturen...
        dict = {}
        # CF1 is enkel voor in "Factory enviroment"
        dict["PM1_CF1"] = list_val[0]
        dict["PM2.5_CF1"] = list_val[1]
        dict["PM10_CF1"] = list_val[2]
        dict["PM1_AP"] = list_val[3]
        dict["PM2.5_AP"] = list_val[4]
        dict["PM10_AP1"] = list_val[5]

        dict["NOP_0.3um"] = list_val[6]
        dict["NOP_0.5um"] = list_val[7]
        dict["NOP_1um"] = list_val[8]
        dict["NOP_2.5um"] = list_val[9]
        dict["NOP_5um"] = list_val[10]
        dict["NOP_10um"] = list_val[11]
        return list_val, dict
