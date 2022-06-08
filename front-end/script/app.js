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

let selectedRange, activeGraph;
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
  htmlDropDownHistoriekMobile,
  htmlReloadPage,
  htmlChartType,
  htmlRefeshGraph,
  htmlIndicatieAll;

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
    htmlReloadPage,
    htmlChartType,
    htmlRefeshGraph
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

//reset chartoptions on switching graphs
const resetGraphOptions = function (type) {
  show(htmlChartType);
  let chartranges = document.querySelectorAll('.js-chartrange');
  for (let chartrange of chartranges) {
    let chartType = chartrange.value;
    console.log(chartType, type);
    if (chartType == type) {
      chartrange.checked = true;
    } else {
      chartrange.checked = false;
    }
  }
};

// Listen to the chart selection buttens/ only do run once
const listenTographOptions = function () {
  const htmlChartRange = document.querySelectorAll('.js-chartrange');
  for (let chartRange of htmlChartRange) {
    chartRange.addEventListener('change', function () {
      let graph = htmlChartType.dataset.active_graph;
      console.log(graph, this.value);
      getGraphData(graph, this.value);
    });
  }
  // const htmlSubmitTime = document.querySelector('.js-submit-date-range');
  // htmlSubmitTime.addEventListener('click', function () {
  //   console.log('hey');
  //   let startDate = document.querySelector('.js-startdate').value;
  //   let endDate = document.querySelector('.js-enddate').value;
  //   console.log(startDate, endDate);
  // });
};

// updates the graph depending on state
const getGraphData = function (graph, graphType) {
  let now = new Date();
  let dateNow = Math.round(now.getTime() / 1000);
  let beginDate;
  activeGraph = graph
  selectedRange = graphType
  switch (graphType) {
    case 'DAY':
      now.setDate(now.getDate() - 1);
      beginDate = Math.round(now.getTime() / 1000);
      break;
    case 'WEEK':
      now.setDate(now.getDate() - 7);
      beginDate = Math.round(now.getTime() / 1000);
      break;
    case 'YTD':
      beginDate = 'start';
      break;
    default:
      console.error('Invalid GraphType');
  }

  switch (graph) {
    case 'co2':
      getHistoriekCo2Filtered(graphType, beginDate, dateNow);
      htmlHistoriekCO2.dataset.range = graphType;
      break;
    case 'temperature':
      getHistoriekTemperatureFiltered(graphType, beginDate, dateNow);
      htmlHistoriekTemp.dataset.range = graphType;
      break;
    case 'humidity':
      getHistoriekHumFiltered(graphType, beginDate, dateNow);
      htmlHistoriekHum.dataset.range = graphType;
      break;
    case 'pressure':
      getHistoriekPressureFiltered(graphType, beginDate, dateNow);
      htmlHistoriekPressure.dataset.range = graphType;
      break;
    case 'pm':
      getHistoriekPMFiltered(graphType, beginDate, dateNow);
      htmlHistoriekPM.dataset.range = graphType;
      break;
    default:
      console.error('Invalid Graph type');
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
    show(htmlReloadPage);
    getFanSetting();
    if (OnlyOneListenersettings) {
      getIP();
      listenToReload();
      listenToSocketFan();
      listenToFanMode();
      listenToSlider();
      OnlyOneListenersettings = false;
    }
  }
};

// shows ip address in settings --  called by getpage
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

// Creates history chart -- called by showHisoriek
const createChart = function (data, name, dom) {
  // just = is not enough cause just a reference, you need to do this stupid stuff.
  let tempOptions = JSON.parse(JSON.stringify(HistoriekOptions));
  tempOptions.series[0] = {
    data: data,
    name: name,
  };
  tempOptions.yaxis = {
    labels: {
      formatter(value) {
        return Math.round(value);
      },
    },
  };
  let chart = new ApexCharts(dom, tempOptions);
  return chart;
};

// creates a linechart with 3 rows -- called by showHistoriekPM
const createStackedChart = function (dom, arrayJsonStacked, arrayNames) {
  let tempOptions = HistoriekOptionsLineChart;
  tempOptions.colors = ['#2699FB', '#00E396', '#504DE6'];
  console.log(arrayJsonStacked.data.length);
  for (let i = 0; i < arrayJsonStacked.data.length; i++) {
    tempOptions.series[i] = {
      data: arrayJsonStacked.data[i],
      name: arrayNames[i],
    };
  }
  console.log(tempOptions);
  let chart = new ApexCharts(dom, tempOptions);
  return chart;
};

const showHistoriekCo2 = function (historiek) {
  hideAll();
  updateTitle('CO2 History');
  show(htmlRefeshGraph)
  show(htmlHistoriekCO2);
  show(htmlChartType);
  console.log(historiek);
  if (firstTimeCo2) {
    console.log('first time historiek');
    firstTimeCo2 = false;
    areaCO2 = createChart(
      historiek.data,
      'Co2 concentration [ppm]',
      document.querySelector('.area-chart-co2')
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
  hide(htmlLoading);
};
const showHistoriekTemperature = function (tempJson) {
  hideAll();
  updateTitle('Temperature');
  console.log(tempJson);
  show(htmlHistoriekTemp);
  show(htmlChartType);
  show(htmlRefeshGraph)
  console.log(tempJson);
  if (firstTimeTemp) {
    areaTemp = createChart(
      tempJson.data,
      'temperature [°C]',
      document.querySelector('.area-chart-temp')
    );
    areaTemp.render();
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
  show(htmlChartType);
  show(htmlRefeshGraph)
  updateTitle('Humidity');
  console.log(humJson);

  if (firstTimeHum) {
    areaHum = createChart(
      humJson.data,
      'Relative humidity [%]',
      document.querySelector('.area-chart-hum')
    );
    areaHum.render();
    firstTimeHum = false;
  } else {
    areaHum.updateSeries([{ data: humJson.data }]);
  }
  hide(htmlLoading);
};
const showHistoriekPressure = function (pressureJson) {
  hideAll();
  show(htmlHistoriekPressure);
  show(htmlChartType);
  show(htmlRefeshGraph)
  updateTitle('Pressure');
  console.log(pressureJson);

  if (firstTimePressure) {
    areaPressure = createChart(
      pressureJson.data,
      'pressure [Pa]',
      document.querySelector('.area-chart-pressure')
    );
    areaPressure.render();
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
  show(htmlChartType);
  show(htmlRefeshGraph)
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

// renders the realtime charts
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
// updates the realtime charts
const showUpdatedCharts = function (jsonObject) {
  // console.log(jsonObject);
  const data = jsonObject.data;
  console.log(data)
  let PMNop = {};
  let pm1, pm2_5, pm10
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
      case "PM1_AP":
        pm1 = setPoint;
        break;
      case "PM2.5_AP":
        pm2_5 = setPoint;
        break;
      case "PM10_AP1":
        pm10 = setPoint;
        break;
    }
    switch (sensorWaarde.devicenaam) {
      case 'PMS5003':
        // console.log('PMS');
        const beschrijving = sensorWaarde.beschrijving;
        PMNop[beschrijving] = sensorWaarde.setwaarde;
    }
  }
  // console.log(PM);
  updatePMCharts(pm1, pm2_5, pm10)
  updatePMNOPcharts(PMNop);
};

// callback from when data is refeshed
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

const showNoNewLiveData = function (type_data) {
  // console.log(type_data, 'noNew')
  for (let indicatie of htmlIndicatieAll) {

    if (indicatie.dataset.name === type_data) {
      indicatie.classList.remove('u-green')
    }
  }
}

const showNewLiveData = function (type_data) {
  // console.log(type_data, 'New')
  for (let indicatie of htmlIndicatieAll) {
    if (indicatie.dataset.name === type_data) {
      console.log("Found it")
      indicatie.classList.add('u-green')
    }
  }
}

//updates label and data
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

const getHistoriekCo2Filtered = function (type, begin, end) {
  const url = backend + `/historiek/co2/${type}/${begin}-${end}/`;
  handleData(url, showHistoriekCo2, callbackError);
};

const getHistoriekTemperatureFiltered = function (type, begin, end) {
  const url = backend + `/historiek/temperature/${type}/${begin}-${end}/`;
  handleData(url, showHistoriekTemperature, callbackError);
};

const getHistoriekHumFiltered = function (type, begin, end) {
  const url = backend + `/historiek/humidity/${type}/${begin}-${end}/`;
  handleData(url, showHistoriekHumidity, callbackError);
};

const getHistoriekPressureFiltered = function (type, begin, end) {
  const url = backend + `/historiek/pressure/${type}/${begin}-${end}/`;
  handleData(url, showHistoriekPressure, callbackError);
};

const getHistoriekPMFiltered = function (type, begin, end) {
  const url = backend + `/historiek/pm/${type}/${begin}-${end}/`;
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
    newData.co2 = new Date()
    showNewLiveData('CO2')
  });
  socketio.on('B2F_PM', function (data) {
    // console.log(data);
    const pm2_5 = data['PM2.5_AP'];
    const pm1 = data['PM1_AP'];
    const pm10 = data['PM10_AP1'];
    updatePMCharts(pm1, pm2_5, pm10);
    updatePMNOPcharts(data);
    newData.pm = new Date()
    newData.pmNop = new Date()
    showNewLiveData('pm')
    showNewLiveData('pmNop')
  });
  socketio.on('B2F_BME', function (bme_data) {
    let pressureVal = bme_data.pressure / 100;
    let humidityVal = bme_data.humidity;
    let temperatureVal = bme_data.temperature;
    // console.log(pressureVal, humidityVal, temperatureVal);
    let datum = new Date()
    newData.temp = newData.hum = newData.pressure = datum
    showNewLiveData('pressure')
    showNewLiveData('hum')
    showNewLiveData('temp')
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
        // toggles the dropdown menu
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
      show(htmlLoading);
      hideAll();

      this.classList.add('c-selected');
      if (this.dataset.is_loaded == 0) {
        this.dataset.is_loaded = true;
        let dateYesterday = new Date();
        let dateNow = new Date();
        dateNow = Math.round(dateNow.getTime() / 1000);
        dateYesterday.setDate(dateYesterday.getDate() - 1);
        dateYesterday = Math.round(dateYesterday.getTime() / 1000);
        htmlChartType.dataset.active_graph = this.dataset.type;
        show(htmlRefeshGraph)
        resetGraphOptions('DAY');
        activeGraph = this.dataset.type
        selectedRange = 'DAY'
        switch (this.dataset.type) {
          case 'co2':
            getHistoriekCo2Filtered('DAY', dateYesterday, dateNow);
            break;
          case 'temperature':
            getHistoriekTemperatureFiltered('DAY', dateYesterday, dateNow);
            break;
          case 'humidity':
            getHistoriekHumFiltered('DAY', dateYesterday, dateNow);
            break;
          case 'pressure':
            getHistoriekPressureFiltered('DAY', dateYesterday, dateNow);
            break;
          case 'pm':
            getHistoriekPMFiltered('DAY', dateYesterday, dateNow);
            break;
        }
      } else {
        // just show the page and reset the graph options.
        hideAll();
        switch (this.dataset.type) {
          case 'co2':
            updateTitle('CO2');
            show(htmlHistoriekCO2);
            resetGraphOptions(htmlHistoriekCO2.dataset.range);
            break;
          case 'temperature':
            updateTitle('Temperature');
            show(htmlHistoriekTemp);
            resetGraphOptions(htmlHistoriekTemp.dataset.range);
            break;
          case 'humidity':
            updateTitle('Humidity');
            show(htmlHistoriekHum);
            resetGraphOptions(htmlHistoriekHum.dataset.range);
            break;
          case 'pressure':
            updateTitle('Pressure');
            show(htmlHistoriekPressure);
            resetGraphOptions(htmlHistoriekPressure.dataset.range);
            break;
          case 'pm':
            updateTitle('Particulate Matter');
            show(htmlHistoriekPM);
            resetGraphOptions(htmlHistoriekPM.dataset.range);
            break;
        }

        hide(htmlLoading);
        show(htmlChartType);
      }
    });
  }
};

const listenToRefeshGraphs = function () {
  htmlRefeshGraph.addEventListener('click', function () {
    getGraphData(activeGraph, selectedRange)
  })
}

const listenToNoNewData = async function () {
  let datum
  while (true) {
    // console.log('checking...')
    datum = new Date() - 120000
    if (datum > newData.co2) {
      showNoNewLiveData('CO2')
      // console.log('no new co2')
    }
    if (datum > newData.temp) {
      showNoNewLiveData('temp')
    }
    if (datum > newData.hum) {
      showNoNewLiveData('hum')
    }
    if (datum > newData.pressure) {
      showNoNewLiveData('pressure')
    }
    if (datum > newData.voc) {
      showNoNewLiveData('voc')
    } if (datum > newData.pm) {
      showNoNewLiveData('pm')
    } if (datum > newData.pmNop) {
      showNoNewLiveData('pmNop')
    } else {
      // console.log('everything up to date')
    }

    await new Promise(done => setTimeout(() => done(), 5000));
  }
}




const listenToReload = function () {
  htmlReloadPage.addEventListener('click', function () {
    SetReload();
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
    htmlReloadPage = document.querySelector('.js-reload-page');
    htmlChartType = document.querySelector('.js-chart-type');
    htmlRefeshGraph = document.querySelector('.js-refesh-chart')
    htmlIndicatieAll = document.querySelectorAll(".js-indicatie")
    listenToHistoryDropdown();
    listenToBtnSidebar();
    listenToMobileNav();
    listenTographOptions();
    listenToRefeshGraphs();
    listenToNoNewData();
  }
};

document.addEventListener('DOMContentLoaded', init);
// #endregion
