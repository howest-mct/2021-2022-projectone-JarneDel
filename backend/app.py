import time
from RPi import GPIO
import threading
from flask_cors import CORS
from flask_socketio import SocketIO, emit, send
from flask import Flask, jsonify, request
from repositories.DataRepository import DataRepository
from bme68x import BME68X
import bme68xConstants as cst
import bsecConstants as bsec

from model.cmd import CMD
from model.Mhz19B import Mhz19B
from model.pms5003 import Pms5003
from model.Fan import Fan
from repositories.historiekRepository import HistoriekRepository as HR
from helpers.chrome_kiosk import start_chrome_kiosk
import logging


# Code voor Hardware
def setup_gpio():
    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)
    GPIO.setup((trans_pin_PMS, trans_pin_mhz), GPIO.OUT, initial=0)
    fan.start()


# logging setup
logging.basicConfig(
    filename="logs/app_log.log",
    level=logging.DEBUG,
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
    DataRepository.add_data_point(1, 3, 20)
    while True:
        if not sensor_active:
            sensor_active = True
            print(sensor_active)
            val = read_mhz19b()
            time.sleep(1)
            list_data, dict_data = read_pms()
            # print(dict_data)
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
            # print(sensor_active)
            sensor_active = False
            time.sleep(60)
        else:
            print("Sensor is reading")
            time.sleep(0.2)


def bme_main():
    print("TESTING FORCED MODE WITHOUT BSEC")
    bme = BME68X(cst.BME68X_I2C_ADDR_HIGH, 1)
    # Configure sensor to measure at 320 degC for 100 millisec
    bme.set_heatr_conf(cst.BME68X_FORCED_MODE, 320, 100, cst.BME68X_ENABLE)
    print(bme.get_data())
    time.sleep(3)
    print("\nTESTING FORCED MODE WITH BSEC")
    bme = BME68X(cst.BME68X_I2C_ADDR_HIGH, 1)
    bme.set_sample_rate(bsec.BSEC_SAMPLE_RATE_LP)
    start = time.time()
    while True:
        bsec_data = get_data(bme)
        if bsec_data is not None:
            print(bsec_data)
            # logging.debug(bsec_data)
            # print(bsec_data["temperature"], "temp")
            temperature = round(bsec_data["temperature"], 2)
            humidity = round(bsec_data["humidity"], 2)
            raw_pressure = round(bsec_data["raw_pressure"], 1)
            voc_percentage = int(bsec_data["gas_percentage"])
            accuracy = bsec_data["iaq_accuracy"]
            iaq = round(bsec_data["iaq"])
            # print(temperature, humidity, raw_pressure)
            if time.time() - start > 120:
                start = time.time()
                logging.debug("New data point")
                DataRepository.add_data_point(temperature, 1, 15)
                DataRepository.add_data_point(humidity, 1, 17)
                DataRepository.add_data_point(raw_pressure, 1, 16)
                DataRepository.add_data_point(iaq, 1, 18)
                DataRepository.add_data_point(voc_percentage, 1, 23)
                DataRepository.add_data_point(accuracy, 1, 22)
            socketio.emit(
                "B2F_BME",
                {
                    "temperature": temperature,
                    "humidity": humidity,
                    "pressure": raw_pressure,
                    "VOC": voc_percentage,
                    "iaq": iaq,
                    "accuracy": accuracy,
                },
            )
        else:
            print("NO data")


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
        time.sleep(1)
        if dt > 60:
            start = time.time()
            # Log fan speed every 60s
            DataRepository.add_data_point(fan.rpm, 1, 1)
        # logging.debug(fan.rpm)


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
    val = Mhz19B.read()
    GPIO.output(trans_pin_mhz, 0)
    return val


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
    ip = CMD.get_ip()
    return jsonify(ip=ip), 200


@app.route(endpoint + "/poweroff/")
def power_off():
    msg = CMD.power_off()
    DataRepository.add_data_point("0", 3, 20)
    return jsonify(msg=msg), 200


@app.route(endpoint + "/reboot/")
def reboot():
    msg = CMD.reboot()
    DataRepository.add_data_point("0", 3, 20)
    return jsonify(msg=msg), 200


@app.route(endpoint + "/fan/mode/", methods=["GET", "POST"])
def fan_mode():
    if request.method == "GET":
        return jsonify(setting=DataRepository.get_fan_setting())
    elif request.method == "POST":
        val = 2
        data = DataRepository.json_or_formdata(request)
        # logging.info(data)
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
        # logging.info(data)
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


@app.route(endpoint + "/historiek/<unit_type>/<time_type>/<range>/")
def get_historiek(unit_type, time_type, range):
    # logging.info(f"{unit_type, time_type, range}")
    data_list = []
    data = None
    if unit_type == "co2":
        unit = 2
    elif unit_type == "temperature":
        unit = 15
    elif unit_type == "humidity":
        unit = 17
    elif unit_type == "pressure":
        unit = 16
    elif unit_type == "iaq":
        unit = 18
    elif unit_type == "voc":
        unit = 23
    elif unit_type == "pm":
        unit = [6, 7, 8]
    elif unit_type == "pmnop":
        unit = [9, 10, 11, 12, 13, 14]

    if isinstance(unit, int):
        logging.debug(unit, "Een waarde")
        data = HR.get_historiek_filtered(unit, time_type, range)

    if isinstance(unit, list):
        logging.debug(unit, "meerdere waardes")
        for item in unit:
            data_list.append(HR.get_historiek_filtered(item, time_type, range))

    logging.debug(f"{(unit_type, unit, data, data_list)}")
    if data is not None:
        return jsonify(data=data, unit=unit_type), 200

    elif data_list is not None:
        return jsonify(data=data_list, unit=unit_type), 200

    else:
        return jsonify(message="error"), 400


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


def start_chrome_thread():
    print("**** Starting CHROME IN 10 S ****")
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
