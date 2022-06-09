from subprocess import check_output


class CMD:
    @staticmethod
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

    @staticmethod
    def get_ip(self):
        wlan0 = check_output(["ip", "addr", "show", "wlan0"])
        lan = check_output(["ip", "addr", "show", "eth0"])
        wlan = self.format_ip(
            wlan0.decode("utf-8")
        )  # Informatie uit command halen in format functie
        lan = self.format_ip(lan.decode("utf-8"))
        ip_dict = {"lan": lan, "wlan": wlan}

        return ip_dict
