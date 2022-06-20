let OnlyOneListener = true;
let onlyOneListenerHistoriek = true;
let OnlyOneListenersettings = true;
let co2Chart,
  tempChart,
  humidityChart,
  pressureChart,
  PMchart,
  PMNopChart,
  fanChart,
  iaqchart,
  areaCO2,
  areaTemp,
  areaHum,
  areaPressure,
  areaPM,
  areaPmNop;


let timeout = null
let selectedRange, activeGraph;
let RPI = false;
let selectedPage = 'actueel';
let lastPageArray = [];



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
  htmlHistoriekIaq,
  htmlHistoriekPM,
  htmlHistoriekPmNop,
  htmlLoading,
  htmlDropDownHistoriekMobile,
  htmlReloadPage,
  htmlChartType,
  htmlRefeshGraph,
  htmlIndicatieAll,
  htmlbackbtns;
// #endregion

// #region formatters

const valueToPercentCO2 = function (value) {
  return (value * 100) / 2000;
};
const valueToPercentTemp = function (value) {
  return (value * 100) / 45;
};
const valueToPercentHum = function (value) {
  return (value * 100) / 100;
};
const valueToPercentPressure = function (value) {
  return ((value - 940) * 100) / (1060 - 940);
};
const valueToPercentIaq = function (value) {
  return 100 - value / 3;
};

const valueToPercentFan = function (val) {
  return val / 5600 * 100
}
// #endregion

// # region chartoptions
const CO2ChartOptions = {
  chart: {
    height: 280,
    type: 'radialBar',
  },

  series: [0],
  colors: ['#2699FB'],
  plotOptions: {
    radialBar: {
      startAngle: -135,
      endAngle: 135,
      hollow: {
        margin: 15,
        size: '65%',
      },
      track: {
        background: '#BCE0FD',
        startAngle: -135,
        endAngle: 135,
        // strokeWidth: '75%',
      },
      dataLabels: {
        name: {
          show: true,
          fontSize: '20px',
          fontWeight: 400,
          fontFamily: 'proxima-nova',
          color: '#7F7F7F',
          offsetY: 20,
        },
        value: {
          formatter: (val) => ((val * 2000) / 100).toFixed(0),
          fontSize: '40px',
          fontWeight: 700,
          fontFamily: 'proxima-nova',
          color: '#7F7F7F',
          show: true,
          offsetY: -20,
        },
      },
    },
  },
  responsive: [
    {
      breakpoint: 900,
      options: {
        chart: { height: '200px' },
        plotOptions: {
          radialBar: {
            dataLabels: {
              name: { fontSize: '14px' },
              value: { fontSize: '30px' },
            },
          },
        },
      },
    },
  ],
  fill: {
    type: 'solid',
    // gradient: {
    //   shade: "dark",
    //   type: "horizontal",
    //   // gradientToColors: ["#87D4F9"],
    //   stops: [0, 100]
    // }
  },
  stroke: {
    lineCap: 'round',
  },
  labels: [' '],
};

let tempChartOptions = {
  chart: {
    height: 280,
    type: 'radialBar',
  },
  series: [0],
  colors: ['#2699FB'],
  plotOptions: {
    radialBar: {
      startAngle: -135,
      endAngle: 135,
      hollow: {
        margin: 15,
        size: '65%',
      },
      track: {
        background: '#BCE0FD',
        startAngle: -135,
        endAngle: 135,
        // strokeWidth: '75%',
      },
      dataLabels: {
        name: {
          show: true,
          fontSize: '20px',
          fontWeight: 400,
          fontFamily: 'proxima-nova',
          offsetY: 20,
          color: '#7F7F7F',
        },
        value: {
          formatter: (val) => ((val * 45) / 100).toFixed(0),
          fontSize: '40px',
          fontWeight: 700,
          fontFamily: 'proxima-nova',
          show: true,
          offsetY: -20,
          color: '#7F7F7F',
        },
      },
    },
  },
  fill: {
    type: 'solid',
    // gradient: {
    //   shade: "dark",
    //   type: "horizontal",
    //   // gradientToColors: ["#87D4F9"],
    //   stops: [0, 100]
    // }
  },
  stroke: {
    lineCap: 'round',
  },
  labels: [' '],
  responsive: [
    {
      breakpoint: 900,
      options: {
        chart: { height: '200px' },
        plotOptions: {
          radialBar: {
            dataLabels: {
              name: { fontSize: '14px' },
              value: { fontSize: '30px' },
            },
          },
        },
      },
    },
  ],
};

let humidityChartOptions = {
  chart: {
    height: 280,
    type: 'radialBar',
  },
  series: [0],
  colors: ['#2699FB'],
  plotOptions: {
    radialBar: {
      startAngle: -135,
      endAngle: 135,
      hollow: {
        margin: 15,
        size: '65%',
      },
      track: {
        background: '#BCE0FD',
        startAngle: -135,
        endAngle: 135,
        // strokeWidth: '75%',
      },
      dataLabels: {
        name: {
          show: true,
          fontSize: '20px',
          fontWeight: 400,
          fontFamily: 'proxima-nova',
          color: '#7F7F7F',
          offsetY: 20,
        },
        value: {
          formatter: (val) => (val).toFixed(0) + '%',
          fontSize: '40px',
          fontWeight: 700,
          fontFamily: 'proxima-nova',
          color: '#7F7F7F',
          show: true,
          offsetY: -20,
        },
      },
    },
  },
  fill: {
    type: 'solid',
    // gradient: {
    //   shade: "dark",
    //   type: "horizontal",
    //   // gradientToColors: ["#87D4F9"],
    //   stops: [0, 100]
    // }
  },
  stroke: {
    lineCap: 'round',
  },
  labels: ['...'],
  responsive: [
    {
      breakpoint: 900,
      options: {
        chart: { height: '200px' },
        plotOptions: {
          radialBar: {
            dataLabels: {
              name: { fontSize: '14px' },
              value: { fontSize: '30px' },
            },
          },
        },
      },
    },
  ],
};
let PressureChartOptions = {
  chart: {
    height: 280,
    type: 'radialBar',
  },
  series: [0],
  colors: ['#2699FB'],
  plotOptions: {
    radialBar: {
      startAngle: -135,
      endAngle: 135,
      hollow: {
        margin: 15,
        size: '65%',
      },
      track: {
        background: '#BCE0FD',
        startAngle: -135,
        endAngle: 135,
        // strokeWidth: '75%',
      },
      dataLabels: {
        name: {
          show: true,
          fontSize: '20px',
          fontWeight: 400,
          fontFamily: 'proxima-nova',
          color: '#7F7F7F',
          offsetY: 20,
        },
        value: {
          formatter: (val) => ((val * (1060 - 940)) / 100 + 940).toFixed(0),
          fontSize: '40px',
          fontWeight: 700,
          fontFamily: 'proxima-nova',
          color: '#7F7F7F',
          show: true,
          offsetY: -20,
        },
      },
    },
  },
  fill: {
    type: 'solid',
  },
  stroke: {
    lineCap: 'round',
  },
  labels: ['...'],
  responsive: [
    {
      breakpoint: 900,
      options: {
        chart: { height: '200px' },
        plotOptions: {
          radialBar: {
            dataLabels: {
              name: { fontSize: '14px' },
              value: { fontSize: '30px' },
            },
          },
        },
      },
    },
  ],
};

let iaqChartOptions = {
  chart: {
    height: 280,
    type: 'radialBar',

  },
  series: [0],
  colors: ['#2699FB'],
  plotOptions: {
    radialBar: {
      startAngle: -135,
      endAngle: 135,
      hollow: {
        margin: 15,
        size: '65%',
      },
      track: {
        background: '#BCE0FD',
        startAngle: -135,
        endAngle: 135,
        // strokeWidth: '75%',
      },
      dataLabels: {
        name: {
          show: true,
          fontSize: '20px',
          fontWeight: 400,
          fontFamily: 'proxima-nova',
          offsetY: 20,
          color: '#7F7F7F',
        },
        value: {
          formatter: (val) => (val).toFixed(0) + "%",
          fontSize: '40px',
          fontWeight: 700,
          fontFamily: 'proxima-nova',
          show: true,
          offsetY: -20,
          color: '#7F7F7F',
        },
      },
    },
  },
  fill: {
    type: 'solid',
    // gradient: {
    //   shade: "dark",
    //   type: "horizontal",
    //   // gradientToColors: ["#87D4F9"],
    //   stops: [0, 100]
    // }
  },
  stroke: {
    lineCap: 'round',
  },
  labels: ['...'],
  responsive: [
    {
      breakpoint: 900,
      options: {
        chart: { height: '200px' },
        plotOptions: {
          radialBar: {
            dataLabels: {
              name: { fontSize: '14px' },
              value: { fontSize: '30px' },
            },
          },
        },
      },
    },
  ],
};

let PMChartOptions = {
  chart: {
    type: 'bar',
    toolbar: {
      show: false,
    },
  },
  plotOptions: {
    bar: {
      horizontal: false,
    },
  },
  series: [
    {
      data: [
        {
          x: 'PM1',
          y: 0,
        },
        {
          x: 'PM2.5',
          y: 0,
        },
        {
          x: 'PM10',
          y: 0,
        },
      ],
    },
  ],
  responsive: [
    {
      breakpoint: 900,
      options: {
        chart: { width: '100%', height: '100%' },
      },
    },
  ],
};

let PMNopChartOptions = {
  chart: {
    height: 280,
    width: 700,
    type: 'bar',
    fontFamily: 'proxima-nova, Helvetica',
    toolbar: {
      show: false,
    },
  },
  plotOptions: {
    bar: {
      horizontal: false,
    },
  },
  // dataLabels: {
  //   style: {
  //     fontSize: '20px'
  //   }
  // },
  series: [
    {
      data: [
        {
          x: 'NOP 0.3 um',
          y: 0,
        },
        {
          x: 'NOP 0.5 um',
          y: 0,
        },
        {
          x: 'NOP 1 um',
          y: 0,
        },
        {
          x: 'NOP 2.5 um',
          y: 0,
        },
        {
          x: 'NOP 5 um',
          y: 0,
        },
        {
          x: 'NOP 10 um',
          y: 0,
        },
      ],
    },
  ],
  // xaxis: {
  //   title: {
  //     show: true,
  //     text: 'Particle size [µm]'
  //   },
  // },
  responsive: [
    {
      breakpoint: 900,
      options: {
        chart: { width: '370px', height: '144px' },
        plotOptions: { bar: { horizontal: true } },
        dataLabels: {
          style: {
            fontSize: '9px',
            fontWeight: 400
          }
        },
        // xaxis: {
        //   title: {
        //     show: false,
        //     text: ''
        //   }
        // },
        // yaxis: {
        //   title: {
        //     text: 'Particle size [µm]'
        //   },
        // },
      },
    },
  ],
};


const fanOptions = {
  chart: {
    height: 280,
    type: 'radialBar',
    fontFamily: 'proxima-nova, Helvetica',
    events: {
      click: function (event, chartContext, config) {

      }
    }
  },
  series: [0],
  colors: ['#2699FB'],
  plotOptions: {
    radialBar: {
      startAngle: -135,
      endAngle: 135,
      hollow: {
        margin: 15,
        size: '65%',
      },
      track: {
        background: '#BCE0FD',
        startAngle: -135,
        endAngle: 135,
        // strokeWidth: '75%',
      },
      dataLabels: {
        name: {
          show: true,
          fontSize: '20px',
          fontWeight: 400,
          fontFamily: 'proxima-nova',
          color: '#7F7F7F',
          offsetY: 20,
        },
        value: {
          formatter: (val) => (val * 5600 / 100).toFixed(0),
          fontSize: '40px',
          fontWeight: 700,
          fontFamily: 'proxima-nova',
          color: '#7F7F7F',
          show: true,
          offsetY: -20,
        },
      },
    },
  },
  fill: {
    type: 'solid',
  },
  stroke: {
    lineCap: 'round',
  },
  labels: ['RPM'],
  responsive: [
    {
      breakpoint: 900,
      options: {
        chart: { height: '200px' },
        plotOptions: {
          radialBar: {
            dataLabels: {
              name: { fontSize: '14px' },
              value: { fontSize: '30px' },
            },
          },
        },
      },
    },
  ],
}

const HistoriekOptions = {
  chart: {
    height: 360,
    type: 'area',
    fontFamily: 'proxima-nova, Helvetica',
  },
  dataLabels: {
    enabled: false,
  },
  series: [
    {
      data: [
        {
          x: new Date('2018-02-12').getTime(),
          y: 76,
        },
        {
          x: new Date('2018-02-13').getTime(),
          y: 78,
        },
      ],
    },
  ],
  colors: ['#2699FB'],
  stroke: {
    curve: 'smooth',
  },
  xaxis: {
    type: 'datetime',
  },
  responsive: [
    {
      breakpoint: 700,
      options: {
        chart: { height: '192px' },
      },
    },
  ],
};

let HistoriekOptionsLineChart = {
  chart: {
    height: 360,
    type: 'line',
    fontFamily: 'proxima-nova, Helvetica',
  },
  dataLabels: {
    enabled: false,
  },
  series: [
    {
      data: [
        {
          x: new Date('2018-02-12').getTime(),
          y: 76,
        },
        {
          x: new Date('2018-02-13').getTime(),
          y: 78,
        },
      ],
    },
  ],
  colors: ['#2699FB'],
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  xaxis: {
    type: 'datetime',
  },
  yaxis: {
    labels: {
      formatter(value) {
        return value.toFixed(0);
      },
    },
  },
  responsive: [
    {
      breakpoint: 700,
      options: {
        chart: { height: '192px' },
      },
    },
  ],
};
// #endregion

//# region labels
const colors = {
  lightGreen: '#70bf40',
  green: '#0F9942',
  yellow: '#f5d328',
  orange: '#df6a10',
  red: '#db1a32',
  darkRed: '#99004C',
  brown: '#663300',
};

const labels = {
  co2: [
    {
      min: 0,
      max: 900,
      val: 'Good',
      color: colors.green,
    },
    {
      min: 900,
      max: 1500,
      val: 'Ventilate',
      color: colors.orange,
    },
    {
      min: 1500,
      max: 5000,
      val: 'Very bad',
      color: colors.red,
    },
  ],
  temperature: [
    {
      min: -10,
      max: 14,
      val: 'Cold 🥶',
      color: '#0432ff',
    },
    {
      min: 14,
      max: 17,
      val: 'Chilly',
      color: '#50a7f9',
    },
    {
      min: 17,
      max: 20,
      val: 'Cool',
      color: '#009193',
    },
    {
      min: 20,
      max: 22,
      val: 'Ideal',
      color: '#2699FB',
    },
    {
      min: 22,
      max: 24,
      val: 'Bit warm',
      color: '#70bf40',
    },
    {
      min: 24,
      max: 28,
      val: 'Warm',
      color: '#f5d328',
    },
    {
      min: 28,
      max: 32,
      val: 'Very Warm',
      color: '#df6a10',
    },
    {
      min: 32,
      max: 100,
      val: 'Hot 🔥',
      color: '#d92808',
    },
  ],
  humidity: [
    {
      max: 100,
      min: 70,
      val: 'Too high!',
      color: colors.red,
    },

    {
      max: 70,
      min: 60,
      val: 'Bit high',
      color: colors.orange, //#f27931
    },
    {
      max: 60,
      min: 30,
      val: 'Healthy',
      color: colors.green,
    },
    {
      max: 30,
      min: 25,
      val: 'Bit low',
      color: colors.orange, //#f27931
    },
    {
      max: 25,
      min: 0,
      val: 'Too low!',
      color: colors.red,
    },
  ],
  pressure: [
    {
      min: 1022.689,
      max: 1060,
      val: 'High pressure',
      color: '#2699FB',
    },
    {
      min: 1009.144,
      max: 1022.689,
      val: 'Normal',
      color: '#2699FB',
    },
    {
      max: 1009.144,
      min: 940,
      val: 'Low pressure',
      color: '#2699FB',
    },
  ],
  iaq: [
    {
      min: 0,
      max: 50,
      val: 'Excellent',
      color: colors.lightGreen,
    },
    {
      min: 50,
      max: 100,
      val: 'Good',
      color: colors.green,
    },
    {
      min: 100,
      max: 150,
      val: 'Lightly polluted',
      color: colors.yellow,
    },
    {
      min: 150,
      max: 200,
      val: 'Moderatly polluted',
      color: colors.orange,
    },
    {
      min: 200,
      max: 250,
      val: 'Heavily polluted',
      color: colors.red,
    },
    {
      min: 250,
      max: 350,
      val: 'Severely polluted',
      color: colors.darkRed,
    },
    {
      min: 350,
      max: 1000,
      val: 'Extremely polluted',
      colors: colors.brown,
    },
  ],
};

//#endregion

//# region variables
let newData = {
  co2: new Date(),
  temp: new Date(),
  hum: new Date(),
  pressure: new Date(),
  iaq: new Date(),
  pm: new Date(),
  pmNop: new Date(),
};

let loaded_historiek = {
  mobile: {
    DAY: false,
    WEEK: false,
    YTD: false,
  },
  co2: false,
  temperature: false,
  humidity: false,
  pressure: false,
  iaq: false,
  pm: false,
  pmnop: false,
};

let firstTime = {
  co2: true,
  temperature: true,
  pressure: true,
  humidity: true,
  iaq: true,
  pm: true,
  pmNop: true,
};

let namesPmnop = ['300nm', '500nm', '1μm', '2.5μm', '5μm', '10μm'];

let historiekChart = {};

const chartTitles = {
  co2: 'Co2 concentration [ppm]',
  temperature: 'temperature [°C]',
  humidity: 'Relative humidity [%]',
  pressure: 'pressure [Pa]',
  iaq: 'IAQ',
};

const pageTitles = {
  co2: 'CO2 [ppm]',
  temperature: 'Temperature [°C]',
  humidity: 'humidity [%]',
  pressure: 'Pressure [Pa]',
  iaq: 'Indoor Air Quality',
  pm: 'Particulate Matter [µg/m³]',
  pmnop: 'Number of particles / 100ml',
};

//#endregion

//#region queryselectors
const loadQuerySelectors = function () {
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
  htmlHistoriekTemp = document.querySelector('.js-historiek-temperature');
  htmlHistoriekHum = document.querySelector('.js-historiek-humidity');
  htmlHistoriekPressure = document.querySelector('.js-historiek-pressure');
  htmlHistoriekIaq = document.querySelector('.js-historiek-iaq');
  htmlHistoriekPM = document.querySelector('.js-historiek-pm');
  htmlHistoriekPmNop = document.querySelector('.js-historiek-pmnop');
  htmlLoading = document.querySelector('.js-loading');
  // htmlReloadPage = document.querySelector('.js-reload-page');
  htmlChartType = document.querySelector('.js-chart-type');
  htmlRefeshGraph = document.querySelector('.js-refesh-chart');
  htmlIndicatieAll = document.querySelectorAll('.js-indicatie');
  htmlbackbtns = document.querySelectorAll('.js-back-btn')
};

//# endregion
