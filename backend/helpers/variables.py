class Globals:
    def __init__(self) -> None:
        self.hum = 0
        self.pm = 0
        self.__last_fan_pwm = 0

    # ********** property hum - (setter/getter) ***********
    @property
    def hum(self):
        """The hum property."""
        return self.__hum

    @hum.setter
    def hum(self, value):
        self.__hum = value

    # ********** property pm - (setter/getter) ***********
    @property
    def pm(self):
        """The pm property."""
        return self.__pm

    @pm.setter
    def pm(self, value):
        self.__pm = value

    # ********** property last_fan_pwm - (setter/getter) ***********
    @property
    def last_fan_pwm(self):
        """The last_fan_pwm property."""
        return self.__last_fan_pwm

    @last_fan_pwm.setter
    def last_fan_pwm(self, value):
        self.__last_fan_pwm = value
