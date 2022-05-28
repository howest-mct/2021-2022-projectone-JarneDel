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
        sql = "insert into historiek (setWaarde, actieID, EenheidID) values(%s,%s,%s)"
        params = [setWaarde, actieID, EenheidID]
        return Database.execute_sql(sql, params)

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
