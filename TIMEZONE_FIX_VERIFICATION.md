# Timezone Data Consistency Fix - Verification Guide

## Problem Description

**Issue**: Data discrepancy between single-day view and 7-day trend chart in Stats page.

**Example**:
- Single day view for 1/13: Shows 23 records (总次数: 23)
- 7-day trend chart for 1/13: Shows 30 records
- This is a 7-record difference (30%)

## Root Cause Analysis

### What Was Wrong

The `getDailyStats` function in `server/db.js` was grouping movements by **UTC date**:

```javascript
// OLD CODE (WRONG)
movements.forEach(m => {
  const date = m.timestamp.split('T')[0];  // Extracts UTC date!
  grouped[date].push(m);
});
```

Meanwhile, the single-day view in `Stats.vue` was using **timezone-aware date grouping**:

```javascript
// Stats.vue
const date = getDateInTimezone(m.timestamp, timezone);  // Timezone-aware!
```

### Why This Caused the Issue

For a record created at **2026-01-14 00:30 Vietnam time (UTC+7)**:
- Stored as UTC timestamp: `"2026-01-13T17:30:00.000Z"`
- `getDailyStats` grouped it as: **"2026-01-13"** (UTC date)
- Single-day view for Jan 14: Correctly showed it as **"2026-01-14"** (Vietnam date)

**Result**: The same record appeared on different dates in different views!

## Solution Implemented

### 1. Created Server-Side Timezone Utility

**File**: `server/utils/timezone.js`

```javascript
export function getDateInTimezone(timestamp, timezone = 'auto') {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  if (timezone === 'auto') {
    // Use UTC date
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } else {
    // Use specified timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(date);
  }
}
```

### 2. Updated getDailyStats Function

**File**: `server/db.js`

**Changes**:
- Added `timezone` parameter (defaults to 'auto')
- Changed from `m.timestamp.split('T')[0]` to `getDateInTimezone(m.timestamp, timezone)`

```javascript
// NEW CODE (FIXED)
getDailyStats(days, userId, timezone = 'auto') {
  // ... filter movements ...

  // 按日期分组 - 使用时区转换
  const grouped = {};
  movements.forEach(m => {
    // FIXED: 使用时区转换UTC时间戳为用户时区的日期
    const date = getDateInTimezone(m.timestamp, timezone);
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(m);
  });

  // ... return stats ...
}
```

### 3. Updated API Route

**File**: `server/routes/movements.js`

```javascript
router.get('/daily-stats', (req, res) => {
  const userId = req.user.id;
  const { days = 30, timezone = 'auto' } = req.query;  // Added timezone
  const stats = movementOperations.getDailyStats(parseInt(days), userId, timezone);
  res.json(stats);
});
```

### 4. Updated Client API

**File**: `client/src/api.js`

```javascript
getDailyStats(days = 30, timezone = 'auto') {
  return api.get('/movements/daily-stats', { params: { days, timezone } });
}
```

### 5. Updated Stats.vue

**File**: `client/src/views/Stats.vue`

```javascript
const loadData = async () => {
  const timezone = settings.value.timezone || 'auto';  // Get user's timezone

  const [stats, movements] = await Promise.all([
    api.getDailyStats(days, timezone),  // Pass timezone
    api.getMovements({ ... })
  ]);

  // ...
};
```

## How to Verify the Fix

### Setup Test Data

1. Set your timezone to Vietnam (Asia/Ho_Chi_Minh, UTC+7) in Settings
2. Create test records at specific times:

```javascript
// Record at 2026-01-14 00:30 Vietnam time
// This will be stored as 2026-01-13T17:30:00.000Z in UTC

// Record at 2026-01-13 23:30 Vietnam time
// This will be stored as 2026-01-13T16:30:00.000Z in UTC

// Record at 2026-01-13 12:00 Vietnam time
// This will be stored as 2026-01-13T05:00:00.000Z in UTC
```

### Test Cases

#### Test 1: Single Day View vs Trend Chart

1. Go to Stats page
2. Select "7天" (7 days)
3. Note the count for 1/13 in the trend chart
4. Click "自定义" and select only 1/13
5. Note the "总次数" (total count) in the single day view

**Expected**: Both counts should be IDENTICAL

**Before fix**: Different counts (e.g., 23 vs 30)
**After fix**: Same count

#### Test 2: Midnight Edge Cases

1. Create a record at 00:30 on the current day (your local timezone)
2. Immediately view Stats for "今天" (today)
3. Check if the record appears in today's count
4. Check the 7-day trend chart - verify it shows on the correct date

**Expected**: Record appears on the correct date in both views

#### Test 3: Timezone Change

1. Set timezone to Vietnam (UTC+7)
2. Create 5 records
3. Note the daily counts in the trend chart
4. Change timezone to US Pacific (UTC-8)
5. Reload Stats page

**Expected**: Records may shift to different dates (this is correct behavior - the records are being viewed from a different timezone perspective)

#### Test 4: Record Detail Grouping

1. Go to Stats page
2. Select "7天" (7 days)
3. Scroll down to "记录详情" (Record Details)
4. Check the date grouping
5. Verify each group's count matches the trend chart for that date

**Expected**: All counts should be consistent

## Technical Details

### Date Conversion Examples

With timezone = 'Asia/Ho_Chi_Minh' (UTC+7):

| UTC Timestamp | UTC Date | Vietnam Date | Grouped As (Before) | Grouped As (After) |
|--------------|----------|--------------|---------------------|-------------------|
| 2026-01-13T17:30:00Z | 2026-01-13 | 2026-01-14 | 2026-01-13 ❌ | 2026-01-14 ✅ |
| 2026-01-13T16:30:00Z | 2026-01-13 | 2026-01-13 | 2026-01-13 ✅ | 2026-01-13 ✅ |
| 2026-01-13T05:00:00Z | 2026-01-13 | 2026-01-13 | 2026-01-13 ✅ | 2026-01-13 ✅ |
| 2026-01-12T18:00:00Z | 2026-01-12 | 2026-01-13 | 2026-01-12 ❌ | 2026-01-13 ✅ |

### Consistency Check

Both views now use the same logic:
1. Start with UTC timestamp (e.g., `"2026-01-13T17:30:00.000Z"`)
2. Convert to user's timezone (e.g., Vietnam UTC+7)
3. Extract date in that timezone (e.g., `"2026-01-14"`)
4. Group by that date

**Result**: Perfect consistency between all views!

## Files Modified

1. ✅ `/server/utils/timezone.js` - Created new file
2. ✅ `/server/db.js` - Updated getDailyStats function
3. ✅ `/server/routes/movements.js` - Added timezone parameter
4. ✅ `/client/src/api.js` - Added timezone parameter
5. ✅ `/client/src/views/Stats.vue` - Pass timezone to API

## Backwards Compatibility

The fix maintains backwards compatibility:
- `timezone` parameter defaults to `'auto'` if not provided
- Existing API calls without timezone will continue to work
- No database schema changes required

## Prevention Recommendations

To prevent similar issues in the future:

1. **Always use timezone-aware date functions** when grouping by date
2. **Never use `timestamp.split('T')[0]`** for date extraction - this gives UTC date
3. **Use `getDateInTimezone(timestamp, timezone)`** instead
4. **Test with multiple timezones** especially UTC+/- edge cases
5. **Test records created near midnight** (00:00 and 23:59)

## Additional Notes

- The fix only affects how existing data is displayed
- No data migration needed
- All existing records will automatically show correctly with the new grouping
- Performance impact: Negligible (timezone conversion is fast)
