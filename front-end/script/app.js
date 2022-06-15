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
    htmlHistoriekIaq,
    htmlHistoriekPM,
    htmlHistoriekPmNop,
    htmlChartType,
    htmlRefeshGraph,
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
const hideSidebar = function () {
  htmlMobileNav.classList.remove('c-show-nav')
  show(htmlhamburger)
  hide(htmlCloseHamburger)
}
const showSidebar = function () {
  htmlMobileNav.classList.add('c-show-nav')
  hide(htmlhamburger)
  show(htmlCloseHamburger)
}

//reset chartoptions on switching graphs
const resetGraphOptions = function (type) {
  show(htmlChartType);
  let chartranges = document.querySelectorAll('.js-chartrange');
  for (let chartrange of chartranges) {
    let chartType = chartrange.value;
    // console.log(chartType, type);
    if (chartType == type) {
      chartrange.checked = true;
    } else {
      chartrange.checked = false;
    }
  }
};

// Listen to the chart selection buttens/ only do run once

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
      listenToChartNavigation();
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
      createFanChart();
      // listenToReload();
      listenToSocketFan();
      listenToFanMode();
      listenToSlider();
      OnlyOneListenersettings = false;
    }
    getFanPWM()
  }
};

// shows ip address in settings --  called by getpage
const showIP = function (jsonIP) {
  console.log(jsonIP);
  let lanIps = jsonIP.ip.lan;
  let wlanIps = jsonIP.ip.wlan;
  for (let lanip of lanIps) {
    if (lanip) {
      new QRCode(document.querySelector('.qrCodeLan'), {
        text: lanip,
        width: 120,
        height: 120,
      })

    }
    // new QRCode(document.querySelector('.qrCodeLan'), lanIps[0])
  }
  if (!lanIps[0]) {
    document.querySelector('.js-box-lan').style.display = 'none'
  }
  for (let wlanIP of wlanIps) {
    if (wlanIP) {
      new QRCode(document.querySelector('.qrCodeWlan'), {
        text: wlanIP,
        width: 120,
        height: 120,
      })

    }
    // new QRCode(document.querySelector('.qrCodeWlan'), wlanIps[0])

  }
  const htmlElementWlan = document.querySelector('.js-wlan');
  const htmlElementLan = document.querySelector('.js-lan');
  let htmlWlan = '';
  let htmlLan = '';
  for (let lanIP of lanIps) {
    htmlLan += `${lanIP}`;
  }
  for (let wlanIP of wlanIps) {
    htmlWlan += `${wlanIP}`;
  }
  htmlElementLan.innerHTML = htmlLan;
  htmlElementWlan.innerHTML = htmlWlan;
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

const createFanChart = function () {
  fanChart = new ApexCharts(document.querySelector('.js-fan-chart'), fanOptions)
  fanChart.render();
}

// creates a linechart with 3 rows -- called by showHistoriekPM
const createLineChart = function (dom, arrayJsonStacked, arrayNames) {
  let tempOptions = JSON.parse(JSON.stringify(HistoriekOptionsLineChart));
  tempOptions.colors = [
    '#2699FB',
    '#00E396',
    '#504DE6',
    '#FA9E0C',
    '#FA3EDD',
    '#4FFA19',
  ];
  // console.log(arrayJsonStacked.data.length);
  for (let i = 0; i < arrayJsonStacked.data.length; i++) {
    tempOptions.series[i] = {
      data: arrayJsonStacked.data[i],
      name: arrayNames[i],
    };
  }
  tempOptions.yaxis = {
    labels: {
      formatter(value) {
        return Math.round(value);
      },
    },
  };
  // console.log(tempOptions);
  let chart = new ApexCharts(dom, tempOptions);
  return chart;
};

const prepareCharts = function (domObject, title) {
  updateTitle(title);
  show(htmlRefeshGraph);
  show(domObject);
  show(htmlChartType);
};

const updateChartData = function (chart, data) {
  chart.updateSeries([{ data: data }]);
};

const showHistoriek = function (historiek) {
  console.info(historiek);
  const unit = historiek.unit;
  console.log(historiek);
  prepareCharts(
    document.querySelector(`.js-historiek-${unit}`),
    pageTitles[unit]
  );
  if (unit == 'pm') {
    showHistoriekPM(historiek);
  } else if (unit == 'pmnop') {
    showHistoriekPmNop(historiek);
  } else {
    if (firstTime[unit]) {
      firstTime[unit] = false;
      historiekChart[unit] = createChart(
        historiek.data,
        chartTitles[unit],
        document.querySelector(`.area-chart-${unit}`)
      );
      historiekChart[unit].render();
    } else {
      updateChartData(historiekChart[unit], historiek.data);
    }
  }
  hide(htmlLoading);
};

const showHistoriekPM = function (jsonPM) {
  if (firstTime.pm) {
    areaPM = createLineChart(document.querySelector('.area-chart-pm'), jsonPM, [
      'pm1',
      'pm2.5',
      'pm10',
    ]);
    areaPM.render();
    firstTime.pm = false;
  } else {
    const arrayNames = ['pm1', 'pm2.5', 'pm10'];
    let data = [];
    for (let i = 0; i < jsonPM.data.length; i++) {
      data[i] = {
        data: jsonPM.data[i],
        name: arrayNames[i],
      };
    }
    areaPM.updateSeries(data);
  }
};

const showHistoriekPmNop = function (jsonPmNop) {
  if (firstTime.pmNop) {
    firstTime.pmNop = false;
    areaPmNop = createLineChart(
      document.querySelector('.area-chart-pmnop'),
      jsonPmNop,
      namesPmnop
    );
    areaPmNop.render();
  } else {
    let data = [];
    for (let i = 0; i < jsonPmNop.data.length; i++) {
      data[i] = {
        data: jsonPmNop.data[i],
        name: namesPmnop[i],
      };
    }
    areaPmNop.updateSeries(data);
  }
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
  iaqchart = new ApexCharts(
    document.querySelector('.js-iaq-chart'),
    iaqChartOptions
  );
  iaqchart.render();
  listenToSocketCharts();
  getActueleData();
};
// updates the realtime charts
const showUpdatedCharts = function (jsonObject) {
  // console.log(jsonObject);
  const data = jsonObject.data;
  console.log(data);
  let PMNop = {};
  let pm1, pm2_5, pm10;
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
      case 'PM1_AP':
        pm1 = setPoint;
        break;
      case 'PM2.5_AP':
        pm2_5 = setPoint;
        break;
      case 'PM10_AP1':
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
  updatePMCharts(pm1, pm2_5, pm10);
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
}

const showNoNewLiveData = function (type_data) {
  // console.log(type_data, 'noNew')
  for (let indicatie of htmlIndicatieAll) {
    if (indicatie.dataset.name === type_data) {
      indicatie.classList.remove('u-green');
    }
  }
};

const showNewLiveData = function (type_data) {
  // console.log(type_data, 'New')
  for (let indicatie of htmlIndicatieAll) {
    if (indicatie.dataset.name === type_data) {
      // console.log("Found it")
      indicatie.classList.add('u-green');
    }
  }
};

const showAcuteleDataOnLoad = function () {
  let event = new CustomEvent('click');
  console.log(event);
  document.querySelector('.js-button-acuteel').dispatchEvent(event);
  hideSidebar();
};

const showFanProgress = function (jsonObject) {
  console.log(jsonObject.fan_pwm)
  let slider = document.querySelector('.js-slider')
  slider.value = jsonObject.fan_pwm
  document.querySelector('.js-slider-number').value = jsonObject.fan_pwm
  slider.style.backgroundSize = jsonObject.fan_pwm + '% 100%'

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
    case 'iaq':
      chart = iaqchart;
      seriesValue = valueToPercentIaq(value);
      typeLabel = labels.iaq;
      // console.log(typeLabel, seriesValue);
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
          x: '0.3 µm',
          y: data['NOP_0.3um'],
        },
        {
          x: '0.5 µm',
          y: data['NOP_0.5um'],
        },
        {
          x: '1 µm',
          y: data['NOP_1um'],
        },
        {
          x: '2.5 µm',
          y: data['NOP_2.5um'],
        },
        {
          x: '5 µm',
          y: data['NOP_5um'],
        },
        {
          x: '10 µm',
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




const showHistoriekGrafiek = function (type) {
  console.log('showHisoriekGrafiek');
  let typesMobile = ['DAY', 'WEEK', 'YTD'];
  show(htmlHistoriek);
  hideSidebar();
  activeGraph = type;
  if (typesMobile.includes(type)) {
    console.log('mobile');
    show(htmlLoading);
    let selectedNav = document.querySelectorAll('.c-selected');
    for (let i of selectedNav) {
      i.classList.remove('c-selected');
    }
    let dropdown = document.querySelectorAll('.js-dropdown-btn-mobile');
    for (let btn of dropdown) {
      if (btn.dataset.type === type) {
        btn.classList.add('c-selected');
      }
    }

    hideAll();
    console.log(type, loaded_historiek.mobile[type]);

    selectedRange = type;
    let beginDate = new Date();
    let dateNow = new Date();
    dateNow = Math.round(dateNow.getTime() / 1000);
    const htmlSelectedRangeTitle = document.querySelector(
      '.js-Mobile-range-icon'
    );
    switch (type) {
      case 'DAY':
        beginDate.setDate(beginDate.getDate() - 1);
        beginDate = Math.round(beginDate.getTime() / 1000);
        htmlSelectedRangeTitle.innerHTML = 'Today\'s air quality';
        break;
      case 'WEEK':
        beginDate.setDate(beginDate.getDate() - 7);
        beginDate = Math.round(beginDate.getTime() / 1000);
        htmlSelectedRangeTitle.innerHTML = 'last week\'s air quality';
        break;
      case 'YTD':
        beginDate.setDate(beginDate.getDate() - 10000);
        beginDate = Math.round(beginDate.getTime() / 1000);
        htmlSelectedRangeTitle.innerHTML = 'Air quality of all time';
    }
    for (let i of [
      'co2',
      'temperature',
      'humidity',
      'pressure',
      'iaq',
      'pm',
      'pmnop',
    ]) {
      getHistoriek(i, type, beginDate, dateNow);
    }
  } else {
    console.log('desktop', type);
    let selectedNav = document.querySelectorAll('.c-selected');
    for (let i of selectedNav) {
      i.classList.remove('c-selected');
    }
    showSelectedSidebar(type);
    show(htmlLoading);
    hideAll();
    show(htmlRefeshGraph);

    // this.classList.add('c-selected');
    if (loaded_historiek[type] == false) {
      console.log('Loading for first time', type);
      loaded_historiek[type] = true;
      let dateYesterday = new Date();
      let dateNow = new Date();
      dateNow = Math.round(dateNow.getTime() / 1000);
      dateYesterday.setDate(dateYesterday.getDate() - 1);
      dateYesterday = Math.round(dateYesterday.getTime() / 1000);
      activeGraph = type;
      resetGraphOptions('DAY');
      selectedRange = 'DAY';
      // console.log(type, 'DAY', dateYesterday, dateNow);
      getHistoriek(type, 'DAY', dateYesterday, dateNow);
    } else {
      // just show the page and reset the graph options.
      hideAll();
      show(htmlRefeshGraph);
      switch (type) {
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
        case 'iaq':
          updateTitle('Iaq');
          show(htmlHistoriekIaq);
          resetGraphOptions(htmlHistoriekIaq.dataset.range);
          break;
        case 'pm':
          updateTitle('Particulate Matter');
          show(htmlHistoriekPM);
          resetGraphOptions(htmlHistoriekPM.dataset.range);
          break;
        case 'pmnop':
          updateTitle('Particulate Matter: Number of particles');
          show(htmlHistoriekPmNop);
          resetGraphOptions(htmlHistoriekPmNop.dataset.range);
      }

      hide(htmlLoading);
      show(htmlChartType);
    }
  }
};

const showSelectedSidebar = function (type) {
  console.log(type);
  let succes = false;
  let dropdown = document.querySelectorAll('.js-dropdown-btn');
  for (let dropdownBtn of dropdown) {
    if (dropdownBtn.dataset.type == type) {
      dropdownBtn.classList.add('c-selected');
      succes = true;
    }
  }
  const btns = document.querySelectorAll('.js-btn-bg-blue-sidebar');
  for (let btn of btns) {
    if (btn.dataset.type == type) {
      btn.classList.add('c-selected');
      succes = true;
    }
  }
  return succes;
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
  console.log(pwm)
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
const getFanPWM = function () {
  const url = backend + '/fan/pwm/'
  handleData(url, showFanProgress, callbackError)
}
const getHistoriek = function (unit, type, begin, end) {
  const url = backend + `/historiek/${unit}/${type}/${begin}-${end}/`;
  handleData(url, showHistoriek, callbackError);
};

// updates the graph depending on state
const getGraphData = function (graph, graphType) {
  let now = new Date();
  let dateNow = Math.round(now.getTime() / 1000);
  let beginDate;
  activeGraph = graph;
  selectedRange = graphType;
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
  getHistoriek(graph, graphType, beginDate, dateNow);
};

// #endregion

// #region ***  Event Listeners - listenTo___            ***********
const listenToSocketCharts = function () {
  socketio.on('B2F_CO2', function (data) {
    console.log('New co2 reading');
    const co2Reading = data['CO2'];
    updateOptionsCharts(co2Reading, 'CO2');
    newData.co2 = new Date();
    showNewLiveData('CO2');
  });
  socketio.on('B2F_PM', function (data) {
    // console.log(data);
    const pm2_5 = data['PM2.5_AP'];
    const pm1 = data['PM1_AP'];
    const pm10 = data['PM10_AP1'];
    updatePMCharts(pm1, pm2_5, pm10);
    updatePMNOPcharts(data);
    newData.pm = new Date();
    newData.pmNop = new Date();
    showNewLiveData('pm');
    showNewLiveData('pmnop');
  });
  socketio.on('B2F_BME', function (bme_data) {
    let pressureVal = bme_data.pressure / 100;
    let humidityVal = bme_data.humidity;
    let temperatureVal = bme_data.temperature;
    let iaqVal = bme_data.iaq;
    let iaq = bme_data.iaq;
    // console.log(bme_data);
    // console.log(pressureVal, humidityVal, temperatureVal);
    let datum = new Date();
    newData.temp = newData.hum = newData.pressure = newData.iaq = datum;
    showNewLiveData('pressure');
    showNewLiveData('hum');
    showNewLiveData('temp');
    showNewLiveData('iaq');
    updateOptionsCharts(pressureVal, 'pressure');
    updateOptionsCharts(humidityVal, 'humidity');
    updateOptionsCharts(temperatureVal, 'temperature');
    updateOptionsCharts(iaq, 'iaq');
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
        toggleClass(document.querySelector('.js-sidebar-historiek-mobile'));
      } else {
        hide(htmlHistoriek);
        let selectedNav = document.querySelectorAll('.c-selected');
        for (let i of selectedNav) {
          i.classList.remove('c-selected');
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
const handleInputChange = function (e) {
  let target = e.target
  if (e.target.type !== 'range') {
    target = document.getElementById('range')
  }
  console.log(target)
  const min = target.min
  const max = target.max
  const val = target.value

  socketio.emit('F2B_fan_speed', { pwm: val })

  target.style.backgroundSize = (val - min) * 100 / (max - min) + '% 100%'
}
const listenToSlider = function () {

  //#region testing
  const rangeInputs = document.querySelectorAll('input[type="range"]')
  const numberInput = document.querySelector('input[type="number"]')


  rangeInputs.forEach(input => {
    input.addEventListener('input', handleInputChange)
  })

  numberInput.addEventListener('input', handleInputChange)


  //#endregion

};

const listenToSocketFan = function () {
  socketio.on('B2F_fan_speed', function (msg) {
    // htmlRPM.innerHTML = Math.round(msg.rpm) + ' rpm';
    let percentage = valueToPercentFan(msg.rpm)
    fanChart.updateSeries([percentage])
  });
};

const listenToHistoryDropdown = function () {
  let dropdown = document.querySelectorAll('.js-dropdown-btn');
  for (const page of dropdown) {
    page.addEventListener('click', function () {
      showHistoriekGrafiek(this.dataset.type);
    });
  }
};

const listenToHistoriekDropdownMobile = function () {
  let dropdown = document.querySelectorAll('.js-dropdown-btn-mobile');
  for (let range of dropdown) {
    range.addEventListener('click', function () {
      let type = range.dataset.type;
      console.log(type);
      showHistoriekGrafiek(type);
    });
  }
};

const listenToRefeshGraphs = function () {
  htmlRefeshGraph.addEventListener('click', function () {
    getGraphData(activeGraph, selectedRange);
  });
};

const listenToNoNewData = async function () {
  let datum;
  while (true) {
    // console.log('checking...')
    datum = new Date() - 120000;
    if (datum > newData.co2) {
      showNoNewLiveData('CO2');
      // console.log('no new co2')
    }
    if (datum > newData.temp) {
      showNoNewLiveData('temp');
    }
    if (datum > newData.hum) {
      showNoNewLiveData('hum');
    }
    if (datum > newData.pressure) {
      showNoNewLiveData('pressure');
    }
    if (datum > newData.iaq) {
      showNoNewLiveData('iaq');
    }
    if (datum > newData.pm) {
      showNoNewLiveData('pm');
    }
    if (datum > newData.pmNop) {
      showNoNewLiveData('pmNop');
    } else {
      // console.log('everything up to date')
    }

    await new Promise((done) => setTimeout(() => done(), 5000));
  }
};

const listenToNavigateToHistoriek = function () {
  const html = document.querySelectorAll('.js-to-historiek');
  for (let link of html) {
    link.addEventListener('click', function () {
      // console.log(this.dataset.name);
      showHistoriekGrafiek(this.dataset.name);
    });
  }
};

const listenToPowerMenu = function () {
  document
    .querySelector('.js-power-management-dropdown-btn')
    .addEventListener('click', function () {
      toggleClass(document.querySelector('.js-power-management-dropdown'));
    });
  document.querySelector('.js-reboot').addEventListener('click', function () {
    const url = backend + '/reboot/';
    handleData(url, SetReload, callbackError);
  });
  document
    .querySelector('.js-power-down')
    .addEventListener('click', function () {
      const url = backend + '/poweroff/';
      handleData(url, SetReload, callbackError);
    });
};

const listenTographOptions = function () {
  const htmlChartRange = document.querySelectorAll('.js-chartrange');
  for (let chartRange of htmlChartRange) {
    chartRange.addEventListener('change', function () {
      let graph = activeGraph;
      // console.log(graph, this.value);
      getGraphData(graph, this.value);
    });
  }
};


let disable_click_flag;
const dontClickWhenScrolling = function () {
  window.addEventListener('scroll', () => {
    disable_click_flag = true;

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(function () { disable_click_flag = false }, 250);
  })
};

const listenToChartNavigation = function () {
  document.querySelector('.js-temperature-chart').addEventListener('click', function () {
    console.log('click')
    showHistoriekGrafiek('temperature')
  })
  document.querySelector('.js-co2-chart').addEventListener('click', function () {
    console.log('click')
    showHistoriekGrafiek('co2')
  })
  document.querySelector('.js-humidity-chart').addEventListener('click', function () {
    console.log('click')
    showHistoriekGrafiek('humidity')
  })
  document.querySelector('.js-pressure-chart').addEventListener('click', function () {
    console.log('click')
    showHistoriekGrafiek('pressure')
  })
  document.querySelector('.js-iaq-chart').addEventListener('click', function () {
    console.log('click')
    showHistoriekGrafiek('iaq')
  })
  document.querySelector('.js-pm-chart').addEventListener('click', function () {
    console.log('click')
    showHistoriekGrafiek('pm')
  })
  document.querySelector('.js-pm-chart-NOP').addEventListener('click', function () {
    console.log('click')
    showHistoriekGrafiek('pmnop')
  })
}










// #endregion
const SetReload = function () {
  document.location.reload(true);
};
// #region ***  Init / DOMContentLoaded                  ***********
const init = function () {
  console.log('Timeout');
  // setTimeout(SetReload, 30000)
  if (document.querySelector('.Homepagina')) {
    // getBrowerSize();
    console.log('Homepage');
    loadQuerySelectors();
    listenToHistoryDropdown();
    listenToHistoriekDropdownMobile();
    listenToBtnSidebar();
    listenToMobileNav();
    listenTographOptions();
    listenToRefeshGraphs();
    listenToNoNewData();
    listenToNavigateToHistoriek();
    listenToPowerMenu();
    hideAll();
    showAcuteleDataOnLoad();
    dontClickWhenScrolling();
  }
};

document.addEventListener('DOMContentLoaded', init);





