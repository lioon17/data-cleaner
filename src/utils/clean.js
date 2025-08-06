import dayjs from 'dayjs';
import { wordsToNumbers } from 'words-to-numbers';
import { v4 as uuidv4 } from 'uuid';
const sessionId = uuidv4();


const DATE_FORMATS = [
  'YYYY-MM-DD', 'YYYY/MM/DD', 'YYYY.MM.DD',
  'DD-MM-YYYY', 'D MMM YYYY', 'MM/DD/YYYY'
];

const TRUTHY = ['yes', 'true', '1'];
const FALSY = ['no', 'false', '0'];

export function cleanValue(value, type, key = '') {
  if (value == null || typeof value !== 'string') return value;

  const raw = value.toString().trim();

  switch (type) {
    case 'number': {
      const parsed = Number(wordsToNumbers(raw.replace(/,/g, '')));
      return isNaN(parsed) ? null : parsed;
    }

    case 'boolean': {
      const lowered = raw.toLowerCase();
      if (TRUTHY.includes(lowered)) return true;
      if (FALSY.includes(lowered)) return false;
      return null;
    }

    case 'date': {
      const date = dayjs(raw, DATE_FORMATS, true);
      return date.isValid() ? date.format('YYYY-MM-DD') : null;
    }

    case 'string':
    default: {
      return raw.replace(/[^\w\s]/gi, '').toLowerCase(); // clean + normalize
    }
  }
}

export function cleanRows(rows, types) {
  return rows.map(row => {
    const cleaned = {};
    for (const key in row) {
      cleaned[key] = cleanValue(row[key], types[key], key);
    }
    return cleaned;
  });
}
