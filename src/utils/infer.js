import dayjs from 'dayjs';

const KNOWN_DATE_FORMATS = [
  'YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY.MM.DD',
  'DD-MM-YYYY', 'MM/DD/YYYY', 'D MMM YYYY'
];

export function inferTypes(row) {
  const types = {};

  for (const key in row) {
    const value = row[key]?.toString().trim();

    if (!value) {
      types[key] = 'string';
      continue;
    }

    if (['true', 'false', 'yes', 'no', '1', '0'].includes(value.toLowerCase())) {
      types[key] = 'boolean';
    } else if (!isNaN(Number(value.replace(/,/g, '')))) {
      types[key] = 'number';
    } else if (dayjs(value, KNOWN_DATE_FORMATS, true).isValid()) {
      types[key] = 'date';
    } else {
      types[key] = 'string';
    }
  }

  return types;
}
