'use strict';

const backend_IP = `http://${window.location.hostname}:5000`;
const backend = backend_IP + '/api/v1';
const lanIP = `${window.location.hostname}:5000`;
let socketio;
try {
  socketio = io(lanIP);
} catch {
  console.log('geen socketio');
}
let OnlyOneListener = true;
let OnlyOneListenersettings = true;

let co2Chart,
  tempChart,
  humidityChart,
  pressureChart,
  PMchart,
  PMNopChart,
  VOCchart;

let RPI = false;
let selectedPage = 'actueel';
// #region ***  DOM references                           ***********
let hmtlPM, htmlOnBoot;
let htmlActueel,
  htmlSettings,
  htmlRefesh,
  htmlMobileNav,
  htmlCloseHamburger,
  htmlhamburger,
  htmlSlider,
  htmlRPM;

// #endregion

const hide = function (DomObject) {
  DomObject.classList.add('c-hidden');
};
const show = function (DomObject) {
  DomObject.classList.remove('c-hidden');
};
const toggleClass = function (DomObject) {
  DomObject.classList.toggle('c-hidden');
};
// #region ***  Callback-Visualisation - show___         ***********
const showPage = function (type) {
  const htmlTopBarTitle = document.querySelector('.js-topbar-title');
  console.log(type);
  if (type == 'actueel') {
    console.log('Actuele pagina');
    htmlTopBarTitle.innerHTML = `Realtime overzicht`;
    show(htmlActueel);
    show(htmlRefesh);
    hide(htmlSettings);
    if (OnlyOneListener) {
      showCharts();
      listenToRefesh();
      OnlyOneListener = false;
    }
  } else if (type == 'settings') {
    console.log('Settings');
    htmlTopBarTitle.innerHTML = 'Instellingen';
    hide(htmlActueel);
    hide(htmlRefesh);
    show(htmlSettings);
    getFanSetting();
    if (OnlyOneListenersettings) {
      getIP();
      listenToSocketFan();
      listenToFanMode();
      listenToSlider();
    }
  }
};

const showIP = function (jsonIP) {
  console.log(jsonIP);
  let lanIps = jsonIP.ip.lan;
  let wlanIps = jsonIP.ip.wlan;
  const htmlIP = document.querySelector('.js-ip');
  let html =
    '<table><tr><th class ="u-table-title"columnspan=2>Device IP Adress</th></tr><tr><th>Interface</th><th>IP</th></tr>';
  for (let lanIP of lanIps) {
    html += `<tr><td>LAN</td><td>${lanIP}</td></tr>`;
  }
  for (let wlanIP of wlanIps) {
    html += `<tr><td>WLAN</td><td>${wlanIP}</td></tr>`;
  }
  html += '</table>';
  htmlIP.innerHTML = html;
};

const showCharts = function () {
  console.log('chart will be shown');
  co2Chart = new ApexCharts(
    document.querySelector('.js-co2-chart'),
    CO2ChartOptions
  );
  co2Chart.render();
  tempChart = new ApexCharts(
    document.querySelector('.js-temperature-chart'),
    tempChartOptions
  );
  tempChart.render();
  humidityChart = new ApexCharts(
    document.querySelector('.js-humidity-chart'),
    humidityChartOptions
  );
  humidityChart.render();
  pressureChart = new ApexCharts(
    document.querySelector('.js-pressure-chart'),
    PressureChartOptions
  );
  pressureChart.render();
  PMchart = new ApexCharts(
    document.querySelector('.js-pm-chart'),
    PMChartOptions
  );
  PMchart.render();
  PMNopChart = new ApexCharts(
    document.querySelector('.js-pm-chart-NOP'),
    PMNopChartOptions
  );
  PMNopChart.render();
  VOCchart = new ApexCharts(
    document.querySelector('.js-voc-chart'),
    VOCChartOptions
  );
  VOCchart.render();
  listenToSocketCharts();
  getActueleData();
};
const showUpdatedCharts = function (jsonObject) {
  console.log(jsonObject);
  const data = jsonObject.data;
  for (let sensorWaarde of data) {
    if (sensorWaarde.devicenaam == 'MH-Z19B') {
      updateCo2chart(sensorWaarde.setwaarde);
      co2Chart.updateSeries([valueToPercentCO2(sensorWaarde.setwaarde)]);
    }
  }
};

const showRefesh = function (jsonObject) {
  console.log(jsonObject);
};
const showFanSetting = function (jsonObject) {
  document.querySelector('.js-toggle-fan-checkbox').checked =
    jsonObject.setting.setwaarde;
  if (jsonObject.setting.setwaarde) {
    show(htmlSlider);
  }
};

// #endregion

// #region ***  Updates  ***
const updateCo2chart = function (val) {
  co2Chart.updateSeries([valueToPercentCO2(val)]);
};

// #region ***  Callback-No Visualisation - callback___  ***********
const callbackError = function (jsonObject) {
  console.log(jsonObject);
  console.error('Er is een error opgetredenv bij de fetch');
};

const showFanManSlider = function (jsonObject) {
  console.log(jsonObject);
  const pwm = jsonObject.pwm.setwaarde;

  htmlSlider.value = pwm;
  show(htmlSlider);
};

const hideFanManSlider = function (jsonObject) {
  hide(htmlSlider);
};
// #endregion

// #region ***  Data Access - get___                     ***********
const getActueleData = function () {
  const url = backend + '/data/actueel/';
  handleData(url, showUpdatedCharts, callbackError);
};

const getRefesh = function () {
  const url = backend + '/data/refesh/';
  handleData(url, showRefesh, callbackError);
};

const getIP = function () {
  const url = backend + '/ip/';
  handleData(url, showIP, callbackError);
};
const getFanSetting = function () {
  const url = backend + '/fan/mode/';
  handleData(url, showFanSetting, callbackError);
};

const getBrowerSize = function () {
  const vw = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  );
  const vh = Math.max(
    document.documentElement.clientHeight || 0,
    window.innerHeight || 0
  );
  console.log(vw, vh);
  if (600 < vw < 700 && 400 < vh < 500) {
    console.log('Pi pagina');
    RPI = true;
  }
};
// #endregion

// #region ***  Event Listeners - listenTo___            ***********
const listenToSocket = function () {
  socketio.on('connect', function () {
    console.log('Verbonden met socketio');
  });
  socketio.on('B2F_PM', function (msg) {
    console.log(msg);
    hmtlPM.innerHTML = JSON.stringify(msg);
  });
  socketio.on('B2F_Actuele_data', function (msg) {
    console.log('Alle data: ', msg);
    let html = `<tr><th>ID</th><th>setwaarde</th><th>eenheid</th><th>typewaarde</th><th>sensor</th></tr>`;
    for (let data of msg) {
      html += `<tr><td>${data.gebeurtenisID}</td> <td> ${data.setwaarde}</td> <td> ${data.eenheid} </td> <td> ${data.beschrijving} </td> <td> ${data.devicenaam}</td></tr>`;
    }
    htmlOnBoot.innerHTML = html;
  });
};

const listenToSocketCharts = function () {
  socketio.on('B2F_CO2', function (data) {
    console.log('New co2 reading');
    updateCo2chart(data['CO2']);
  });
  socketio.on('B2F_PM', function (data) {
    console.log(data);
    const pm2_5 = data['PM2.5_AP'];
    const pm1 = data['PM1_AP'];
    const pm10 = data['PM10_AP1'];
    PMchart.updateSeries([
      {
        data: [
          { x: 'PM1', y: pm1 },
          { x: 'PM2.5', y: pm2_5 },
          { x: 'PM10', y: pm10 },
        ],
      },
    ]);

    PMNopChart.updateSeries([
      {
        data: [
          {
            x: 'NOP 0.3 um',
            y: data['NOP_0.3um'],
          },
          {
            x: 'NOP 0.5 um',
            y: data['NOP_0.5um'],
          },
          {
            x: 'NOP 1 um',
            y: data['NOP_1um'],
          },
          {
            x: 'NOP 2.5 um',
            y: data['NOP_2.5um'],
          },
          {
            x: 'NOP 5 um',
            y: data['NOP_5um'],
          },
          {
            x: 'NOP 10 um',
            y: data['NOP_10um'],
          },
        ],
      },
    ]);
  });
  socketio.on('B2F_BME', function(bme_data){
    tempChart.updateSeries([valueToPercentTemp(bme_data.temperature)])
    pressureChart.updateSeries([valueToPercentPressure(bme_data.pressure/100)])
    humidityChart.updateSeries([valueToPercentHum(bme_data.humidity)])
  })
};

const listenToBtnSidebar = function () {
  const btns = document.querySelectorAll('.js-btn-bg-blue-sidebar');
  for (let btn of btns) {
    btn.addEventListener('click', function () {
      const btns = document.querySelectorAll('.js-btn-bg-blue-sidebar');
      for (let btn2 of btns) {
        btn2.classList.remove('c-selected');
      }
      htmlMobileNav.classList.toggle('c-show-nav');
      toggleClass(htmlhamburger);
      toggleClass(htmlCloseHamburger);
      this.classList.add('c-selected');
      const type = this.dataset.type;
      console.log(type);
      showPage(type);
    });
  }
};

const listenToRefesh = function () {
  htmlRefesh.addEventListener('click', function () {
    console.log('Refesh');
    getRefesh();
  });
};

const listenToMobileNav = function () {
  const hamburgermenu = document.querySelectorAll('.js-menu');
  for (let menu of hamburgermenu) {
    menu.addEventListener('click', function () {
      console.log('mobile nav');
      htmlMobileNav.classList.toggle('c-show-nav');
      toggleClass(htmlhamburger);
      toggleClass(htmlCloseHamburger);
    });
  }
};

const listenToFanMode = function () {
  document
    .querySelector('.js-toggle-fan-checkbox')
    .addEventListener('change', function () {
      const url = backend + '/fan/mode/';
      if (this.checked) {
        console.log('toggle switch on', this);
        const body = JSON.stringify({ auto: true });
        handleData(url, showFanManSlider, callbackError, 'POST', body);
      } else {
        console.log('toggle switch off', this);
        const body = JSON.stringify({ manual: true });
        handleData(url, hideFanManSlider, callbackError, 'POST', body);
      }
    });
};
const listenToSlider = function () {
  htmlSlider.addEventListener('change', function () {
    let val = this.value;
    if (100 >= val >= 0) {
      socketio.emit('F2B_fan_speed', { pwm: val });
    }
  });
};

const listenToSocketFan = function () {
  socketio.on('B2F_fan_speed', function (msg) {
    htmlRPM.innerHTML = Math.round(msg.rpm) + ' rpm';
  });
};
// #endregion
const SetReload = function () {
  document.location.reload(true);
};
// #region ***  Init / DOMContentLoaded                  ***********
const init = function () {
  console.log('Timeout');
  // setTimeout(SetReload, 30000)
  if (document.querySelector('.js-testData')) {
    console.log('test pagina');
    hmtlPM = document.querySelector('.js-fijn-stof');
    htmlOnBoot = document.querySelector('.js-on-boot');
    listenToSocket();
  } else if (document.querySelector('.Homepagina')) {
    // getBrowerSize();
    console.log('Homepage');
    htmlRefesh = document.querySelector('.js-refesh');
    htmlSettings = document.querySelector('.js-settings');
    htmlActueel = document.querySelector('.js-actueel');
    htmlhamburger = document.querySelector('.c-hamburger-menu');
    htmlCloseHamburger = document.querySelector('.c-close-hamburger');
    htmlMobileNav = document.querySelector('.js-mobile-nav');
    htmlSlider = document.querySelector('.js-slider');
    htmlRPM = document.querySelector('.js-fan-rpm');
    listenToBtnSidebar();
    listenToMobileNav();
  }
};

document.addEventListener('DOMContentLoaded', init);
// #endregion
