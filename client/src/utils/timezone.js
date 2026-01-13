// 时区工具模块

// 常用时区列表（按地区分组）
export const COMMON_TIMEZONES = [
  {
    region: '自动',
    timezones: [
      { value: 'auto', label: '自动（使用设备时区）', offset: '' }
    ]
  },
  {
    region: '亚洲',
    timezones: [
      { value: 'Asia/Shanghai', label: '中国标准时间 (CST)', offset: '+08:00' },
      { value: 'Asia/Ho_Chi_Minh', label: '越南时间 (ICT)', offset: '+07:00' },
      { value: 'Asia/Bangkok', label: '泰国时间 (ICT)', offset: '+07:00' },
      { value: 'Asia/Singapore', label: '新加坡时间 (SGT)', offset: '+08:00' },
      { value: 'Asia/Tokyo', label: '日本标准时间 (JST)', offset: '+09:00' },
      { value: 'Asia/Seoul', label: '韩国标准时间 (KST)', offset: '+09:00' }
    ]
  },
  {
    region: '欧洲',
    timezones: [
      { value: 'Europe/London', label: '英国时间 (GMT/BST)', offset: '+00:00' },
      { value: 'Europe/Paris', label: '中欧时间 (CET/CEST)', offset: '+01:00' }
    ]
  },
  {
    region: '美洲',
    timezones: [
      { value: 'America/New_York', label: '美国东部时间 (EST/EDT)', offset: '-05:00' },
      { value: 'America/Los_Angeles', label: '美国太平洋时间 (PST/PDT)', offset: '-08:00' }
    ]
  },
  {
    region: '大洋洲',
    timezones: [
      { value: 'Australia/Sydney', label: '澳大利亚东部时间 (AEST/AEDT)', offset: '+10:00' }
    ]
  }
];

/**
 * 根据时区获取"今天"的日期字符串
 * @param {string} timezone - IANA时区标识符或'auto'
 * @returns {string} YYYY-MM-DD格式的日期字符串
 */
export function getToday(timezone = 'auto') {
  const now = new Date();

  if (timezone === 'auto') {
    // 使用本地时区
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } else {
    // 使用指定时区
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(now);
    } catch (error) {
      console.error('Invalid timezone:', timezone, error);
      // 回退到auto模式
      return getToday('auto');
    }
  }
}

/**
 * 获取时区的显示信息
 * @param {string} timezone - IANA时区标识符或'auto'
 * @returns {object} { label: string, offset: string }
 */
export function getTimezoneDisplayInfo(timezone = 'auto') {
  if (timezone === 'auto') {
    const offset = getTimezoneOffset('auto');
    return {
      label: `自动（使用设备时区 ${offset}）`,
      offset
    };
  }

  // 查找时区配置
  for (const group of COMMON_TIMEZONES) {
    const found = group.timezones.find(tz => tz.value === timezone);
    if (found) {
      return {
        label: found.label,
        offset: found.offset
      };
    }
  }

  // 如果不在常用列表中，返回基本信息
  return {
    label: timezone,
    offset: getTimezoneOffset(timezone)
  };
}

/**
 * 获取时区的偏移量字符串（如+08:00）
 * @param {string} timezone - IANA时区标识符或'auto'
 * @returns {string} 偏移量字符串
 */
export function getTimezoneOffset(timezone = 'auto') {
  const now = new Date();

  if (timezone === 'auto') {
    // 获取本地时区偏移
    const offset = -now.getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? '+' : '-';
    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  } else {
    try {
      // 使用Intl API获取时区偏移
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'longOffset'
      });
      const parts = formatter.formatToParts(now);
      const offsetPart = parts.find(part => part.type === 'timeZoneName');
      if (offsetPart && offsetPart.value.includes('GMT')) {
        const offset = offsetPart.value.replace('GMT', '').trim();
        return offset || '+00:00';
      }
      return '';
    } catch (error) {
      console.error('Error getting timezone offset:', error);
      return '';
    }
  }
}

/**
 * 获取当前时区的当前时间字符串（用于显示）
 * @param {string} timezone - IANA时区标识符或'auto'
 * @returns {string} 格式化的时间字符串
 */
export function getCurrentTime(timezone = 'auto') {
  const now = new Date();

  if (timezone === 'auto') {
    return now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } else {
    try {
      return now.toLocaleString('zh-CN', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return getCurrentTime('auto');
    }
  }
}

/**
 * 将UTC时间戳转换为指定时区的日期字符串
 * @param {Date|string} timestamp - UTC时间戳
 * @param {string} timezone - IANA时区标识符或'auto'
 * @returns {string} YYYY-MM-DD格式的日期字符串（基于时区）
 */
export function getDateInTimezone(timestamp, timezone = 'auto') {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  if (timezone === 'auto') {
    // 使用本地时区
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } else {
    // 使用指定时区
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
      // 回退到auto模式
      return getDateInTimezone(timestamp, 'auto');
    }
  }
}

/**
 * 将本地日期字符串转换为UTC日期范围
 * @param {string} dateStr - YYYY-MM-DD格式的日期字符串
 * @param {string} timezone - IANA时区标识符或'auto'
 * @returns {object} { startDate: string, endDate: string } - ISO格式的UTC时间戳
 */
export function getDateRangeInUTC(dateStr, timezone = 'auto') {
  if (timezone === 'auto') {
    // 使用本地时区
    const startDate = new Date(dateStr + 'T00:00:00');
    const endDate = new Date(dateStr + 'T23:59:59.999');
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  } else {
    // 使用指定时区
    try {
      // 简单可靠的方法：
      // 1. 获取目标时区的当前偏移量
      // 2. 应用该偏移量到目标日期

      // 解析日期
      const [year, month, day] = dateStr.split('-').map(Number);

      // 创建目标日期在UTC的午夜时间作为参考点
      const refDateUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

      // 获取这个UTC时间在目标时区对应的本地时间字符串
      const tzString = refDateUTC.toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      // 解析时区本地时间
      const tzDate = new Date(tzString);

      // 计算偏移量（目标时区相对于UTC的偏移）
      const offset = refDateUTC.getTime() - tzDate.getTime();

      // 现在我们知道偏移量了，可以计算目标日期在目标时区的00:00:00和23:59:59对应的UTC时间
      // 在目标时区创建日期的00:00:00
      const startLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endLocal = new Date(year, month - 1, day, 23, 59, 59, 999);

      // 转换为UTC（加上偏移量）
      const startUTC = new Date(startLocal.getTime() + offset);
      const endUTC = new Date(endLocal.getTime() + offset);

      return {
        startDate: startUTC.toISOString(),
        endDate: endUTC.toISOString()
      };
    } catch (error) {
      console.error('Error converting date range to UTC:', error);
      // 回退到auto模式
      return getDateRangeInUTC(dateStr, 'auto');
    }
  }
}
