from repositories.DataRepository import DataRepository
import logging


class HistoriekRepository:
    @staticmethod
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
