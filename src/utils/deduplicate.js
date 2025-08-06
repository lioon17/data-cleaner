import _ from 'lodash';

/**
 * Remove fully identical rows (deep equality)
 */
export function removeExactDuplicates(data) {
  return _.uniqWith(data, _.isEqual);
}

/**
 * Optional: remove duplicates based on specific keys
 * e.g., deduplicate by ['user', 'joined']
 */
export function removeDuplicatesByKeys(data, keys) {
  const seen = new Set();
  return data.filter(row => {
    const composite = keys.map(k => row[k]).join('|');
    if (seen.has(composite)) return false;
    seen.add(composite);
    return true;
  });
}
