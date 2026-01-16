import { JSONFilePreset } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDateInTimezone } from './utils/timezone.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 默认数据结构
const defaultData = {
  users: [],
  movements: [],
  settings: {
    dueDate: null,  // 预产期
    timezone: 'auto'  // 时区：'auto'或IANA时区标识符
  }
};

// 初始化数据库
const dbPath = join(__dirname, 'db.json');
const db = await JSONFilePreset(dbPath, defaultData);

// 辅助函数：生成 ID
const generateId = (collection) => {
  if (collection.length === 0) return 1;
  return Math.max(...collection.map(item => item.id)) + 1;
};

// 用户相关操作
export const userOperations = {
  findByUsername(username) {
    return db.data.users.find(u => u.username === username);
  },

  create(username, passwordHash, displayName) {
    const user = {
      id: generateId(db.data.users),
      username,
      password_hash: passwordHash,
      display_name: displayName,
      created_at: new Date().toISOString()
    };
    db.data.users.push(user);
    db.write();
    return user;
  }
};

// 胎动记录相关操作
export const movementOperations = {
  create(userId, timestamp, intensity, tag, note) {
    const movement = {
      id: generateId(db.data.movements),
      user_id: userId,
      timestamp,
      intensity,
      tag,
      note: note || '',
      created_at: new Date().toISOString()
    };
    db.data.movements.push(movement);
    db.write();
    return movement;
  },

  findAll({ userId, startDate, endDate, limit = 50 }) {
    let movements = [...db.data.movements];

    // Filter by user
    if (userId) {
      movements = movements.filter(m => m.user_id === userId);
    }

    if (startDate) {
      movements = movements.filter(m => m.timestamp >= startDate);
    }

    if (endDate) {
      movements = movements.filter(m => m.timestamp <= endDate);
    }

    // 按时间倒序排序
    movements.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return movements.slice(0, limit);
  },

  getTodayStats(dateOrRange, userId) {
    let movements;

    // 支持两种模式：
    // 1. 对象 { startDate, endDate } - 使用UTC日期范围过滤
    // 2. 字符串 "YYYY-MM-DD" - 使用旧的startsWith过滤（向后兼容）
    if (typeof dateOrRange === 'object' && dateOrRange.startDate && dateOrRange.endDate) {
      // 新模式：使用UTC日期范围
      movements = db.data.movements.filter(m => {
        return m.user_id === userId &&
               m.timestamp >= dateOrRange.startDate &&
               m.timestamp <= dateOrRange.endDate;
      });
    } else {
      // 旧模式：使用日期字符串（向后兼容）
      const date = dateOrRange;
      movements = db.data.movements.filter(m => {
        return m.user_id === userId && m.timestamp.startsWith(date);
      });
    }

    const byIntensity = {};
    const byTag = {};

    movements.forEach(m => {
      byIntensity[m.intensity] = (byIntensity[m.intensity] || 0) + 1;
      byTag[m.tag] = (byTag[m.tag] || 0) + 1;
    });

    // Sort movements by timestamp to get the most recent one
    const sortedMovements = [...movements].sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    return {
      total: movements.length,
      last_time: sortedMovements.length > 0 ? sortedMovements[0].timestamp : null,
      byIntensity: Object.entries(byIntensity).map(([intensity, count]) => ({ intensity, count })),
      byTag: Object.entries(byTag).map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
    };
  },

  getDailyStats(days, userId, timezone = 'auto') {
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
      const date = getDateInTimezone(m.timestamp, timezone);
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
  },

  delete(id, userId) {
    const index = db.data.movements.findIndex(m => m.id === id && m.user_id === userId);
    if (index === -1) return null;

    const movement = db.data.movements[index];
    db.data.movements.splice(index, 1);
    db.write();
    return movement;
  }
};

// 设置相关操作
export const settingsOperations = {
  get() {
    const settings = db.data.settings || { dueDate: null };
    // 向后兼容：确保timezone字段存在
    if (!settings.timezone) {
      settings.timezone = 'auto';
    }
    return settings;
  },

  setDueDate(dueDate) {
    if (!db.data.settings) {
      db.data.settings = {};
    }
    db.data.settings.dueDate = dueDate;
    db.write();
    return db.data.settings;
  },

  setTimezone(timezone) {
    if (!db.data.settings) {
      db.data.settings = { dueDate: null };
    }
    db.data.settings.timezone = timezone;
    db.write();
    return db.data.settings;
  }
};

// 导出getDb函数供其他模块使用
export const getDb = () => db;

export default db;
