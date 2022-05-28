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



let co2Chart, tempChart, humidityChart, pressureChart;

let selectedPage = "actueel";
// #region ***  DOM references                           ***********
let hmtlPM, htmlOnBoot;
let htmlActueel;

// #endregion

// #region ***  Callback-Visualisation - show___         ***********
const showPage = function (type) {
  console.log(type)
  if (type == 'actueel') {
    document.querySelector('.c-topbar').innerHTML = `<h2>Actuele data</h2>`
    htmlActueel.classList.remove('c-hidden')
    showCharts()
  }
}


const showCharts = function () {
  console.log("chart will be shown")
  co2Chart = new ApexCharts(document.querySelector(".js-co2-chart"), CO2ChartOptions);
  co2Chart.render();
  tempChart = new ApexCharts(document.querySelector('.js-temperature-chart'), tempChartOptions)
  tempChart.render();
  humidityChart = new ApexCharts(document.querySelector('.js-humidity-chart'), humidityChartOptions)
  humidityChart.render();
  pressureChart = new ApexCharts(document.querySelector('.js-pressure-chart'), PressureChartOptions)
  pressureChart.render()
  listenToSocketCharts();
}


// #endregion

// #region ***  Callback-No Visualisation - callback___  ***********
// #endregion

// #region ***  Data Access - get___                     ***********
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
  socketio.on("B2F_CO2", function (data) {
    console.log("New co2 reading")
    co2Chart.updateSeries([
      valueToPercentCO2(data['CO2'])
    ])
  })
  socketio.on('B2F_PM', function (data) {
    console.log(data)
  })
}

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
      showPage(type)
    })
  }
}

// #endregion
const SetReload = function () {
  document.location.reload(true);
}
// #region ***  Init / DOMContentLoaded                  ***********
const init = function () {
  console.log("Timeout")
  // setTimeout(SetReload, 30000)
  if (document.querySelector('.js-testData')) {
    console.log('test pagina');
    hmtlPM = document.querySelector('.js-fijn-stof');
    htmlOnBoot = document.querySelector('.js-on-boot');
    listenToSocket();
  } else if (document.querySelector('.Homepagina')) {
    console.log("Homepage")
    htmlActueel = document.querySelector('.js-actueel')
    listenToBtnSidebar()
  }
};

document.addEventListener('DOMContentLoaded', init);
// #endregion
