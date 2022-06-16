import logging
from RPi import GPIO
from time import time


class Fan:
    def __init__(self, PWM, TACH, PULSE=2, initial=20) -> None:
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)
        GPIO.setup(TACH, GPIO.IN, pull_up_down=GPIO.PUD_UP)  # Pull up to 3.3V
        self.TACH = TACH
        self.PWM = PWM
        self.PULSE = PULSE
        self.__t = time()
        self.__rpm = 0
        self.__initial = initial
        self.__fan_mode = 0  # 0 = auto, 1 = man
        self.__list_last_vals = []
        self.__old_val = []

    def start(self):
        GPIO.add_event_detect(self.TACH, GPIO.FALLING, self.callback_tacho_meter)
        GPIO.setup(self.PWM, GPIO.OUT)
        self.__pwm_channel = GPIO.PWM(self.PWM, 25000)  # Pin, Frequentie
        self.__pwm_channel.start(self.__initial)  # duty cycle/ start the channel

    def stop(self):
        self.__pwm_channel.stop()

    def callback_tacho_meter(self, pin):
        dt = time() - self.__t
        if dt < 0.005:
            return
            # pulses die te kort zijn negeren.
            # max fan speed ~~ 5K RPM --> *2 = 10K pulses / min
            # ~~ 6 ms

        frequentie = 1 / dt
        self.__rpm = (frequentie / self.PULSE) * 60
        self.__list_last_vals.append(self.__rpm)
        if len(self.__list_last_vals) > 50:
            self.__list_last_vals.pop(0)
        self.__t = time()

    # ********** property rpm - (enkel getter) ***********
    @property
    def rpm(self):
        """FAN RPM (ROTATIONS PER MINUTE)"""
        sum_val = sum(self.__list_last_vals)
        if sum_val == self.__old_val:
            return 0
        if len(self.__list_last_vals) != 0:
            avg_rpm = sum_val / (len(self.__list_last_vals))
        else:
            avg_rpm = -1
        self.__old_val = sum_val
        return round(avg_rpm, 0)

    # ********** property pwm_speed - (setter/getter) ***********
    @property
    def pwm_speed(self):
        """FAN PWM speed, val(0-100)"""
        return self.__pwm_speed

    @pwm_speed.setter
    def pwm_speed(self, value):
        value = int(value)
        if 0 <= value <= 100:
            self.__pwm_speed = value
            self.__pwm_channel.ChangeDutyCycle(value)

    # ********** property fan_mode - (setter/getter) ***********
    @property
    def fan_mode(self):
        """The fan_mode property."""
        return self.__fan_mode

    @fan_mode.setter
    def fan_mode(self, value):
        self.__fan_mode = value

    # ********** property auto_fan_speed - (setter/getter) ***********
    @property
    def auto_fan_speed(self):
        """The auto_fan_speed property."""
        return self.__auto_fan_speed

    @auto_fan_speed.setter
    def auto_fan_speed(self, value):
        self.__auto_fan_speed = value
