import subprocess
import json
from statistics import median

class Bme680:
    def __init__(self,constring):
        self.constring = subprocess.Popen(['./bsec_bme680'], stdout=subprocess.PIPE)
    def read_all_sensors(self,jsonlist):
        Bme680.list_IAQ_scores(jsonlist)
        Bme680.listIAQ(jsonlist)
        Bme680.temperature_offset(jsonlist)
        Bme680.list_humidity(jsonlist)
        Bme680.listPressure(jsonlist)
        Bme680.listGas(jsonlist)
        Bme680.listStatus(jsonlist)

    @staticmethod
    def proc(proc):
        listJson = []
        for line in iter(proc.stdout.readline, ''):
            lineJSON = json.loads(line.decode("utf-8"))  # process line-by-line
            listJson.append(lineJSON)
            if len(listJson) == 20:
                return listJson
    @staticmethod
    def list_IAQ_scores(jsonlist):
        listIAQ_Accuracy = []
        for i in jsonlist:
            lineDict = dict(i)
            listIAQ_Accuracy.append(int(lineDict['IAQ_Accuracy']))
            if len(listIAQ_Accuracy) == 20:
                iaq_Accuracy = median(listIAQ_Accuracy)
                print("IAQ_Accuracy : {0}".format(iaq_Accuracy))
    @staticmethod
    def list_humidity(jsonlist):
        listHumidity = []
        for i in jsonlist:
            lineDict = dict(i)
            listHumidity.append(float(lineDict['Humidity']))
            if len(listHumidity) == 20:
                humidity = median(listHumidity)
                humidity = round(humidity,1)
                print("Humidity : {0}".format(humidity))
    @staticmethod
    def listGas(jsonlist):
        listGas = []
        for i in jsonlist:
            lineDict = dict(i)
            listGas.append(int(lineDict['Gas']))
            if len(listGas) == 20:
                gas = median(listGas)
                print("Gas : {0}".format(gas))

    @staticmethod
    def listIAQ(jsonlist):
        listIAQ = []
        for i in jsonlist:
            lineDict = dict(i)
            listIAQ.append(float(lineDict['IAQ']))
            if len(listIAQ) == 20:
                iaq = median(listIAQ)
                iaq = round(iaq,1)
                print("IAQ : {0}".format(iaq))

    @staticmethod
    def listPressure(jsonlist):
        listPressure = []
        for i in jsonlist:
            lineDict = dict(i)
            listPressure.append(float(lineDict['Pressure']))
            if len(listPressure) == 20:
                pressure = median(listPressure)
                pressure = round(pressure,1)
                print("Pressure : {0}".format(pressure))

    @staticmethod
    def temperature_offset(jsonlist):
        listTemperature = []
        for i in jsonlist:
            lineDict = dict(i)
            listTemperature.append(float(lineDict['Temperature']))
            if len(listTemperature) == 20:
                temperature = median(listTemperature)
                temperature = temperature + 2
                temperature = round(temperature, 1)
                print("Temperature Offset: {0}".format(temperature))

    @staticmethod
    def listStatus(jsonlist):
        listStatus = []
        for i in jsonlist:
            lineDict = dict(i)
            listStatus.append(int(lineDict['Status']))
            if len(listStatus) == 20:
                status = median(listStatus)
                print("Status: {0}".format(status))
    @staticmethod
    def listCO2eq():
        pass
    @staticmethod
    def listTemperature(jsonlist):
        listTemperature = []
        for i in jsonlist:
            lineDict = dict(i)
            listTemperature.append(float(lineDict['Temperature']))
            if len(listTemperature) == 20:
                temperature = median(listTemperature)
                temperature = round(temperature,1)
                print("Temperature : {0}".format(temperature))
        pass

if __name__ == '__main__':
    constring = subprocess.Popen(['./bsec_bme680'], stdout=subprocess.PIPE)
    while True:
        jsonlist = Bme680.proc(constring)
        print(jsonlist)
        Bme680.listIAQ(jsonlist)
        Bme680.list_IAQ_scores(jsonlist)
        # Bme680.read_all_sensors(None,jsonlist)
    # Bme680.list_IAQ_scores(jsonlist)
























#
#
# #Open C File
# proc = subprocess.Popen(['./bsec_bme680'], stdout=subprocess.PIPE)
#
# listIAQ_Accuracy = []
# listPressure = []
# listGas = []
# listTemperature = []
# listIAQ = []
# listHumidity  = []
# listStatus = []
#
# for line in iter(proc.stdout.readline, ''):
#     lineJSON = json.loads(line.decode("utf-8")) # process line-by-line
#     lineDict = dict(lineJSON)
#
#     listIAQ_Accuracy.append(int(lineDict['IAQ_Accuracy']))
#     listPressure.append(float(lineDict['Pressure']))
#     listGas.append(int(lineDict['Gas']))
#     listTemperature.append(float(lineDict['Temperature']))
#     listIAQ.append(float(lineDict['IAQ']))
#     listHumidity.append(float(lineDict['Humidity']))
#     listStatus.append(int(lineDict['Status']))
#
#     if len(listIAQ_Accuracy) == 20:
#         #generate the median for each value
#         IAQ_Accuracy = median(listIAQ_Accuracy)
#         Pressure = median(listPressure)
#         Gas = median(listGas)
#         Temperature = median(listTemperature)
#         IAQ = median(listIAQ)
#         Humidity = median(listHumidity)
#         Status = median(listStatus)
#
#         #clear lists
#         listIAQ_Accuracy.clear()
#         listPressure.clear()
#         listGas.clear()
#         listTemperature.clear()
#         listIAQ.clear()
#         listHumidity.clear()
#         listStatus.clear()
#
#         #Temperature Offset
#         Temperature = Temperature + 2
#
#         payload = {"IAQ_Accuracy": IAQ_Accuracy,"IAQ": round(IAQ, 1),"Temperature": round(Temperature, 1),"Humidity": round(Humidity, 1),"Pressure": round(Pressure, 1),"Gas": Gas,"Status": Status}
#         # publish.single("bme680_wohnzimmer", json.dumps(payload), hostname="localhost")
#         print(payload)