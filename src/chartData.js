export const getChartDataPie = (resultsCount) => ({
  labels: ['Победы', 'Поражения', 'Ничьи'],
  datasets: [
    {
      label: 'Количество игр',
      data: [resultsCount.wins, resultsCount.losses, resultsCount.ties],
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 206, 86, 0.6)',
      ],
      borderWidth: 1,
    },
  ],
});

export const getChartDataLine = (bankHistory) => ({
  labels: bankHistory.map((_, index) => `Партию ${index + 1}`),
  datasets: [
    {
      label: 'Деньги',
      data: bankHistory,
      fill: false,
      borderColor: 'rgba(75, 192, 192, 1)',
      tension: 0.1,
    },
  ],
});