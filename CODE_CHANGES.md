# Code Changes - Timezone Data Consistency Fix

## Overview

This document shows the exact code changes made to fix the data consistency issue between single-day view and daily trend chart in the Stats page.

---

## 1. Created New File: `server/utils/timezone.js`

**Purpose**: Provide server-side timezone conversion utilities

```javascript
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
```

---

## 2. Modified: `server/db.js`

### Added Import

```diff
  import { JSONFilePreset } from 'lowdb/node';
  import { fileURLToPath } from 'url';
  import { dirname, join } from 'path';
+ import { getDateInTimezone } from './utils/timezone.js';
```

### Modified `getDailyStats` Function

**BEFORE:**
```javascript
getDailyStats(days, userId) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString();

  const movements = db.data.movements.filter(m =>
    m.user_id === userId && m.timestamp >= cutoffStr
  );

  // 按日期分组
  const grouped = {};
  movements.forEach(m => {
    const date = m.timestamp.split('T')[0];  // ❌ PROBLEM: UTC date
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(m);
  });

  // 转换为数组格式
  const stats = Object.entries(grouped).map(([date, items]) => ({
    date,
    count: items.length,
    tags: [...new Set(items.map(i => i.tag))].join(',')
  }));

  // 按日期倒序排序
  stats.sort((a, b) => b.date.localeCompare(a.date));

  return stats;
}
```

**AFTER:**
```javascript
getDailyStats(days, userId, timezone = 'auto') {  // ✅ Added timezone parameter
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString();

  const movements = db.data.movements.filter(m =>
    m.user_id === userId && m.timestamp >= cutoffStr
  );

  // 按日期分组 - 使用时区转换
  const grouped = {};
  movements.forEach(m => {
    // FIXED: 使用时区转换UTC时间戳为用户时区的日期
    const date = getDateInTimezone(m.timestamp, timezone);  // ✅ Timezone-aware!
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(m);
  });

  // 转换为数组格式
  const stats = Object.entries(grouped).map(([date, items]) => ({
    date,
    count: items.length,
    tags: [...new Set(items.map(i => i.tag))].join(',')
  }));

  // 按日期倒序排序
  stats.sort((a, b) => b.date.localeCompare(a.date));

  return stats;
}
```

**Key Changes:**
- Added `timezone = 'auto'` parameter
- Changed from `m.timestamp.split('T')[0]` to `getDateInTimezone(m.timestamp, timezone)`
- Added comment explaining the fix

---

## 3. Modified: `server/routes/movements.js`

**BEFORE:**
```javascript
// 获取历史统计（按天）
router.get('/daily-stats', (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;
    const stats = movementOperations.getDailyStats(parseInt(days), userId);

    res.json(stats);
  } catch (error) {
    console.error('获取历史统计错误:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});
```

**AFTER:**
```javascript
// 获取历史统计（按天）
router.get('/daily-stats', (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30, timezone = 'auto' } = req.query;  // ✅ Added timezone
    const stats = movementOperations.getDailyStats(
      parseInt(days), 
      userId, 
      timezone  // ✅ Pass timezone to function
    );

    res.json(stats);
  } catch (error) {
    console.error('获取历史统计错误:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});
```

**Key Changes:**
- Extract `timezone` from query params with default value 'auto'
- Pass `timezone` as third parameter to `getDailyStats()`

---

## 4. Modified: `client/src/api.js`

**BEFORE:**
```javascript
getDailyStats(days = 30) {
  return api.get('/movements/daily-stats', { params: { days } });
}
```

**AFTER:**
```javascript
getDailyStats(days = 30, timezone = 'auto') {  // ✅ Added timezone parameter
  return api.get('/movements/daily-stats', { 
    params: { days, timezone }  // ✅ Send timezone to server
  });
}
```

**Key Changes:**
- Added `timezone = 'auto'` parameter
- Include `timezone` in API request params

---

## 5. Modified: `client/src/views/Stats.vue`

**BEFORE:**
```javascript
const loadData = async () => {
  try {
    const { startDate, endDate } = dateRange.value;

    console.log('loadData called:', {
      selectedPeriod: selectedPeriod.value,
      appliedCustomStart: appliedCustomStart.value,
      appliedCustomEnd: appliedCustomEnd.value,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    });

    // 计算天数用于获取每日统计
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    const [stats, movements] = await Promise.all([
      api.getDailyStats(days),  // ❌ No timezone
      api.getMovements({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000
      })
    ]);

    dailyStats.value = stats;
    allMovements.value = movements;

    // 默认展开第一个分组
    if (groupedMovements.value.length > 0 && Object.keys(expandedGroups).length === 0) {
      expandedGroups[groupedMovements.value[0].date] = true;
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};
```

**AFTER:**
```javascript
const loadData = async () => {
  try {
    const { startDate, endDate } = dateRange.value;

    console.log('loadData called:', {
      selectedPeriod: selectedPeriod.value,
      appliedCustomStart: appliedCustomStart.value,
      appliedCustomEnd: appliedCustomEnd.value,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    });

    // 计算天数用于获取每日统计
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // 获取时区设置
    const timezone = settings.value.timezone || 'auto';  // ✅ Get user's timezone

    const [stats, movements] = await Promise.all([
      api.getDailyStats(days, timezone),  // ✅ Pass timezone
      api.getMovements({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000
      })
    ]);

    dailyStats.value = stats;
    allMovements.value = movements;

    // 默认展开第一个分组
    if (groupedMovements.value.length > 0 && Object.keys(expandedGroups).length === 0) {
      expandedGroups[groupedMovements.value[0].date] = true;
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};
```

**Key Changes:**
- Get timezone from user settings: `const timezone = settings.value.timezone || 'auto'`
- Pass timezone to API call: `api.getDailyStats(days, timezone)`

---

## Summary of Changes

| File | Type | Lines Changed | Key Change |
|------|------|---------------|------------|
| `server/utils/timezone.js` | NEW | +36 | Created timezone conversion utility |
| `server/db.js` | MODIFIED | +3 | Import timezone util, add parameter, use timezone-aware grouping |
| `server/routes/movements.js` | MODIFIED | +2 | Extract timezone param, pass to function |
| `client/src/api.js` | MODIFIED | +1 | Add timezone parameter and send to server |
| `client/src/views/Stats.vue` | MODIFIED | +3 | Get user timezone, pass to API |

**Total**: 1 new file, 4 modified files, ~45 lines of new/changed code

---

## Testing Checklist

- [ ] Server starts without errors
- [ ] API endpoint accepts timezone parameter
- [ ] getDailyStats uses timezone for grouping
- [ ] Stats page sends timezone in request
- [ ] Single-day count matches trend chart count
- [ ] Records near midnight grouped correctly
- [ ] Different timezones produce different groupings (expected)
- [ ] Backwards compatibility maintained (timezone defaults work)

---

## Impact Analysis

**Data Layer**: No database changes required
**API Layer**: Backwards compatible (timezone defaults to 'auto')
**UI Layer**: No visual changes, only data consistency improved
**Performance**: Negligible impact (Intl.DateTimeFormat is fast)
**Breaking Changes**: None (all changes are additive)

---
