import React from 'react';
import Chart from 'react-apexcharts';

const ChartView = ({ historyData, setView }) => {

  const topTen = historyData.slice(0, 10);

  if (!historyData || historyData.length === 0) {
    return <p>No data available.</p>; 
  }

  // Series data for the chart (visit counts)
  const series = topTen.map(item => item.visitCount);

  // Labels for the chart (domains)
  const labels = topTen.map(item => item.domain);

  // Chart options
  var options = {
    series: [44, 55, 41, 17, 15],
    chart: {
    type: 'donut',
  },
  labels: labels,
  stroke: {
    width: 0
  },
  legend: {
    position: 'right', 
    horizontalAlign: 'right', 
    offsetY: 0,
    height: 230,
    labels: {
      colors: 'rgb(255, 255, 255)', 
      useSeriesColors: false
    },
    markers: {
      width: 12,
      height: 12
    }
  },
  responsive: [{
    breakpoint: 480,
    options: {
      chart: {
        width: 200
      },
      legend: {
        position: 'bottom'
      }
    }
  }]
  };
  
  return (
    <div className="chart-container">
      <h1>Top 10 Websites</h1>
      <Chart options={options} series={series} type="donut" width="380" />
      <button onClick={() => setView("home")}>Back to Home</button>
    </div>
  );
};

export default ChartView;
