from mimetypes import init
from operator import imod
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
        self.__initial = 20
        self.__fan_mode = 0  # 0 = auto, 1 = man

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
        self.__t = time()

    # ********** property rpm - (enkel getter) ***********
    @property
    def rpm(self):
        """FAN RPM (ROTATIONS PER MINUTE)"""
        # print(self.__rpm)
        return self.__rpm

    # ********** property pwm_speed - (setter/getter) ***********
    @property
    def pwm_speed(self):
        """FAN PWM speed, val(0-100)"""
        return self.__pwm_speed

    @pwm_speed.setter
    def pwm_speed(self, value):
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
