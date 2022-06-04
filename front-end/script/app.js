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
let firstTimePressure = true;
let firstTimePM = true;
let co2Chart,
  tempChart,
  humidityChart,
  pressureChart,
  PMchart,
  PMNopChart,
  VOCchart,
  areaCO2,
  areaTemp,
  areaHum,
  areaPressure,
  areaPM;

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
  htmlHistoriekHum,
  htmlHistoriekPressure,
  htmlHistoriekPM,
  htmlLoading,
  htmlDropDownHistoriekMobile;

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
  let arrayDomObjects = [
    htmlActueel,
    // htmlHistoriek,
    htmlSettings,

    htmlHistoriekCO2,
    htmlHistoriekTemp,
    htmlHistoriekHum,
    htmlHistoriekPressure,
    htmlHistoriekPM,
  ];
  for (let element of htmlRefesh) {
    arrayDomObjects.push(element);
  }
  for (let DomObject of arrayDomObjects) {
    hide(DomObject);
  }
};

const toggleSidebar = function () {
  htmlMobileNav.classList.toggle('c-show-nav');
  toggleClass(htmlhamburger);
  toggleClass(htmlCloseHamburger);
};

// #region ***  Callback-Visualisation - show___         ***********
const showPage = function (type) {
  console.log(type);
  if (type == 'actueel') {
    console.log('Actuele pagina');
    updateTitle('Realtime dashboard');
    hideAll();
    show(htmlActueel);
    for (let refesh of htmlRefesh) {
      show(refesh);
    }

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
    toggleClass(htmlDropDownHistoriekMobile);
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

const createChart = function (data, name, dom) {
  let tempOptions = HistoriekOptions;
  tempOptions.chart.stacked = false;
  tempOptions.series.pop();
  tempOptions.series.pop();
  tempOptions.series[0] = {
    data: data,
    name: name,
  };

  let chart = new ApexCharts(dom, tempOptions);
  chart.render();

  return chart;
};

const createStackedChart = function (dom, arrayJsonStacked, arrayNames) {
  let tempOptions = HistoriekOptions;
  tempOptions.chart.stacked = true;
  tempOptions.colors = ['#2699FB', '#00E396', '#CED4DC'];
  console.log(arrayJsonStacked.data.length);
  for (let i = 0; i < arrayJsonStacked.data.length; i++) {
    tempOptions.series[i] = {
      data: arrayJsonStacked.data[i],
      name: arrayNames[i],
    };
  }
  console.log(tempOptions);
  let chart = new ApexCharts(dom, tempOptions);
  chart.render;
  return chart;
};

const showHistoriekCo2 = function (historiek) {
  hideAll();
  updateTitle('CO2 History');
  show(htmlHistoriekCO2);
  console.log(historiek);
  if (firstTimeCo2) {
    console.log('first time historiek');
    firstTimeCo2 = false;
    areaCO2 = createChart(
      historiek.data,
      'Co2 concentration [ppm]',
      document.querySelector('.area-chart-co2')
    );
  } else {
    console.log('update');
    areaCO2.updateSeries([
      {
        data: historiek.data,
      },
    ]);
  }
  hide(htmlLoading);
};
const showHistoriekTemperature = function (tempJson) {
  hideAll();
  updateTitle('Temperature');
  console.log(tempJson);
  show(htmlHistoriekTemp);
  console.log(tempJson);
  if (firstTimeTemp) {
    areaTemp = createChart(
      tempJson.data,
      'temperature [°C]',
      document.querySelector('.area-chart-temp')
    );
    firstTimeTemp = false;
  } else {
    areaTemp.updateSeries([
      {
        data: tempJson.data,
      },
    ]);
  }
  hide(htmlLoading);
};
const showHistoriekHumidity = function (humJson) {
  hideAll();
  show(htmlHistoriekHum);
  updateTitle('Humidity');
  console.log(humJson);

  if (firstTimeHum) {
    areaHum = createChart(
      humJson.data,
      'Relative humidity [%]',
      document.querySelector('.area-chart-hum')
    );
    firstTimeHum = false;
  } else {
    areaHum.updateSeries([{ data: humJson.data }]);
  }
  hide(htmlLoading);
};
const showHistoriekPressure = function (pressureJson) {
  hideAll();
  show(htmlHistoriekPressure);
  updateTitle('Pressure');
  console.log(pressureJson);

  if (firstTimePressure) {
    areaPressure = createChart(
      pressureJson.data,
      'pressure [Pa]',
      document.querySelector('.area-chart-pressure')
    );
    firstTimePressure = false;
  } else {
    areaPressure.updateSeries([{ data: pressureJson.data }]);
  }
  hide(htmlLoading);
};

const showHistoriekPM = function (jsonPM) {
  console.log(jsonPM);
  hideAll();
  show(htmlHistoriekPM);

  updateTitle('Particulate Matter');
  if (firstTimePM) {
    areaPM = createStackedChart(
      document.querySelector('.area-chart-pm'),
      jsonPM,
      ['pm1', 'pm2.5', 'pm10']
    );
    areaPM.render();
    console.log(areaPM);
  } else {
    for (let i = 0; i < arrayJsonStacked.data.length; i++) {
      data = {
        data: arrayJsonStacked.data[i],
        name: arrayNames[i],
      };
    }
    areaPM.updateSeries([{ data: data }]);
  }
  hide(htmlLoading);
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
const getHistoriekPM = function () {
  const url = backend + '/historiek/pm/';
  handleData(url, showHistoriekPM, callbackError);
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
        toggleClass(htmlDropDownHistoriekMobile);
        toggleClass(document.querySelector('.c-dropup-icon'));
        toggleClass(document.querySelector('.c-dropdown-icon'));
        toggleClass(document.querySelector('.c-mobile-dropdown-icon'));
        toggleClass(document.querySelector('.c-mobile-dropup-icon'));
      } else {
        const btns = document.querySelectorAll('.js-btn-bg-blue-sidebar');
        for (let btn2 of btns) {
          btn2.classList.remove('c-selected');
        }
        let dropdown = document.querySelectorAll('.js-dropdown-btn');
        for (let dropdownBtn of dropdown) {
          dropdownBtn.classList.remove('c-selected');
        }
        toggleSidebar();
        this.classList.add('c-selected');
        const type = this.dataset.type;
        console.log(type);
        showPage(type);
      }
    });
  }
};

const listenToRefesh = function () {
  for (let refesh of htmlRefesh) {
    refesh.addEventListener('click', function () {
      console.log('Refesh');
      getRefesh();
    });
  }
};

const listenToMobileNav = function () {
  const hamburgermenu = document.querySelectorAll('.js-menu');
  for (let menu of hamburgermenu) {
    menu.addEventListener('click', function () {
      console.log('mobile nav');
      toggleSidebar();
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
      toggleSidebar();
      let dropdown = document.querySelectorAll('.js-dropdown-btn');
      for (let dropdownBtn of dropdown) {
        dropdownBtn.classList.remove('c-selected');
      }
      const btns = document.querySelectorAll('.js-btn-bg-blue-sidebar');
      for (let btn2 of btns) {
        btn2.classList.remove('c-selected');
      }
      console.log(this.dataset.type);
      show(document.querySelector('.js-loading'));
      hideAll();
      console.log(this.classList.add('c-selected'));
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
        case 'pm':
          getHistoriekPM();
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
    htmlRefesh = document.querySelectorAll('.js-refesh');
    htmlSettings = document.querySelector('.js-settings');
    htmlActueel = document.querySelector('.js-actueel');
    htmlhamburger = document.querySelector('.c-hamburger-menu');
    htmlCloseHamburger = document.querySelector('.c-close-hamburger');
    htmlMobileNav = document.querySelector('.js-mobile-nav');
    htmlSlider = document.querySelector('.js-slider');
    htmlRPM = document.querySelector('.js-fan-rpm');
    htmlHistoriek = document.querySelector('.js-historiek');
    HTMLDropDownHistoriek = document.querySelector('.js-sidebar-historiek');
    htmlDropDownHistoriekMobile = document.querySelector(
      '.js-mobile-sidebar-historiek'
    );
    htmlHistoriekCO2 = document.querySelector('.js-historiek-co2');
    htmlTopBarTitle = document.querySelectorAll('.js-topbar-title');
    htmlHistoriekTemp = document.querySelector('.js-historiek-temp');
    htmlHistoriekHum = document.querySelector('.js-historiek-hum');
    htmlHistoriekPressure = document.querySelector('.js-historiek-pressure');
    htmlHistoriekPM = document.querySelector('.js-historiek-pm');
    htmlLoading = document.querySelector('.js-loading');
    listenToHistoryDropdown();
    listenToBtnSidebar();
    listenToMobileNav();
  }
};

document.addEventListener('DOMContentLoaded', init);
// #endregion
