import dayjs from 'dayjs';

export function validateSchema(row, requiredFields = []) {
  return requiredFields.every(field => row[field] !== undefined && row[field] !== null && row[field] !== '');
}

export function validateLogic(row) {
  // Example: "joined" date must not be in the future
  const today = dayjs().format('YYYY-MM-DD');
  if (row.joined && dayjs(row.joined).isAfter(today)) {
    return false;
  }
  return true;
}

export function validateRows(rows, requiredFields = []) {
  return rows.filter(row =>
    validateSchema(row, requiredFields) && validateLogic(row)
  );
}
