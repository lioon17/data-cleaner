export function detectOutliersByThreshold(data, field, threshold = 1_000_000) {
  return data.filter(row =>
    typeof row[field] === 'number' && Math.abs(row[field]) > threshold
  );
}

export function detectOutliersByZScore(data, field, zLimit = 3) {
  const values = data.map(row => row[field]).filter(v => typeof v === 'number');
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

  return data.filter(row => {
    const val = row[field];
    if (typeof val !== 'number') return false;
    const z = (val - mean) / std;
    return Math.abs(z) > zLimit;
  });
}
