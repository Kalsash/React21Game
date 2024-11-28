import React from 'react';
import { Pie, Line } from 'react-chartjs-2';
import { getChartDataLine, getChartDataPie } from './chartData';

const ChartContainer = ({ resultsCount, bankHistory }) => {
  const chartDataPie = getChartDataPie(resultsCount);
  const chartDataLine = getChartDataLine(bankHistory);

  return (
    <div className="container2">
      <div className="chart-section" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <div style={{ width: '300px', height: '300px' }}>
          <h2>Деньги</h2>
          <Line data={chartDataLine} options={{ maintainAspectRatio: false, responsive: true }} />
        </div>
        <div style={{ width: '300px', height: '500px', marginLeft: "140px" }}>
          <h2>История партий</h2>
          <Pie data={chartDataPie} options={{ maintainAspectRatio: false, responsive: true }} />
        </div>
      </div>
    </div>
  );
};

export default ChartContainer;