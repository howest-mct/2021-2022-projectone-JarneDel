const labels = {
  co2: [
    {
      min: 0,
      max: 900,
      val: 'Good!',
      color: '#74c953',
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
      color: '#ee3e54',
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
      color: '#00fdff',
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
      value: 'To High!',
      color: '#ee3e54',
    },
    {
      max: 70,
      min: 60,
      value: 'Bit high',
      color: '#f27931',
    },
    {
      max: 60,
      min: 30,
      value: 'Healthy',
      color: '#74c953',
    },
    {
      max: 30,
      min: 25,
      value: 'Bit low',
      color: 'f27931',
    },
    {
      max: 25,
      min: 0,
      value: 'To low!',
      color: '#ee3e54',
    },
  ],
  pressure: [
    {
      min: 1022.689,
      max: 1060,
      value: 'High Pressure',
    },
    {
      min: 1009.144,
      max: 1022.689,
      value: 'Normal',
    },
    {
      max: 1009.144,
      min: 940,
      val: 'Low pressure',
    },
  ],
};
