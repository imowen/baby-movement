// Server-side timezone utility functions

/**
 * Convert UTC timestamp to date string in specified timezone
 * @param {Date|string} timestamp - UTC timestamp
 * @param {string} timezone - IANA timezone identifier or 'auto'
 * @returns {string} YYYY-MM-DD date string in the specified timezone
 */
export function getDateInTimezone(timestamp, timezone = 'auto') {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  if (timezone === 'auto') {
    // For server-side 'auto', we can't determine user's local timezone
    // So we just use the UTC date conversion
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } else {
    // Use specified timezone
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(date);
    } catch (error) {
      console.error('Invalid timezone:', timezone, error);
      // Fallback to UTC
      return getDateInTimezone(timestamp, 'auto');
    }
  }
}
