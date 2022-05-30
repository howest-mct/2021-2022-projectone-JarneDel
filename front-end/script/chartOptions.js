const valueToPercentCO2 = function (value) {
  return Math.round((value * 100) / 5000, 4);
};
const valueToPercentTemp = function (value) {
  return Math.round((value * 100) / 45, 4);
};
const valueToPercentHum = function (value) {
  return Math.round((value * 100) / 100, 4);
};
const valueToPercentPressure = function (value) {
  return Math.round(((value - 940) * 100) / (1060 - 940), 4);
};
let CO2ChartOptions = {
  chart: {
    height: 280,
    type: 'radialBar',
  },
  series: [valueToPercentCO2(2500)],
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
        },
        value: {
          formatter: (val) => (val * 5000) / 100,
          fontSize: '40px',
          fontWeight: 700,
          fontFamily: 'proxima-nova',
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
  labels: ['Zwaar vervuild'],
};

let tempChartOptions = {
  chart: {
    height: 280,
    type: 'radialBar',
  },
  series: [valueToPercentTemp(23)],
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
        },
        value: {
          formatter: (val) => (val * 45) / 100,
          fontSize: '40px',
          fontWeight: 700,
          fontFamily: 'proxima-nova',
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
  labels: ['Aangenaaam'],
};

let humidityChartOptions = {
  chart: {
    height: 280,
    type: 'radialBar',
  },
  series: [valueToPercentHum(50)],
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
        },
        value: {
          formatter: (val) => (val * 100) / 100,
          fontSize: '40px',
          fontWeight: 700,
          fontFamily: 'proxima-nova',
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
  labels: ['Normaal'],
};
let PressureChartOptions = {
  chart: {
    height: 280,
    type: 'radialBar',
  },
  series: [valueToPercentPressure(1023)],
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
        },
        value: {
          formatter: (val) => (val * (1060 - 940)) / 100 + 940,
          fontSize: '40px',
          fontWeight: 700,
          fontFamily: 'proxima-nova',
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
  labels: ['Hoge druk'],
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
          y: 10,
        },
        {
          x: 'PM2.5',
          y: 18,
        },
        {
          x: 'PM10',
          y: 13,
        },
      ],
    },
  ],
};

let PMNopChartOptions = {
  chart: {
    height: 280,
    width: 700,
    type: 'bar',
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
          y: 10,
        },
        {
          x: 'NOP 0.5 um',
          y: 18,
        },
        {
          x: 'NOP 1 um',
          y: 13,
        },
        {
          x: 'NOP 2.5 um',
          y: 10,
        },
        {
          x: 'NOP 5 um',
          y: 18,
        },
        {
          x: 'NOP 10 um',
          y: 13,
        },
      ],
    },
  ],
};
