import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import fs from 'fs';
import dayjs from 'dayjs';

const width = 800;
const height = 400;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

/**
 * Bar chart: total of numeric column grouped by a string/date column
 */
export async function generateBarChart(data, groupBy, valueCol, output = './output/bar_chart.png') {
  const grouped = {};

  data.forEach(row => {
    const group = row[groupBy] ?? 'unknown';
    grouped[group] = (grouped[group] || 0) + (Number(row[valueCol]) || 0);
  });

  const labels = Object.keys(grouped);
  const values = Object.values(grouped);

  const config = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: `Total ${valueCol} by ${groupBy}`,
        data: values,
        backgroundColor: 'steelblue'
      }]
    }
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(config);
  fs.writeFileSync(output, buffer);
  console.log(`📊 Bar chart saved to ${output}`);
}


export async function generateLineChart(data, dateCol, valueCol, output = './output/line_chart.png') {
  const grouped = {};

  data.forEach(row => {
    const rawDate = row[dateCol];
    const date = dayjs(rawDate).format('YYYY-MM-DD');
    grouped[date] = (grouped[date] || 0) + (Number(row[valueCol]) || 0);
  });

  const timeline = Object.keys(grouped).sort();
  const totals = timeline.map(date => grouped[date]);

  const config = {
    type: 'line',
    data: {
      labels: timeline,
      datasets: [{
        label: `${valueCol} over ${dateCol}`,
        data: totals,
        borderColor: 'crimson',
        fill: false
      }]
    }
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(config);
  fs.writeFileSync(output, buffer);
  console.log(`📈 Line chart saved to ${output}`);
}