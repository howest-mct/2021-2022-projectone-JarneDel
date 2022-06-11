import math
import time
import smbus
import logging


class Bme:
    # region init
    def __init__(self, temp_offset=0) -> None:
        self.i2c_address = 0x76
        self.i2c = smbus.SMBus(1)
        self.offset_temp_in_t_fine = 0
        self.chip_id = self.read(0xD0, 1)
        if self.chip_id != 0x61:
            raise RuntimeError("verkeerd id")
        else:
            print("Id is correct", hex(self.chip_id))

        self._variant = self.read(0xF0, 1)
        print("variant:", hex(self._variant))

        self.soft_reset()
        self.set_power_mode(0)
        self.__set_humidity_oversampling(2)
        self.__set_pressure_oversampling(4)
        self.__set_temperature_oversampling(8)
        self.set_IIR_filter(3)
        self.set_gas_status(0x00)
        self.get_calibration_data()
        self.read_data()

    def read(self, register, length):
        if length == 1:
            return self.i2c.read_byte_data(self.i2c_address, register)
        else:
            return self.i2c.read_i2c_block_data(self.i2c_address, register, length)

    def write(self, register, value):
        if type(value) == int:
            self.i2c.write_byte_data(self.i2c_address, register, value)
        else:
            self.i2c.write_i2c_block_data(self.i2c_address, register, value)

    def write_bits(self, register, mask, positie, val):
        hex_reg = self.read(self.i2c_address, 1)
        bitlocation_inverted = (~mask) & 0xFF
        hex_reg &= bitlocation_inverted
        hex_reg |= val << positie
        self.write(register, hex_reg)

    def soft_reset(self):
        self.write(0xE0, 0xB6)
        time.sleep(0.01)

    def set_power_mode(self, value, blocking=True):
        if value not in (0, 1):
            raise ValueError("Wrong value")

        self.power_mode = value

        self.write_bits(0x74, 0x03, 0, value)

        while blocking and self.get_power_mode() != self.power_mode:
            time.sleep(0.01)
            print("blocked")

    def get_power_mode(self):
        """sleep of forced mode krijgen"""
        self.power_mode = self.read(0x74, 1)
        print("Power Mode: ", self.power_mode)
        return self.power_mode

    def __set_humidity_oversampling(self, oversampling):
        osrs_h = self.__oversampling_to_binary(oversampling)
        self.write_bits(0x72, 0x07, 0, osrs_h)

    def __set_pressure_oversampling(self, oversampling):
        osrs_p = self.__oversampling_to_binary(oversampling)
        self.write_bits(0x74, 0b00011100, 2, osrs_p)

    def __set_temperature_oversampling(self, oversampling):
        osrs_t = self.__oversampling_to_binary(oversampling)
        self.write_bits(0x74, 0b11100000, 5, osrs_t)

    @staticmethod
    def __oversampling_to_binary(oversampling):
        """Returns the binary value of oversampling <2:0>"""
        if oversampling == 0:
            osrs = 0b000
            # oversampling passed
        elif oversampling == 1:
            osrs = 0b001
        elif oversampling == 2:
            osrs = 0b010
        elif oversampling == 4:
            osrs = 0b011
        elif oversampling == 8:
            osrs = 0b100
        elif oversampling == 16:
            osrs = 0b101
        else:
            raise ValueError("Wrong oversampling value returned")
        return osrs

    @staticmethod
    def filter_to_binary(filter):
        if filter == 0:
            return 0
        elif filter == 1:
            return 1
        elif filter == 3:
            return 2
        elif filter == 7:
            return 3
        elif filter == 15:
            return 4
        elif filter == 31:
            return 5
        elif filter == 63:
            return 6
        elif filter == 127:
            return 7
        else:
            raise ValueError("Data not present in lookup table")

    def set_IIR_filter(self, filter):
        filter_binary = self.filter_to_binary(filter)
        self.IIR_filter = filter_binary
        self.write_bits(0x75, 0b00011100, 2, filter_binary)

    def set_gas_status(self, val):
        self.write_bits(0x71, 0x30, 4, val)

    # endregion
    # REGION READsensor

    def read_data(self):
        self.set_power_mode(1)
        for probeer in range(10):
            status = self.read(0x1D, 1)
            print(status & 0x80)
            if (status & 0x80) == 0:
                time.sleep(0.01)
                continue
            registers = self.read(0x1D, 17)
            print(registers)
            self.data_status = registers[0] & 0x80
            self.data_gas_index = registers[0] & 0x0F
            self.data_meas_index = registers[1]

            adc_pressure = self.__convert_very_little_endian(
                registers[4], registers[3], registers[2]
            )
            adc_temp = self.__convert_very_little_endian(
                registers[7], registers[6], registers[5]
            )
            adc_hum = self.__convert_big_endian(registers[8:10])
            logging.debug(
                f"""ADC_temp, {hex(adc_temp)}, ADC_pressure {hex(adc_pressure)} ADC_hum: {hex(adc_hum)}\nADC_temp, {adc_temp}, ADC_pressure {(adc_pressure)} ADC_hum: {(adc_hum)}"""
            )

            adc_gas_res_low = (registers[13] << 2) | (registers[14] >> 6)
            adc_gas_res_high = (registers[15] << 2) | (registers[16] >> 6)
            gas_range_l = registers[14] & 0x0F
            gas_range_h = registers[16] & 0x0F
            self.data_status |= registers[14] & 0x20
            self.data_status |= registers[14] & 0x10
            self.data_heat_stable = self.data_status & 0x10 > 0
            temperature = self.calc_temp(adc_temp)
            print(temperature, "in graden c")

    def get_temp_in_c(self):
        return self.get_temp() / 100

    def calc_temp(self, temp_adc):
        """convert raw temp to temp in C"""
        var1 = (temp_adc >> 3) - (self.temp_par_t1 << 1)
        var2 = (var1 * self.temp_par_t2) >> 11
        var3 = ((var1 >> 1) * (var1 >> 1)) >> 12
        var3 = ((var3) * (self.temp_par_t3 << 4)) >> 14

        # Save teperature data for pressure calculations
        self.t_fine = (var2 + var3) + self.offset_temp_in_t_fine

        calc_temp = ((self.t_fine * 5) + 128) >> 8
        return calc_temp

    @staticmethod
    def __convert_little_endian(list_val) -> int:
        val = list_val[0] | (list_val[1] << 8)
        return val

    @staticmethod
    def __convert_very_little_endian(xlsb, lsb, msb) -> int:
        value = ((msb << 16) | (lsb << 8) | xlsb) >> 4
        return value

    @staticmethod
    def __convert_big_endian(list_bytes):
        value = list_bytes[1] | (list_bytes[0] << 8)
        # if value & 0x8000:
        #     value -= 2**16
        return value

    def get_calibration_data(self):
        par_t_1_list = self.read(0xE9, 2)
        self.temp_par_t1 = self.__convert_little_endian(par_t_1_list)
        self.temp_par_t2 = self.__convert_little_endian(self.read(0x8A, 2))
        self.temp_par_t3 = self.read(0x8C, 1)
