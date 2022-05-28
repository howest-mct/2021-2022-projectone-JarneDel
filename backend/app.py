import time
from RPi import GPIO
from helpers.klasseknop import Button
import threading

from flask_cors import CORS
from flask_socketio import SocketIO, emit, send
from flask import Flask, jsonify
from repositories.DataRepository import DataRepository

from selenium import webdriver

from serial import Serial, PARITY_NONE
from model.pms5003 import Pms5003

# from selenium import webdriver
# from selenium.webdriver.chrome.options import Options


# Code voor Hardware
def setup_gpio():
    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)


# Code voor Flask

app = Flask(__name__)
app.config["SECRET_KEY"] = "3fan6od4@PG$BfGH"
socketio = SocketIO(
    app, cors_allowed_origins="*", logger=False, engineio_logger=False, ping_timeout=1
)

CORS(app)


@socketio.on_error()  # Handles the default namespace
def error_handler(e):
    print(e)


# pms init
pms = Pms5003(set=20, reset=21)
pms.setup()

# region Main Thread
def main_thread():

    # kan nog niet doen, weet nog niet hoe 2de uart bus werkt
    while True:
        # val = read_mhz19b()
        # DataRepository.add_data_point(val, 1, 2)
        # socketio.emit("B2F_CO2", {"CO2": val})
        time.sleep(1)
        list_data, dict_data = pms.read()  # dict met 9 data punten
        # voorlopig hardcoded
        for i, datapunt in enumerate(list_data):
            # pm sensor begint bij eenheidID2
            DataRepository.add_data_point(datapunt, 1, 3 + i)

        socketio.emit("B2F_PM", dict_data)
        time.sleep(60)


# endregion

# Region SENSORS
def read_mhz19b():
    data = serial_send_and_receive(b"\xff\x01\x86\x00\x00\x00\x00\x00\x79")
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


# endregion


# API ENDPOINTS


@app.route("/")
def hallo():
    return "Server is running, er zijn momenteel geen API endpoints beschikbaar."


@socketio.on("connect")
def initial_connection():
    print("A new client connect")
    data = DataRepository.get_all_recent_data()
    emit("B2F_Actuele_data", data)
    # # Send to the client!
    # vraag de status op van de lampen uit de DB


def start_thread():
    print("**** Starting THREAD ****")
    thread = threading.Thread(target=main_thread, args=(), daemon=True)
    thread.start()


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
        pass


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
        pms.cleanup()
        GPIO.cleanup()
