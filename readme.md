# Project One - AirInsight


## table of contents
- About Air Insight
- Hardware
- Features
- Used frameworks
- Installation manual
- Instructables

## About Air Insight
Air insight is an air quality monitor that monitors co2, particulate matter, indoor air quality, temperature, humidity and atmospheric pressure

It is made for people that want to know more about the air quality in their rooms or home. 

## Hardware
- Raspberry Pi 4B
- SD card
- Winsen MH-Z19B
- Sensiron PMS5003
- Bosch BME680
- Noctua nf-a4x10 5V PWM fan (with tachometer)
- 5V USB-C power supply 3A or more

## Features
1. Displaying Realtime Air quality 
2. Viewing historical data
3. Setting the fan speed to manual or smart mode
4. viewing device IP address and fan speed

## Used frameworks

- Flask
- Socketio
- Apexcharts
- Apache

## Installation manual
- install Raspbian with desktop gui
- Install apache2: `apt install apache2 -y`
- Install MariaDB `apt install mariadb-server mariadb-client -y`
- Secure MariaDB `mysql_secure_installation `
  - root password: press _Enter_
  - enter password
  - remove anonymous users [Y/n] : _y_
  - Dissalow root login remotely? [Y/n] _n_
  - Remove test database and access to it? [Y/n] _y_
- Create MySql user
  - `mysql -u root -p`
  - `grant all on *.* to 'student'@'localhost' identified by 'password'; grant grant option on *.* to 'student'@'localhost';`
  - `flush privileges`
  - `exit`
- configure MySql Workbench
  - Open mysql workbench
  - make new connection - choose Connection Method over Standard TCP/IP over SSH
  - SSH Hostname: `<RPi ip adrress>`
  - SSH Username: `<username>`
  - SSH Password: the mysql user password
  - save to vault.
  - MySQL Hostname: 127.0.0.1
  - MySQL Server Port: 3306
  - Username: user
  - Password: password
  - Save password to vault
- connect to the raspberry pi via ssh
  - install extention remote-ssh
  - connect to ssh `username@ip_address`
- Clone the repo: `git clone https://github.com/howest-mct/2021-2022-projectone-JarneDel`
- Make python ready
  - install packages (do not use venv)
    - pip install flask-cors
    - pip install flask-socketio
    - pip install mysql-connector-python
    - pip install gevent
    - pip install gevent-websocket
    - pip install selenium
    - install the BME68X python library from pip3g
      - https://github.com/pi3g/bme68x-python-library
- import database
  - use the mySQL dump file to import the database
- install chrome kiosk
  - `sudo apt install chromium-chromedriver`
- run backend -> app.py
- Display front-end in apache
  - browse in your webbrowser, on the same network to the ip address of the raspberry pi
  - You should see the _Apache2 Debian Default Page_
  - `Sudo nano /etc/apache2/sites-availible/000-default.conf`
  - change `DocumentRoot /var/www/html` to `/DocumentRoot/home/user/2021-2022-projectone-JarneDel/front-end`
  - Save with _Ctrl+x_ followed by _y_ followed by _Enter_
  - open `sudo nano /etc/apache2/apache2.conf`
  - replace

```apache
<Directory />
     Options FollowSymLinks
     AllowOverride All
     Require all denied
</Directory>
```

- with

```apache
<Directory />
    Options Indexes FollowSymLinks Includes ExecCGI
    AllowOverride All
    Require all granted
</Directory>
```

- save
- restart apache: `sudo service apache2 restart`
- check apache status: `sudo service apach2 status`
- expected output: `Loaded: loaded (/lib/systemd/system/apache2.service; enabled; vendor preset: enabled) \ Active: active (running) since ...`

### Run app.py on system boot

- Create a file **airInsight.service**
- Paste the following code in the file

```service
[Unit]
Description=ProjectOne Project
After=network.target
[Service]
ExecStart=/usr/bin/python3 -u /home/<user>/2021-2022-projectone-JarneDel/backend/app.py
WorkingDirectory=/home/<user>/2021-2022-projectone-JarneDel/backend
StandardOutput=inherit
StandardError=inherit
Restart=always
User=student
[Install]
WantedBy=multi-user.target
```

- copy the file to **/etc/systemd/system/** with `sudo cp airInsight.service /etc/systemd/system/airInsight.service`
- Test by running `sudo systemctl start airInsight.service`
- To stop the test: `sudo systemctl stop airInsight.service`
- Run service on boot: `sudo systemctl enable airInsight.service`

## Instructables


On instructables I documented this project on Instuctables https://www.instructables.com/Air-Insight-Air-Quality-Monitor-With-Raspberry-Pi/
This way you can recreate the project. The schematics are also available here
