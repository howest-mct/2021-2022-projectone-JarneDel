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

let co2Chart,
  tempChart,
  humidityChart,
  pressureChart,
  PMchart,
  PMNopChart,
  VOCchart;

let selectedPage = 'actueel';
// #region ***  DOM references                           ***********
let hmtlPM, htmlOnBoot;
let htmlActueel;

// #endregion

// #region ***  Callback-Visualisation - show___         ***********
const showPage = function (type) {
  console.log(type);
  if (type == 'actueel') {
    document.querySelector(
      '.c-topbar'
    ).innerHTML = `<h2>Actuele data</h2><svg class="js-refesh" xmlns="http://www.w3.org/2000/svg" height="48" width="48">
    <path
      d="M24 40Q17.35 40 12.675 35.325Q8 30.65 8 24Q8 17.35 12.675 12.675Q17.35 8 24 8Q28.25 8 31.45 9.725Q34.65 11.45 37 14.45V8H40V20.7H27.3V17.7H35.7Q33.8 14.7 30.85 12.85Q27.9 11 24 11Q18.55 11 14.775 14.775Q11 18.55 11 24Q11 29.45 14.775 33.225Q18.55 37 24 37Q28.15 37 31.6 34.625Q35.05 32.25 36.4 28.35H39.5Q38.05 33.6 33.75 36.8Q29.45 40 24 40Z" />
  </svg>`;
    htmlActueel.classList.remove('c-hidden');
    if (OnlyOneListener) {
      showCharts();
      listenToRefesh();
      OnlyOneListener = false;
    }
  }
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
  });
};

const listenToBtnSidebar = function () {
  const btns = document.querySelectorAll('.js-btn-bg-blue-sidebar');
  for (let btn of btns) {
    btn.addEventListener('click', function () {
      const btns = document.querySelectorAll('.js-btn-bg-blue-sidebar');
      for (let btn2 of btns) {
        btn2.classList.remove('c-selected');
      }
      this.classList.add('c-selected');
      const type = this.dataset.type;
      showPage(type);
    });
  }
};

const listenToRefesh = function () {
  document.querySelector('.js-refesh').addEventListener('click', function () {
    console.log('Refesh');
    getRefesh();
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
    console.log('Homepage');
    htmlActueel = document.querySelector('.js-actueel');
    listenToBtnSidebar();
  }
};

document.addEventListener('DOMContentLoaded', init);
// #endregion
