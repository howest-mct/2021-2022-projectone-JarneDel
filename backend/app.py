import json
import time
from datetime import datetime
from RPi import GPIO
import threading
from subprocess import check_output
from flask_cors import CORS
from flask_socketio import SocketIO, emit, send
from flask import Flask, jsonify, request
from repositories.DataRepository import DataRepository
from bme68x import BME68X
import bme68xConstants as cst
import bsecConstants as bsec

# from selenium import webdriver

from serial import Serial, PARITY_NONE
from model.pms5003 import Pms5003
from model.Fan import Fan
import logging

from selenium import webdriver
from selenium.webdriver.chrome.options import Options


# Code voor Hardware
def setup_gpio():
    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)
    GPIO.setup((trans_pin_PMS, trans_pin_mhz), GPIO.OUT, initial=0)
    fan.start()


# logging setup
logging.basicConfig(
    filename="logs/app_log.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] - [%(filename)s > %(funcName)s() > %(lineno)s] - %(message)s",
)
logger = logging.getLogger("app")

# hieronder zeg je tegen mysql connector dat die enkel bij warn level mag printen, en voor geventwebsocket bij info
logging.getLogger("mysql.connector.connection").setLevel("WARN")
logging.getLogger("geventwebsocket.handler").setLevel("INFO")

# Code voor Flask

app = Flask(__name__)
app.config["SECRET_KEY"] = "3fan6od4@PG$BfGH"
socketio = SocketIO(
    app, cors_allowed_origins="*", logger=False, engineio_logger=False, ping_timeout=1
)
sensor_active = False
endpoint = "/api/v1"
CORS(app)


@socketio.on_error()  # Handles the default namespace
def error_handler(e):
    print(e)


# pms init
pms = Pms5003(set=20, reset=21)
pms.setup()
trans_pin_PMS = 19
trans_pin_mhz = 26

# fan init
fan_pwm = DataRepository.get_last_fan_setting()["setwaarde"]
fan = Fan(6, 13, 2, initial=fan_pwm)


# region Main Thread
def main_thread():
    global sensor_active
    while True:
        if not sensor_active:
            sensor_active = True
            print(sensor_active)
            val = read_mhz19b()
            time.sleep(1)
            list_data, dict_data = read_pms()
            print(dict_data)
            time.sleep(1)
            # steek gelezen waarde in database
            DataRepository.add_data_point(val, 1, 2)
            # broadcast gemeten waarde
            socketio.emit("B2F_CO2", {"CO2": val})
            # voorlopig hardcoded
            for i, datapunt in enumerate(list_data):
                # pm sensor begint bij eenheidID2
                DataRepository.add_data_point(datapunt, 1, 3 + i)

            socketio.emit("B2F_PM", dict_data)
            print(sensor_active)
            sensor_active = False
            time.sleep(60)
        else:
            print("Sensor is reading")
            time.sleep(0.2)


def bme_main():
    print("TESTING FORCED MODE WITHOUT BSEC")
    bme = BME68X(cst.BME68X_I2C_ADDR_LOW, 1)
    # Configure sensor to measure at 320 degC for 100 millisec
    bme.set_heatr_conf(cst.BME68X_FORCED_MODE, 320, 100, cst.BME68X_ENABLE)
    print(bme.get_data())
    time.sleep(3)
    print("\nTESTING FORCED MODE WITH BSEC")
    bme = BME68X(cst.BME68X_I2C_ADDR_LOW, 1)
    bme.set_sample_rate(bsec.BSEC_SAMPLE_RATE_LP)
    start = time.time()
    while True:
        bsec_data = get_data(bme)
        if bsec_data is not None:
            logging.debug(bsec_data)
            # print(bsec_data["temperature"], "temp")
            temperature = round(bsec_data["temperature"], 2)
            humidity = round(bsec_data["humidity"], 2)
            raw_pressure = round(bsec_data["raw_pressure"], 1)
            # print(temperature, humidity, raw_pressure)
            if time.time() - start > 120:
                start = time.time()
                logging.debug("New data point")
                DataRepository.add_data_point(temperature, 1, 15)
                DataRepository.add_data_point(humidity, 1, 17)
                DataRepository.add_data_point(raw_pressure, 1, 16)
            socketio.emit(
                "B2F_BME",
                {
                    "temperature": temperature,
                    "humidity": humidity,
                    "pressure": raw_pressure,
                },
            )


def get_data(sensor):
    data = {}
    try:
        data = sensor.get_bsec_data()
    except Exception as e:
        print(e)
        return None
    if data == None or data == {}:
        time.sleep(0.1)
        return None
    else:
        time.sleep(3)
        return data


def fan_thread():
    print("***starting Fan thread***")
    fan.fan_mode = DataRepository.get_fan_setting()["setwaarde"]
    fan.pwm_speed = 50
    start = time.time()
    while True:
        socketio.emit("B2F_fan_speed", {"rpm": fan.rpm})
        dt = start - time.time()
        time.sleep(2)
        if dt > 60:
            start = time.time()
            # Log fan speed every 60s
            DataRepository.add_data_point(fan.rpm, 1, 1)
        # logging.debug(fan.rpm)


# endregion

# region ip
def format_ip(ifstring):
    out = []
    count = ifstring.count("inet ")  # controleren of er meerdere ip adressen zijn
    if count > 1:
        print("multiple addresses found!")
    if "inet" in ifstring:
        while count:

            count = ifstring.count("inet ")
            index = ifstring.find("inet ")
            index += 5
            ifstring = ifstring[index:]
            if count >= 1:
                out.append(ifstring.split("/")[0])
    else:
        print("No IP addresses found")
    return out


def get_ip():
    wlan0 = check_output(["ip", "addr", "show", "wlan0"])
    lan = check_output(["ip", "addr", "show", "eth0"])
    wlan = format_ip(
        wlan0.decode("utf-8")
    )  # Informatie uit command halen in format functie
    lan = format_ip(lan.decode("utf-8"))
    ip_dict = {"lan": lan, "wlan": wlan}

    return ip_dict


# endregion


# Region SENSORS
def read_pms():
    GPIO.output(trans_pin_mhz, 0)
    GPIO.output(trans_pin_PMS, 1)
    list_data, dict_data = pms.read()
    GPIO.output(trans_pin_PMS, 0)
    return list_data, dict_data


def read_mhz19b():
    GPIO.output(trans_pin_mhz, 1)
    GPIO.output(trans_pin_PMS, 0)
    data = serial_send_and_receive(b"\xff\x01\x86\x00\x00\x00\x00\x00\x79")
    GPIO.output(trans_pin_mhz, 0)
    val = int.from_bytes(data[2:4], "big")
    return val


def calibrate_mhz10b():
    # zero point calibration
    data = serial_send_and_receive(b"\xff\x01\x86\x00\x00\x00\x00\x00\x79")
    val = int.from_bytes(data[2:4], "big")
    if val < 420:
        serial_send_and_receive(b"\xff\x01\x87\x00\x00\x00\x00\x00")
        print("calibrated")


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


def refesh_sensor():

    global sensor_active
    print(sensor_active)
    while sensor_active == True:
        # Als sensor nog bezig is, wacht dan even.
        print("sensor is active")
        time.sleep(0.1)
    sensor_active = True
    val = read_mhz19b()
    # print(val)
    time.sleep(0.02)
    list_data, dict_data = read_pms()
    sensor_active = False
    DataRepository.add_data_point(val, 1, 2)
    # broadcast gemeten waarde
    socketio.emit("B2F_CO2", {"CO2": val}, broadcast=True)
    # voorlopig hardcoded
    for i, datapunt in enumerate(list_data):
        # pm sensor begint bij eenheidID2
        DataRepository.add_data_point(datapunt, 1, 3 + i)

    socketio.emit("B2F_PM", dict_data, broadcast=True)
    # print("Refesh thread finished")


# endregion


# API ENDPOINTS


@app.route("/")
def hallo():
    return "Server is running, er zijn momenteel geen API endpoints beschikbaar."


@app.route(endpoint + "/data/actueel/")
def actuele_data():
    return jsonify(data=DataRepository.get_all_recent_data()), 200


@app.route(endpoint + "/data/refesh/")
def refesh():
    p = threading.Thread(target=refesh_sensor, args=())
    p.start()
    return jsonify(Refeshing="True"), 200


@app.route(endpoint + "/ip/")
def ip():
    ip = get_ip()
    return jsonify(ip=ip), 200


@app.route(endpoint + "/fan/mode/", methods=["GET", "POST"])
def fan_mode():
    if request.method == "GET":
        return jsonify(setting=DataRepository.get_fan_setting())
    elif request.method == "POST":
        val = 2
        data = DataRepository.json_or_formdata(request)
        logging.info(data)
        if "auto" in data.keys():
            val -= bool(data["auto"])
            logging.info("Fan set to auto mode")
        if "manual" in data.keys():
            val -= 2 * bool(data["manual"])
            logging.info("Fan set to manual mode")
        if val < 0 or val == 2:
            logging.error(f"Wrong Value fanmode: {val}")
            return jsonify(message=f"Wrong Value fanmode: {val}"), 400
        fan.fan_mode = val
        data = DataRepository.set_fan_setting(val)
        logging.info(data)
        if data is not None:
            if data >= 0:
                last_man_fan_val = DataRepository.get_last_fan_setting()
                return jsonify(gebeurtenisID=data, pwm=last_man_fan_val), 200
        return jsonify(message="error"), 400


@app.route(endpoint + "/fan/pwm/", methods=["GET", "POST"])
def fan_pwm():
    if request.method == "GET":
        return jsonify(fan_pwm=fan.pwm_speed)
    elif request.method == "POST":
        data = DataRepository.json_or_formdata(request)
        if "pwm" not in data.keys():
            return jsonify(message="error"), 400
        pwm = data["pwm"]
        if pwm > 100 or pwm < 0:
            return jsonify(message="wrong value"), 400
        fan.pwm_speed = pwm
        data = DataRepository.set_fan_pwm(pwm)
        return jsonify(gebeurtenisID=data)


@app.route(endpoint + "/fan/rpm/", methods=["GET"])
def fan_rpm():
    if request.method == "GET":
        data = DataRepository.get_fan_speed()
        return jsonify(fan_speed=data), 200


def get_historiek_filtered(unit, timeType, daterange, limit=2500):
    try:
        begin, end = daterange.split("-")
        if begin == "start":
            begin = DataRepository.get_date_first_entry(unit)["x"] // 1000
        data = None
        beginTimestamp, endTimeStamp = int(begin), int(end)
        if timeType == "WEEK":
            data = DataRepository.get_historiek_per_5_min(
                unit, beginTimestamp, endTimeStamp
            )
            print(data)
        elif timeType == "DAY":
            data = DataRepository.get_historiek_per_minute(
                unit, beginTimestamp, endTimeStamp
            )
        elif timeType == "YTD":
            data = DataRepository.get_historiek_per_hour(
                unit, beginTimestamp, endTimeStamp
            )

        elif timeType == "any":
            data = DataRepository.get_historiek(unit)
        else:
            logging.warning("TimeType not correct")
        if data is None:
            logging.error("geen data")
        return data
    except TypeError as ex:
        return None


# depricated
@app.route(endpoint + "/historiek/co2/")
def get_historiek_co2():
    data = DataRepository.get_historiek(2)
    return jsonify(data=data), 200


# depricated
@app.route(endpoint + "/historiek/temperature/")
def get_historiek_temp():
    data = DataRepository.get_historiek(15)
    return jsonify(data=data), 200


# depricated
@app.route(endpoint + "/historiek/humidity/")
def get_historiek_humidity():
    data = DataRepository.get_historiek(17)
    return jsonify(data=data), 200


# depricated
@app.route(endpoint + "/historiek/pressure/")
def get_historiek_pressrue():
    data = DataRepository.get_historiek(16)
    return jsonify(data=data), 200


# depricated
@app.route(endpoint + "/historiek/pm/")
def get_historiek_pm():
    limit = 2500
    pm1 = DataRepository.get_historiek(6, limit=limit)
    pm2_5 = DataRepository.get_historiek(7, limit=limit)
    pm10 = DataRepository.get_historiek(8, limit=limit)
    data = [pm1, pm2_5, pm10]
    return jsonify(data=data), 200


@app.route(endpoint + "/historiek/co2/<time_type>/<range>/")
def get_historiek_co2_filtered(time_type, range):
    data = get_historiek_filtered(2, time_type, range)
    if data is not None:
        return jsonify(data=data), 200
    else:
        return jsonify(message="No return data"), 400


@app.route(endpoint + "/historiek/temperature/<time_type>/<range>/")
def get_historiek_temperature_filtered(time_type, range):
    data = get_historiek_filtered(15, time_type, range)
    if data is not None:
        return jsonify(data=data), 200
    else:
        return jsonify(message="No return data"), 400


@app.route(endpoint + "/historiek/humidity/<time_type>/<range>/")
def get_historiek_humidity_filtered(time_type, range):
    data = get_historiek_filtered(17, time_type, range)
    if data is not None:
        return jsonify(data=data), 200
    else:
        return jsonify(message="No return data"), 400


@app.route(endpoint + "/historiek/pressure/<time_type>/<range>/")
def get_historiek_pressure_filtered(time_type, range):
    print(f"{time_type}, {range}")
    data = get_historiek_filtered(16, time_type, range)
    print(data)
    if data is not None:
        return jsonify(data=data), 200
    else:
        return jsonify(message="No return data"), 400


@app.route(endpoint + "/historiek/pm/<time_type>/<range>/")
def get_historiek_pm_filtered(time_type, range):
    pm1 = get_historiek_filtered(6, time_type, range)
    pm2_5 = get_historiek_filtered(7, time_type, range)
    pm10 = get_historiek_filtered(8, time_type, range)
    if (pm1 and pm2_5 and pm10) is not None:
        data = [pm1, pm2_5, pm10]
        return jsonify(data=data), 200
    else:
        return jsonify(message="No return data"), 400


@socketio.on("connect")
def initial_connection():
    print("A new client connect")
    data = DataRepository.get_all_recent_data()
    emit("B2F_Actuele_data", data)
    # # Send to the client!
    # vraag de status op van de lampen uit de DB


@socketio.on("F2B_fan_speed")
def change_fan_speed(jsonObject):
    pwm = jsonObject["pwm"]
    fan.pwm_speed = pwm
    logging.info(f"Changed pwm speed: {pwm}")
    DataRepository.set_fan_pwm(pwm)


def start_thread():
    print("**** Starting THREAD ****")
    thread = threading.Thread(target=main_thread, args=())
    thread.start()
    obj_fan_thread = threading.Thread(target=fan_thread, args=())
    obj_fan_thread.start()
    bme_thread = threading.Thread(target=bme_main, args=())
    bme_thread.start()


def start_chrome_kiosk():
    import os

    os.environ["DISPLAY"] = ":0.0"
    options = webdriver.ChromeOptions()
    # options.headless = True
    # options.add_argument("--window-size=1920,1080")
    options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36"
    )
    options.add_argument("--ignore-certificate-errors")
    options.add_argument("--allow-running-insecure-content")
    options.add_argument("--disable-extensions")
    # options.add_argument("--proxy-server='direct://'")
    options.add_argument("--proxy-bypass-list=*")
    options.add_argument("--start-maximized")
    options.add_argument("--disable-gpu")
    # options.add_argument('--disable-dev-shm-usage')
    options.add_argument("--no-sandbox")
    options.add_argument("--kiosk")
    # chrome_options.add_argument('--no-sandbox')
    # options.add_argument("disable-infobars")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    driver = webdriver.Chrome(options=options)
    driver.get("http://localhost")
    while True:
        time.sleep(120000)


def start_chrome_thread():
    print("**** Starting CHROME ****")
    chromeThread = threading.Thread(target=start_chrome_kiosk, args=(), daemon=True)
    chromeThread.start()


# ANDERE FUNCTIES


if __name__ == "__main__":
    try:
        setup_gpio()
        start_thread()
        start_chrome_thread()
        print("**** Starting APP ****")
        socketio.run(app, debug=False, host="0.0.0.0")
    except KeyboardInterrupt:
        print("KeyboardInterrupt exception is caught")
    finally:
        fan.stop()
        GPIO.cleanup()
