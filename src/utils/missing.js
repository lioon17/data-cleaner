export function isMissing(value) {
  if (value === null || value === undefined) return true;
  const v = value.toString().trim().toLowerCase();
  return ['n/a', 'na', 'null', 'none', '', '-'].includes(v);
}

export function handleMissing(data, types, strategy = 'impute') {
  if (strategy === 'drop') {
    return data.filter(row =>
      Object.values(row).every(val => !isMissing(val))
    );
  }

  if (strategy === 'impute') {
    return data.map(row => {
      const filled = {};
      for (const key in row) {
        const value = row[key];
        if (!isMissing(value)) {
          filled[key] = value;
        } else {
          const type = types[key];
          filled[key] = type === 'string' ? 'unknown'
                       : type === 'number' ? 0
                       : type === 'boolean' ? false
                       : type === 'date' ? null
                       : null;
        }
      }
      return filled;
    });
  }

  if (strategy === 'flag') {
    return data.map(row => {
      const flagged = {};
      for (const key in row) {
        const missing = isMissing(row[key]);
        flagged[key] = row[key];
        flagged[`is_${key}_missing`] = missing;
      }
      return flagged;
    });
  }

  return data; // no-op fallback
}
