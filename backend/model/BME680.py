from smbus import SMBus
import time


class Bme680:
    def __init__(self, i2c_address, timeout_duration=5) -> None:
        self.__i2c_address = i2c_address
        self.i2c = SMBus()
        self.i2c.open(1)
        if self.get_sensor_id() != 0x61:
            raise ValueError("Sensor ID niet juist")
        self.soft_reset()
        self.sleep()
        self.t_fine = None
        self.temp_comp = None
        self.press_comp = None
        self.hum_comp = None
        self.timeout_duration = timeout_duration
        self.const_array_1_int = [
            2147483647,
            2147483647,
            2147483647,
            2147483647,
            2147483647,
            2126008810,
            2147483647,
            2130303777,
            2147483647,
            2147483647,
            2143188679,
            2136746228,
            2147483647,
            2126008810,
            2147483647,
            2147483647,
        ]
        self.const_array_2_int = [
            4096000000,
            2048000000,
            1024000000,
            512000000,
            255744255,
            127110228,
            16016016,
            8000000,
            4000000,
            2000000,
            1000000,
            500000,
            250000,
            125000,
        ]
        self.spi_disabled()

    def spi_disabled(self):
        self.write_to_register(0x72, 0x40, 0, 6)
        self.write_to_register(0x75, 0x01, 0, 0)
        self.write_to_register(0x73, 0x08, 0, 4)

    def turn_on(self):
        # sensor aan leggen
        self.write_to_register(0x72, 0x03, 0x01, 0)

    def soft_reset(self):
        self.write_to_register(0x60, 0xFF, 0xB6, 0)
        time.sleep(0.01)

    def sleep(self):
        self.write_to_register(0x72, 0x03, 0x00, 0)

    def get_sensor_id(self):
        xD0 = self.i2c.read_byte_data(self.__i2c_address, 0xD0)
        return xD0

    def write_to_register(self, register, bitlocation, bits, startbit):
        """de bits worden geshift, dus zorg dat uw data bits altijd links staan, geef startbit een int van de beginbit mee\n"""
        try:
            hex_reg = self.i2c.read_byte_data(self.__i2c_address, register)
            bitlocation_inverted = (~bitlocation) & 0xFF
            hex_reg &= bitlocation_inverted
            hex_reg |= bits << startbit
            self.i2c.write_byte_data(self.__i2c_address, register, hex_reg)
        except IOError as er:
            print("Operation failed: ", er)

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

    def __set_temperature_oversampling(self, oversampling):
        osrs_t = self.__oversampling_to_binary(oversampling)
        self.write_to_register(0x74, 0b11100000, osrs_t, 5)
        # print(hex(self.__read_register(0x74)))

    def __set_humidity_oversampling(self, oversampling):
        osrs_h = self.__oversampling_to_binary(oversampling)
        self.write_to_register(0x72, 0x07, osrs_h, 0)

    def __set_pressure_oversampling(self, oversampling):
        osrs_p = self.__oversampling_to_binary(oversampling)
        self.write_to_register(0x74, 0b00011100, osrs_p, 2)

    def __duration_to_binary(self, duration) -> int:
        if type(duration) == int:
            if 64 >= duration:
                fact_bits = 0b00
                duration_bits = duration
            elif 256 >= duration > 64:
                fact_bits = 0b01
                duration_bits = int(duration / 4)
            elif 1024 >= duration > 256:
                fact_bits = 0b10
                duration_bits = int(duration / 16)
            elif 4096 >= duration > 1024:
                fact_bits = 0b11
                duration_bits = int(duration / 64)
            else:
                raise ValueError("Duration must be between 0 - 4096")
            binary = duration_bits & (fact_bits << 6)
            return binary
        else:
            raise TypeError("Wrong datatype duration")

    def __read_register_block(self, register, length):
        val_list = self.i2c.read_i2c_block_data(self.__i2c_address, register, length)
        return val_list

    def __read_register(self, register):
        return self.i2c.read_byte_data(self.__i2c_address, register)

    def __set_gas_wait(self, duration, register) -> None:
        """for register: set register 0 - 10"""
        register_x = 0x64 + register
        bin_heat_duration = self.__duration_to_binary(duration)
        self.write_to_register(register_x, 0xFF, bin_heat_duration, 0)

    def get_temp(self):
        print(hex(self.__read_register(0x74)))
        temp_adc_list = self.__read_register_block(0x22, 3)
        xlsb, lsb, msb = temp_adc_list[2], temp_adc_list[1], temp_adc_list[0]
        temp_adc = self.__convert_very_little_endian(xlsb, lsb, msb)
        par_t_1_list = self.__read_register_block(0xE9, 2)
        par_t1 = self.__convert_little_endian(par_t_1_list)
        par_t2 = self.__convert_little_endian(self.__read_register_block(0x8A, 2))
        par_t3 = self.__read_register(0x8C)

        var1 = (temp_adc >> 3) - (par_t1 << 1)
        var2 = (var1 * par_t2) >> 11
        var3 = ((var1 >> 1) * (var1 >> 1)) >> 12
        var3 = ((var3) * (par_t3 << 4)) >> 14

        # Save teperature data for pressure calculations
        t_fine = var2 + var3
        self.t_fine = t_fine
        temp_comp = ((t_fine * 5) + 128) >> 8
        self.temp_comp = temp_comp
        # print(
        #     f"par_t1:\t{par_t1}\npar_t2:\t{par_t2}\npar_t3:\t{par_t3}\ntemp_adc:\t{temp_adc}\nvar1:\t{var1}\nvar2:\t{var2}\nvar3:\t{var3}\nt_fine:\t{t_fine}\ntemp_comp:\t{temp_comp/100}\n"
        # )
        return temp_comp

    def get_temp_in_c(self):
        return self.get_temp() / 100

    def calculate_pressure(self):
        par_p6 = self.__read_register(0x99)
        par_p5 = self.__convert_little_endian(self.__read_register_block(0x96, 2))
        par_p4 = self.__convert_little_endian(self.__read_register_block(0x94, 2))
        par_p3 = self.__read_register(0x92)
        par_p2 = self.__convert_little_endian(self.__read_register_block(0x90, 2))
        par_p1 = self.__convert_little_endian(self.__read_register_block(0x8E, 2))
        list_p_adc = self.__read_register_block(0x1F, 3)
        msb, lsb, xlsb = list_p_adc
        press_raw = self.__convert_very_little_endian(xlsb, lsb, msb)
        par_p9 = self.__convert_little_endian(self.__read_register_block(0x9E, 2))
        par_p8 = self.__convert_little_endian(self.__read_register_block(0x9C, 2))
        par_p10 = self.__read_register(0xA0)
        par_p7 = self.__read_register(0x98)

        var1 = ((self.t_fine) >> 1) - 64000
        var2 = ((((var1 >> 2) * (var1 >> 2)) >> 11) * par_p6) >> 2
        var2 = var2 + ((var1 * par_p5) << 1)
        var2 = (var2 >> 2) + (par_p4 << 16)
        var1 = ((((var1 >> 2) * (var1 >> 2)) >> 13) * ((par_p3 << 5)) >> 3) + (
            (par_p2 * var1) >> 1
        )
        var1 = var1 >> 18

        var1 = ((32768 + var1) * par_p1) >> 15
        calc_pressure = 1048576 - press_raw
        calc_pressure = (calc_pressure - (var2 >> 12)) * (3125)

        if calc_pressure >= (1 << 31):
            calc_pressure = (calc_pressure // var1) << 1
        else:
            calc_pressure = (calc_pressure << 1) // var1

        var1 = (par_p9 * (((calc_pressure >> 3) * (calc_pressure >> 3)) >> 13)) >> 12
        var2 = ((calc_pressure >> 2) * par_p8) >> 13
        var3 = (
            (calc_pressure >> 8) * (calc_pressure >> 8) * (calc_pressure >> 8) * par_p10
        ) >> 17

        press_comp = (calc_pressure) + ((var1 + var2 + var3 + (par_p7 << 7)) >> 4)

        self.press_comp = press_comp
        return press_comp

    def get_pressure(self):

        pressure = self.calculate_pressure() / 100.0
        return pressure

    def calculate_humidity(self):
        data = self.__read_register_block(0xE1, 8)
        hum_adc = self.__convert_big_endian(self.__read_register_block(0x25, 2))
        par_h1 = (((data[1] & 0x0F) << 4) | data[2] << 8) >> 4
        par_h2 = (((data[1] & 0xF0)) | data[0] << 8) >> 4
        par_h3 = data[3]
        par_h4 = data[4]
        par_h5 = data[5]
        par_h6 = data[6]
        par_h7 = data[7]

        temp_scaled = self.temp_comp
        var1 = hum_adc - (par_h1 << 4) - ((temp_scaled * par_h3) // 100) >> 1
        var2 = (
            par_h2 * ((temp_scaled * par_h4) // 100)
            + (
                ((temp_scaled * ((temp_scaled * par_h5) // 100)) >> 6) // 100
                + ((1 << 14))
            )
        ) >> 10
        var3 = var1 * var2
        var4 = ((par_h6 << 7) + ((temp_scaled * par_h7) // 100)) > 4
        var5 = ((var3 >> 14) * (var3 >> 14)) >> 10
        var6 = (var4 * var5) >> 1
        self.hum_comp = (((var3 + var6) >> 10) * 1000) >> 12
        return self.hum_comp

    def get_humidity(self):
        return self.calculate_humidity() / 1000.0

    def set_heater_temp(self, target_temp, register=0):
        """Set heater temp in C, target temp is heater temp in C"""
        # amb_temp = Required to measure first
        if 200 < target_temp < 400:
            if not self.temp_comp:
                temp_comp = 20
            else:
                temp_comp = self.temp_comp

            pars = self.__read_register_block(0xEB, 4)
            par_g1 = pars[-2]
            par_g3 = pars[-1]
            par_g2 = self.__convert_big_endian(pars[0:2])
            res_heat_range = (self.__read_register(0x02) & 0x3F) >> 4
            res_heat_val = self.__read_register(0x00)

            var1 = ((temp_comp * par_g3) // 1000) << 8
            var2 = (par_g1 + 784) * (
                ((((par_g2 + 154009) * target_temp * 5) // 100) + 3276800) // 10
            )
            var3 = var1 + (var2 >> 1)
            var4 = var3 // (res_heat_range + 4)
            var5 = (131 * res_heat_val) + 65536
            res_heat_x100 = ((var4 // var5) - 250) * 34
            res_heat_x = (res_heat_x100 + 50) // 100
            self.res_heat_x = res_heat_x
            self.res_heat_x100 = res_heat_x100
            self.write_to_register(0x5A + register, 0xFF, res_heat_x, 0)
            return res_heat_x
        else:
            raise ValueError("Give a sensible temperature")

    def read_gas(self) -> int:
        self.check_new_data()
        if not self.check_gas():
            raise ValueError("Something went wrong in heater")

        gas_adc_raw = self.__read_register_block(0x2A, 2)
        range_switching_error = self.__read_register(0x04)
        gas_range = gas_adc_raw & 0xF
        lsb = (gas_adc_raw[1] & 0xC0) >> 6
        msb = gas_adc_raw[0] << 2
        gas_adc = lsb | msb

        var1 = (
            ((1340 + (5 * range_switching_error)) * self.const_array_1_int[gas_range])
        ) >> 16
        var2 = (gas_adc << 15) - (1 << 24) + var1
        gas_res = (
            ((self.const_array_2_int[gas_range] * var1) >> 9) + var2 >> 1
        ) // var2
        self.gas_res = gas_res
        return gas_res

    def check_new_data(self):
        start = time.time()
        while not (self.__read_register(0x1D) & 0x80):
            print("no new data yet")
            time.sleep(0.05)
            if time.time() - self.timeout_duration > start:
                raise TimeoutError("No new data...")
        print("NEW DATA!")

    def check_gas(self):
        x2b = self.__read_register(0x2B)
        gas_valid = x2b & 0x20
        heater_stable = x2b & 0x10
        if not heater_stable:
            print("Heater not stable")
            return False
        if not gas_valid:
            print("Gas not valid")
            return False
        return True

    def wait_for_gas_measurement(self):
        while not (self.__read_register(0x1D) & 0x40):
            time.sleep(0.1)
            print("waiting for gas measurement to finish")

    def __set_res_heat_x(self, resistance, register) -> None:
        """For register: set register to 0 - 10,"""
        pass

    def set_nb_conv(self, preset):
        if 0 <= preset <= 9:
            self.write_to_register(0x71, 0x0F, preset, 0)

    def enable_run_gas(self, val):
        """True: enable gas \nFalse: Disable gas"""
        if type(val == bool):
            self.write_to_register(0x71, 0x10, val, 4)
        else:
            raise TypeError("Pls provide a bool")

    def __convert_big_endian(self, list_bytes):
        value = list_bytes[1] | (list_bytes[0] << 8)
        # if value & 0x8000:
        #     value -= 2**16
        return value

    def __convert_very_little_endian(self, xlsb, lsb, msb) -> int:
        value = ((msb << 16) | (lsb << 8) | xlsb) >> 4
        return value

    def __convert_little_endian(self, list_val) -> int:
        val = list_val[0] | (list_val[1] << 8)
        return val

    def set_oversampling(self, humidity, temperature, pressure):
        self.__set_humidity_oversampling(humidity)
        self.__set_temperature_oversampling(temperature)
        self.__set_pressure_oversampling(pressure)

    # def read(self):
    # self.i2c.(self.__i2c_address, 0x3B, 6)

    def read_status(self):
        val = self.__read_register(0x1D) & 0x20
        return val

    def wait_for_measurement(self):
        """If sensor is measuring, wait"""
        while not self.read_status():
            print("Sensor is still measuring")
            time.sleep(0.2)

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
        self.write_to_register(0x75, 0b00011100, filter_binary, 2)
