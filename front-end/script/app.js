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
let onlyOneListenerHistoriek = true;
let OnlyOneListenersettings = true;
let firstTimeTemp = true;
let firstTimeCo2 = true;
let firstTimeHum = true;
let co2Chart,
  tempChart,
  humidityChart,
  pressureChart,
  PMchart,
  PMNopChart,
  VOCchart,
  areaCO2,
  areaTemp,
  areaHum;

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
  htmlRPM,
  htmlHistoriek,
  HTMLDropDownHistoriek,
  htmlHistoriekCO2,
  htmlTopBarTitle,
  htmlHistoriekTemp,
  htmlHistoriekHum;

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
const hideAll = function () {
  const arrayDomObjects = [
    htmlActueel,
    // htmlHistoriek,
    htmlSettings,
    htmlRefesh,
    htmlHistoriekCO2,
    htmlHistoriekTemp,
    htmlHistoriekHum,
  ];
  for (let DomObject of arrayDomObjects) {
    hide(DomObject);
  }
};

// #region ***  Callback-Visualisation - show___         ***********
const showPage = function (type) {
  console.log(type);
  if (type == 'actueel') {
    console.log('Actuele pagina');
    updateTitle('Realtime dashboard');
    hideAll();
    show(htmlActueel);
    show(htmlRefesh);
    if (OnlyOneListener) {
      showCharts();
      listenToRefesh();
      OnlyOneListener = false;
    }
  } else if (type == 'settings') {
    console.log('Settings');
    updateTitle('Settings');
    hideAll();
    show(htmlSettings);
    getFanSetting();
    if (OnlyOneListenersettings) {
      getIP();
      listenToSocketFan();
      listenToFanMode();
      listenToSlider();
      OnlyOneListenersettings = false;
    }
  } else if (type == 'historiek') {
    toggleClass(HTMLDropDownHistoriek);
    getHistoriekCo2();
    // show(htmlDropDown);
    // if (onlyOneListenerHistoriek) {
    //   listenToHistoriekPaginas();
    //   onlyOneListenerHistoriek = false;
    // }
  }
};

const showIP = function (jsonIP) {
  console.log(jsonIP);
  let lanIps = jsonIP.ip.lan;
  let wlanIps = jsonIP.ip.wlan;
  const htmlIP = document.querySelector('.js-ip');
  let html =
    '<table><tr><th class ="u-table-title"colspan=2>Device IP Adress</th></tr><tr><th>Interface</th><th>IP</th></tr>';
  for (let lanIP of lanIps) {
    html += `<tr><td>LAN</td><td>${lanIP}</td></tr>`;
  }
  for (let wlanIP of wlanIps) {
    html += `<tr><td>WLAN</td><td>${wlanIP}</td></tr>`;
  }
  html += '</table>';
  htmlIP.innerHTML = html;
};

const showHistoriekCo2 = function (historiek) {
  hideAll();
  updateTitle('CO2 History');
  show(htmlHistoriekCO2);
  console.log(historiek);
  if (firstTimeCo2) {
    console.log('first time historiek');
    firstTimeCo2 = false;
    let CO2HistoriekOptions = HistoriekOptions;
    CO2HistoriekOptions.series[0].data = historiek.data;
    areaCO2 = new ApexCharts(
      document.querySelector('.area-chart-co2'),
      HistoriekOptions
    );
    areaCO2.render();
  } else {
    console.log('update');
    areaCO2.updateSeries([
      {
        data: historiek.data,
      },
    ]);
  }
};
const showHistoriekTemperature = function (tempJson) {
  hideAll();
  updateTitle('Temperature');
  console.log(tempJson);
  show(htmlHistoriekTemp);
  console.log(tempJson);
  if (firstTimeTemp) {
    let tempHistoriekOptions = HistoriekOptions;
    tempHistoriekOptions.series[0].data = tempJson.data;
    console.log('first time temp historiek');
    firstTimeTemp = false;
    areaTemp = new ApexCharts(
      document.querySelector('.area-chart-temp'),
      tempHistoriekOptions
    );
    areaTemp.render();
  } else {
    areaTemp.updateSeries([
      {
        data: tempJson.data,
      },
    ]);
  }
};
const showHistoriekHumidity = function (humJson) {
  hideAll();
  show(htmlHistoriekHum);
  updateTitle('Humidity');
  console.log('hum');
  if (firstTimeHum) {
    let humHistoriekOptions = HistoriekOptions;
    humHistoriekOptions.series[0].data = humJson.data;
    console.log('first time hum historiek');
    firstTimeHum = false;
    areaHum = new ApexCharts(
      document.querySelector('.area-chart-hum'),
      humHistoriekOptions
    );
    areaHum.render();
  } else {
    areaHum.updateSeries([{ data: humJson.data }]);
  }
};
const showHistoriekPressure = function (pressureJson) {};

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
  // console.log(jsonObject);
  const data = jsonObject.data;
  let PM = {};
  for (let sensorWaarde of data) {
    const setPoint = sensorWaarde.setwaarde;
    switch (sensorWaarde.beschrijving) {
      case 'CO2':
        updateOptionsCharts(setPoint, 'CO2');
        break;
      case 'Temperature':
        updateOptionsCharts(setPoint, 'temperature');
        break;
      case 'Humidity':
        updateOptionsCharts(setPoint, 'humidity');
        break;
      case 'Pressure':
        updateOptionsCharts(setPoint, 'pressure');
        break;
    }
    switch (sensorWaarde.devicenaam) {
      case 'PMS5003':
        // console.log('PMS');
        const beschrijving = sensorWaarde.beschrijving;
        PM[beschrijving] = sensorWaarde.setwaarde;
    }
  }
  // console.log(PM);
  updatePMNOPcharts(PM);
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

const updateOptionsCharts = function (value, type) {
  let seriesValue, typeLabel, chart;
  switch (type) {
    case 'CO2':
      chart = co2Chart;
      seriesValue = valueToPercentCO2(value);
      typeLabel = labels.co2;
      break;
    case 'humidity':
      chart = humidityChart;
      seriesValue = valueToPercentHum(value);
      typeLabel = labels.humidity;
      break;
    case 'pressure':
      chart = pressureChart;
      seriesValue = valueToPercentPressure(value);
      typeLabel = labels.pressure;
      break;
    case 'temperature':
      chart = tempChart;
      seriesValue = valueToPercentTemp(value);
      typeLabel = labels.temperature;
      break;
  }
  // console.log(seriesValue, typeLabel);

  for (let label of typeLabel) {
    if (label.min < value && label.max > value) {
      let labelName = label.val;
      let color = label.color;
      // console.log(labelName, color);
      chart.updateOptions({
        labels: [labelName],
        series: [seriesValue],
        colors: [color],
      });
    }
  }
};

const updatePMCharts = function (pm1, pm2_5, pm10) {
  PMchart.updateSeries([
    {
      data: [
        { x: 'PM1', y: pm1 },
        { x: 'PM2.5', y: pm2_5 },
        { x: 'PM10', y: pm10 },
      ],
    },
  ]);
};
const updatePMNOPcharts = function (data) {
  PMNopChart.updateSeries([
    {
      data: [
        {
          x: 'NOP 0.3 µm',
          y: data['NOP_0.3um'],
        },
        {
          x: 'NOP 0.5 µm',
          y: data['NOP_0.5um'],
        },
        {
          x: 'NOP 1 µm',
          y: data['NOP_1um'],
        },
        {
          x: 'NOP 2.5 µm',
          y: data['NOP_2.5um'],
        },
        {
          x: 'NOP 5 µm',
          y: data['NOP_5um'],
        },
        {
          x: 'NOP 10 µm',
          y: data['NOP_10um'],
        },
      ],
    },
  ]);
};
const updateTitle = function (newTitle) {
  for (let title of htmlTopBarTitle) {
    title.innerHTML = newTitle;
  }
};
// #endregion

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

const getHistoriekCo2 = function () {
  const url = backend + '/historiek/co2/';
  handleData(url, showHistoriekCo2, callbackError);
};
const getHistoriekTemperature = function () {
  const url = backend + '/historiek/temperature/';
  handleData(url, showHistoriekTemperature, callbackError);
};

const getHistoriekHum = function () {
  const url = backend + '/historiek/humidity/';
  handleData(url, showHistoriekHumidity, callbackError);
};
const getHistoriekPressure = function () {
  const url = backend + '/historiek/pressure/';
  handleData(url, showHistoriekPressure, callbackError);
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
    const co2Reading = data['CO2'];
    updateOptionsCharts(co2Reading, 'CO2');
  });
  socketio.on('B2F_PM', function (data) {
    // console.log(data);
    const pm2_5 = data['PM2.5_AP'];
    const pm1 = data['PM1_AP'];
    const pm10 = data['PM10_AP1'];
    updatePMCharts(pm1, pm2_5, pm10);
    updatePMNOPcharts(data);
  });
  socketio.on('B2F_BME', function (bme_data) {
    let pressureVal = bme_data.pressure / 100;
    let humidityVal = bme_data.humidity;
    let temperatureVal = bme_data.temperature;
    // console.log(pressureVal, humidityVal, temperatureVal);
    updateOptionsCharts(pressureVal, 'pressure');
    updateOptionsCharts(humidityVal, 'humidity');
    updateOptionsCharts(temperatureVal, 'temperature');
  });
};

const listenToBtnSidebar = function () {
  const btns = document.querySelectorAll('.js-btn-bg-blue-sidebar');
  for (let btn of btns) {
    btn.addEventListener('click', function () {
      if (this.dataset.type == 'historiek') {
        console.log('HI');
        toggleClass(HTMLDropDownHistoriek);
      } else {
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
      }
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

const listenToHistoryDropdown = function () {
  let dropdown = document.querySelectorAll('.js-dropdown-btn');
  for (const page of dropdown) {
    page.addEventListener('click', function () {
      console.log(this.dataset.type);
      switch (this.dataset.type) {
        case 'co2':
          getHistoriekCo2();
          break;
        case 'temperature':
          getHistoriekTemperature();
          break;
        case 'humidity':
          getHistoriekHum();
          break;
        case 'pressure':
          getHistoriekPressure();
          break;
      }
    });
  }
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
    htmlHistoriek = document.querySelector('.js-historiek');
    HTMLDropDownHistoriek = document.querySelector('.js-sidebar-historiek');
    htmlHistoriekCO2 = document.querySelector('.js-historiek-co2');
    htmlTopBarTitle = document.querySelectorAll('.js-topbar-title');
    htmlHistoriekTemp = document.querySelector('.js-historiek-temp');
    htmlHistoriekHum = document.querySelector('.js-historiek-hum');
    listenToHistoryDropdown();
    listenToBtnSidebar();
    listenToMobileNav();
  }
};

document.addEventListener('DOMContentLoaded', init);
// #endregion
