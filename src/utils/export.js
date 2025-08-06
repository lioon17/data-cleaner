import fs from 'fs';
import path from 'path';
import { stringify } from 'csv-stringify/sync';

function ensureOutputDir() {
  const dir = './output';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

export function exportToJSON(data, filename = './output/cleaned_data.json') {
  ensureOutputDir();
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`📝 Cleaned JSON exported to ${filename}`);
}

export function exportToCSV(data, filename = './output/cleaned_data.csv') {
  ensureOutputDir();
  const csv = stringify(data, { header: true });
  fs.writeFileSync(filename, csv);
  console.log(`📝 Cleaned CSV exported to ${filename}`);
}
