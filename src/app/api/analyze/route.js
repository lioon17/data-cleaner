// src/app/api/analyze/route.js

function generateSummaryStats(data, field) {
  const values = data.map(row => parseFloat(row[field])).filter(val => !isNaN(val));
  if (values.length === 0) return {};

  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(values.length / 2)];

  return {
    count: values.length,
    sum,
    mean: parseFloat(mean.toFixed(2)),
    median,
  };
}

function generateChartData(data, field, chartType) {
  const grouped = {};

  data.forEach(row => {
    const key = chartType === "line" ? row.date || row.joined || row.createdAt : row[field];
    if (!key) return;

    if (!grouped[key]) grouped[key] = 0;
    grouped[key] += 1;
  });

  const chartData = Object.entries(grouped).map(([label, value]) => ({
    label,
    value,
  }));

  return chartData;
}

function generateInsights(stats) {
  if (!stats || typeof stats.mean !== "number") return ["No numerical insights available."];

  const insights = [];

  if (stats.mean > 1000) insights.push("High average value detected.");
  if (stats.count > 100) insights.push("Large dataset processed.");
  if (stats.median < stats.mean) insights.push("Data is right-skewed.");

  return insights;
}

function simulateAnalysis(data, field, chartType) {
  const summary = generateSummaryStats(data, field);
  const chartData = generateChartData(data, field, chartType);
  const insights = generateInsights(summary);

  return {
    summary, // instead of 'stats'
    chartData,
    field,
    chartType,
    insights,
  };
}


export async function POST(req) {
  try {
    const { cleanedData, field, chartType } = await req.json();
    if (!cleanedData || !field || !chartType) {
      return new Response(JSON.stringify({ error: "Missing input." }), { status: 400 });
    }

    const results = simulateAnalysis(cleanedData, field, chartType);
    return Response.json({ results });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
