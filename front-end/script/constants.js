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
  s;
};
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
          formatter: (val) => ((val * 45) / 100).toFixed(1),
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
          formatter: (val) => ((val * 100) / 100).toFixed(2),
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
          formatter: (val) => ((val * (1060 - 940)) / 100 + 940).toFixed(1),
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

let VOCChartOptions = {
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
          formatter: (val) => val.toFixed(0),
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
// let PMChartOptions = {
//   chart: {
//     height: 280,
//     type: 'radialBar',
//   },
//   series: [8, 11, 12],
//   plotOptions: {
//     radialBar: {
//       startAngle: -135,
//       endAngle: 135,
//       track: {
//         background: '#BCE0FD',
//         startAngle: -135,
//         endAngle: 135,
//         // strokeWidth: '75%',
//       },
//       dataLabels: {
//         total: {
//           show: false,
//           label: 'IAQ',
//         },
//       },
//     },
//   },
//   labels: ['PM1', 'PM2.5', 'PM10'],
//   stroke: {
//     lineCap: 'round',
//   },
// };

// let PMNopChartOptions = {
//   chart: {
//     height: 280,
//     type: 'radialBar',
//   },
//   series: [8, 11, 12, 77, 4, 0],
//   plotOptions: {
//     radialBar: {
//       startAngle: -135,
//       endAngle: 135,
//       track: {
//         background: '#BCE0FD',
//         startAngle: -135,
//         endAngle: 135,
//         // strokeWidth: '75%',
//       },
//       dataLabels: {
//         total: {
//           show: false,
//           label: 'IAQ',
//         },
//       },
//     },
//   },
//   labels: [
//     'NOP 0.3 um',
//     'NOP 0.5 um',
//     'NOP 1 um',
//     'NOP 2.5um',
//     'NOP 5 um',
//     'NOP 10 um',
//   ],
//   stroke: {
//     lineCap: 'round',
//   },
// };

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
  responsive: [
    {
      breakpoint: 900,
      options: {
        chart: { width: '370px', height: '144px' },
        plotOptions: { bar: { horizontal: true } },
      },
    },
  ],
};

const labels = {
  co2: [
    {
      min: 0,
      max: 900,
      val: 'Good!',
      color: '#0F9942',
    },
    {
      min: 900,
      max: 1500,
      val: 'ventilate!',
      color: '#f27931',
    },
    {
      min: 1500,
      max: 5000,
      val: 'Very bad!',
      color: '#db1a32',
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
      val: 'chilly',
      color: '#50a7f9',
    },
    {
      min: 17,
      max: 20,
      val: 'cool',
      color: '#009193',
    },
    {
      min: 20,
      max: 22,
      val: 'ideal',
      color: '#2699FB',
    },
    {
      min: 22,
      max: 24,
      val: 'Tepid',
      color: '#70bf40',
    },
    {
      min: 24,
      max: 28,
      val: 'warm',
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
      val: 'Too High!',
      color: '#E31E36',
    },

    {
      max: 70,
      min: 60,
      val: 'Bit high',
      color: '#ED7730', //#f27931
    },
    {
      max: 60,
      min: 30,
      val: 'Healthy',
      color: '#0F9942',
    },
    {
      max: 30,
      min: 25,
      val: 'Bit low',
      color: '#ED7730', //#f27931
    },
    {
      max: 25,
      min: 0,
      val: 'Too low!',
      color: '#E31E36',
    },
  ],
  pressure: [
    {
      min: 1022.689,
      max: 1060,
      val: 'High Pressure',
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
};
const HistoriekOptions = {
  chart: {
    height: 360,
    type: 'area',
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

let newData = {
  co2: new Date(),
  temp: new Date(),
  hum: new Date(),
  pressure: new Date(),
  voc: new Date(),
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
  voc: false,
  pm: false,
  pmnop: false,
};

let firstTime = {
  co2: true,
  temp: true,
  pressure: true,
  humidity: true,
  pm: true,
  pmNop: true,
};

let namesPmnop = ['300nm', '500nm', '1μm', '2.5μm', '5μm', '10μm'];
