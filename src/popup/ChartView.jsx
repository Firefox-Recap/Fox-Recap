import React from 'react';
import { Doughnut } from 'react-chartjs-2';

const ChartView = ({ historyData, setView }) => {
  console.log("Chart data:", historyData);
  // const topTen = historyData.slice(0, 10);
  // const doughnutData = {
  //   labels: topTen.map((item) => item.domain),
  //   datasets: [
  //     {
  //       label: "Visit Count",
  //       data: topTen.map((item) => item.visitCount),
  //       backgroundColor: [
  //         "#FF6384",
  //         "#36A2EB",
  //         "#FFCE56",
  //         "#4BC0C0",
  //         "#9966FF",
  //         "#FF9F40",
  //         "#FFCD56",
  //         "#4BC0C0",
  //         "#36A2EB",
  //         "#FF6384",
  //       ],
  //       hoverBackgroundColor: [
  //         "#FF6384",
  //         "#36A2EB",
  //         "#FFCE56",
  //         "#4BC0C0",
  //         "#9966FF",
  //         "#FF9F40",
  //         "#FFCD56",
  //         "#4BC0C0",
  //         "#36A2EB",
  //         "#FF6384",
  //       ],
  //     },
  //   ],
  // };

  // const options = {
  //   plugins: {
  //     legend: {
  //       position: "top",
  //       labels: {
  //         color: "white",
  //         font: {
  //           size: 14,
  //         },
  //       },
  //     },
  //   },
  //   responsive: true,
  //   maintainAspectRatio: false,
  // };

  return (
    <div className="chart-container">
      {/* <h2>Top 10 Websites Chart</h2>
      <Doughnut data={doughnutData} options={options} />
      <button onClick={() => setView("home")}>Back to Home</button> */}
      <h1>CHART VIEW</h1>
    </div>
  );
};

export default ChartView;
