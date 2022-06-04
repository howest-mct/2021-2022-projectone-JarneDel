from dataclasses import dataclass
import logging
from mysqlx import DatabaseError
from .Database import Database


class DataRepository:
    @staticmethod
    def json_or_formdata(request):
        if request.content_type == "application/json":
            gegevens = request.get_json()
        else:
            gegevens = request.form.to_dict()
        return gegevens

    @staticmethod
    def add_data_point(setWaarde, actieID, EenheidID):
        sql = "insert into historiek (setWaarde, actieID, DeviceEenheidID) values(%s,%s,%s)"
        params = [setWaarde, actieID, EenheidID]
        return Database.execute_sql(sql, params)

    @staticmethod
    def get_all_recent_data():
        sql = """select h.gebeurtenisID, h.setwaarde, de.eenheid,de.beschrijving, de.devicenaam 
                from historiek h 
                join DeviceEenheid de on de.DeviceEenheidID = h.DeviceEenheidID 
                where type = 'IN' and  h.gebeurtenisID in 
                    (select max(gebeurtenisID) 
                    from historiek 
                    group by DeviceEenheidID 
                    order by gebeurtenisID 
                    )
                group by h.DeviceEenheidID;"""
        return Database.get_rows(sql)

    @staticmethod
    def get_fan_setting():
        sql = """
            select h.setwaarde from historiek h
            join acties a on h.actieID = a.ActieID
            where a.naam = 'fanmode'
            order by h.GebeurtenisID desc
            limit  1;
        """
        return Database.get_one_row(sql)

    @staticmethod
    def set_fan_pwm(pwm):
        sql = """insert into historiek (setwaarde, actieid, deviceeenheidid) values(%s,4,19)"""
        params = [pwm]
        return Database.execute_sql(sql, params)

    @staticmethod
    def set_fan_setting(bool_setting):
        sql = """insert into historiek (setWaarde, actieID, DeviceEenheidID) values(%s, 5, 21)"""
        logging.info(bool_setting)
        if type(bool(bool_setting)) == bool:
            logging.info("Wordt getoond")
            params = [bool_setting]
            return Database.execute_sql(sql, params)
        logging.error("Verkeerd datatype")

    @staticmethod
    def get_fan_speed():
        sql = "select setWaarde from historiek where DeviceEenheidID = 1 order by GebeurtenisID desc limit 1"
        return Database.get_one_row(sql)

    @staticmethod
    def get_last_fan_setting():
        sql = """select h.setwaarde from historiek h
                    join acties a on h.actieID = a.ActieID
                    where a.naam = 'Ventilatorsnelheid weizigen'
                    order by h.GebeurtenisID desc
                    limit 1;"""
        return Database.get_one_row(sql)

    @staticmethod
    def get_historiek(deviceEenheidID, limit=10000):
        sql = """select unix_timestamp(Datum) * 1000 as 'x', setWaarde as 'y' from historiek where DeviceEenheidID = %s order by `x` desc limit %s"""
        params = [deviceEenheidID, limit]
        return Database.get_rows(sql, params)

    # @staticmethod
    # def get_pm():
