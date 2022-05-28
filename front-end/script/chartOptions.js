const valueToPercentCO2 = function (value) {
    return Math.round((value * 100) / 5000, 2)
}
const valueToPercentTemp = function (value) {
    return Math.round((value * 100) / 45, 2)
}
const valueToPercentHum = function (value) {
    return Math.round((value * 100) / 100, 2)
}
const valueToPercentPressure = function (value) {
    return Math.round(((value - 940) * 100) / (1060 - 940), 2);
}
let CO2ChartOptions = {
    chart: {
        height: 280,
        type: "radialBar",
    },
    series: [valueToPercentCO2(2500)],
    colors: ["#2699FB"],
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
                    fontSize: "20px",
                    fontWeight: 400,
                    fontFamily: "proxima-nova",
                    offsetY: 20,
                },
                value: {
                    formatter: (val) => (val * 5000) / 100,
                    fontSize: "40px",
                    fontWeight: 700,
                    fontFamily: "proxima-nova",
                    show: true,
                    offsetY: -20,
                }
            }
        }
    },
    fill: {
        type: "solid",
        // gradient: {
        //   shade: "dark",
        //   type: "horizontal",
        //   // gradientToColors: ["#87D4F9"],
        //   stops: [0, 100]
        // }
    },
    stroke: {
        lineCap: "round"
    },
    labels: ["Zwaar vervuild"]
};

let tempChartOptions = {
    chart: {
        height: 280,
        type: "radialBar",
    },
    series: [valueToPercentTemp(23)],
    colors: ["#2699FB"],
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
                    fontSize: "20px",
                    fontWeight: 400,
                    fontFamily: "proxima-nova",
                    offsetY: 20,
                },
                value: {
                    formatter: (val) => (val * 45) / 100,
                    fontSize: "40px",
                    fontWeight: 700,
                    fontFamily: "proxima-nova",
                    show: true,
                    offsetY: -20,
                }
            }
        }
    },
    fill: {
        type: "solid",
        // gradient: {
        //   shade: "dark",
        //   type: "horizontal",
        //   // gradientToColors: ["#87D4F9"],
        //   stops: [0, 100]
        // }
    },
    stroke: {
        lineCap: "round"
    },
    labels: ["Aangenaaam"]
};

let humidityChartOptions = {
    chart: {
        height: 280,
        type: "radialBar",
    },
    series: [valueToPercentHum(50)],
    colors: ["#2699FB"],
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
                    fontSize: "20px",
                    fontWeight: 400,
                    fontFamily: "proxima-nova",
                    offsetY: 20,
                },
                value: {
                    formatter: (val) => (val * 100) / 100,
                    fontSize: "40px",
                    fontWeight: 700,
                    fontFamily: "proxima-nova",
                    show: true,
                    offsetY: -20,
                }
            }
        }
    },
    fill: {
        type: "solid",
        // gradient: {
        //   shade: "dark",
        //   type: "horizontal",
        //   // gradientToColors: ["#87D4F9"],
        //   stops: [0, 100]
        // }
    },
    stroke: {
        lineCap: "round"
    },
    labels: ["Normaal"]
};
let PressureChartOptions = {
    chart: {
        height: 280,
        type: "radialBar",
    },
    series: [valueToPercentPressure(1023)],
    colors: ["#2699FB"],
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
                    fontSize: "20px",
                    fontWeight: 400,
                    fontFamily: "proxima-nova",
                    offsetY: 20,
                },
                value: {
                    formatter: (val) => (val * (1060 - 940)) / 100 + 940,
                    fontSize: "40px",
                    fontWeight: 700,
                    fontFamily: "proxima-nova",
                    show: true,
                    offsetY: -20,
                }
            }
        }
    },
    fill: {
        type: "solid",
        // gradient: {
        //   shade: "dark",
        //   type: "horizontal",
        //   // gradientToColors: ["#87D4F9"],
        //   stops: [0, 100]
        // }
    },
    stroke: {
        lineCap: "round"
    },
    labels: ["Hoge druk"]
};
