import dayjs from 'dayjs';

/**
 * Adds derived features to each row
 */
export function addFeatures(rows) {
  const today = dayjs();

  return rows.map(row => {
    const enriched = { ...row };

    // Feature 1: days since joined
    if (row.joined) {
      const joinedDate = dayjs(row.joined);
      if (joinedDate.isValid()) {
        enriched.days_since_joined = today.diff(joinedDate, 'day');
      } else {
        enriched.days_since_joined = null;
      }
    }

    // Feature 2: spending category
    const amt = Number(row.amount);
    if (!isNaN(amt)) {
      enriched.spending_category =
        amt >= 1000 ? 'high' :
        amt >= 500  ? 'medium' : 'low';
    } else {
      enriched.spending_category = 'unknown';
    }

    // Feature 3: high value flag
    enriched.is_high_value = amt > 1500;

    return enriched;
  });
}
