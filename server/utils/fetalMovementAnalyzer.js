/**
 * 胎动分析工具
 * 基于中华医学会和ACOG标准分析胎动情况
 */

/**
 * 分析胎动情况
 * @param {Array} movements - 胎动记录数组
 * @param {number} currentWeek - 当前孕周
 * @param {boolean} isHighRisk - 是否高危孕妇
 * @returns {Object} 分析结果
 */
export function analyzeFetalMovement(movements, currentWeek, isHighRisk = false) {
  const now = new Date();

  // 28周前不进行判断（26周前高危孕妇也不判断）
  if (currentWeek < 28 || (isHighRisk && currentWeek < 26)) {
    return {
      status: 'not_applicable',
      message: currentWeek < 26
        ? '26周前可以不用正式数胎动，只要能感受到宝宝在活动就好。'
        : '建议从28周开始每天数胎动，现在可以先熟悉宝宝的活动规律。',
      shouldMonitor: false,
      emoji: '🌱'
    };
  }

  // 过滤今天的胎动记录
  const todayMovements = movements.filter(m => {
    const movementDate = new Date(m.timestamp);
    return isSameDay(movementDate, now);
  });

  // 如果今天还没有记录
  if (todayMovements.length === 0) {
    return {
      status: 'no_data',
      message: '今天还没有胎动记录哦，记得每天关注宝宝的活动情况。',
      shouldMonitor: true,
      emoji: '📝'
    };
  }

  // 分析最近2小时的胎动
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const last2HourMovements = movements.filter(m => {
    const movementDate = new Date(m.timestamp);
    return movementDate >= twoHoursAgo && movementDate <= now;
  });

  // 分析最近12小时的胎动
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  const last12HourMovements = movements.filter(m => {
    const movementDate = new Date(m.timestamp);
    return movementDate >= twelveHoursAgo && movementDate <= now;
  });

  // 判断标准
  const count2h = last2HourMovements.length;
  const count12h = last12HourMovements.length;
  const countToday = todayMovements.length;

  // 28-34周是胎动最强烈期
  const isPeakPeriod = currentWeek >= 28 && currentWeek <= 34;

  // 34周后胎动可能略有减少但应保持规律
  const isLatePeriod = currentWeek > 34;

  // 分析结果
  const result = {
    counts: {
      last2Hours: count2h,
      last12Hours: count12h,
      today: countToday
    },
    standards: {
      method2h: { standard: 10, current: count2h },
      method12h: { standard: 20, current: count12h }
    }
  };

  // 判断异常情况
  if (count2h > 0 && count2h < 10) {
    return {
      ...result,
      status: 'warning',
      urgency: 'medium',
      message: '最近2小时的胎动次数略少。宝宝有时会进入休息状态，可以尝试侧躺、喝点水或吃点甜的，再观察1小时。',
      suggestion: '如果在接下来的时间里仍明显减少，建议联系医生进一步确认。',
      shouldMonitor: true,
      emoji: '⚠️'
    };
  }

  if (count12h > 0 && count12h < 20) {
    return {
      ...result,
      status: 'warning',
      urgency: 'high',
      message: '最近12小时的胎动次数低于正常范围（应≥20次）。',
      suggestion: '建议尽快联系医生或前往医院检查，确保宝宝安全。',
      shouldMonitor: true,
      emoji: '⚠️'
    };
  }

  // 正常情况
  if (count2h >= 10 || count12h >= 20) {
    let message = '今天宝宝有在规律活动 🌱\n和你现在的孕周情况是匹配的。';

    if (isPeakPeriod) {
      message += '\n现在是胎动最强烈的时期（28-34周），宝宝很活跃是正常的。';
    } else if (isLatePeriod) {
      message += '\n随着空间越来越小，胎动可能没有之前那么剧烈，但应该保持规律。';
    }

    return {
      ...result,
      status: 'normal',
      urgency: 'low',
      message,
      suggestion: '你已经在认真关注宝宝了，这本身就很重要。继续保持每天数胎动的好习惯。',
      shouldMonitor: true,
      emoji: '✅'
    };
  }

  // 数据不足
  return {
    ...result,
    status: 'insufficient_data',
    urgency: 'low',
    message: '继续记录胎动，积累足够的数据后可以更准确地分析宝宝的活动规律。',
    suggestion: '建议每天固定时间（如早中晚各1小时）数胎动，更容易发现规律。',
    shouldMonitor: true,
    emoji: '📊'
  };
}

/**
 * 比较今天和昨天的胎动情况
 * @param {Array} movements - 胎动记录数组
 * @returns {Object} 对比结果
 */
export function compareWithYesterday(movements) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayMovements = movements.filter(m => isSameDay(new Date(m.timestamp), now));
  const yesterdayMovements = movements.filter(m => isSameDay(new Date(m.timestamp), yesterday));

  const todayCount = todayMovements.length;
  const yesterdayCount = yesterdayMovements.length;

  if (yesterdayCount === 0) {
    return {
      hasComparison: false,
      message: '昨天没有记录，无法对比'
    };
  }

  const changePercent = ((todayCount - yesterdayCount) / yesterdayCount) * 100;
  const changeAbs = Math.abs(changePercent);

  // 如果减少超过50%，需要警惕
  if (changePercent < -50) {
    return {
      hasComparison: true,
      status: 'warning',
      todayCount,
      yesterdayCount,
      changePercent: changePercent.toFixed(1),
      message: `胎动较昨天减少了${changeAbs.toFixed(0)}%，需要注意观察。`,
      suggestion: '如果持续减少，建议联系医生。',
      emoji: '⚠️'
    };
  }

  // 增加超过50%
  if (changePercent > 50) {
    return {
      hasComparison: true,
      status: 'active',
      todayCount,
      yesterdayCount,
      changePercent: changePercent.toFixed(1),
      message: `今天宝宝比较活跃，胎动增加了${changePercent.toFixed(0)}%。`,
      suggestion: '在这个阶段活动增加也是常见的，只要宝宝活动规律就好。',
      emoji: '🎉'
    };
  }

  // 变化在正常范围内
  return {
    hasComparison: true,
    status: 'stable',
    todayCount,
    yesterdayCount,
    changePercent: changePercent.toFixed(1),
    message: '胎动情况与昨天基本持平，保持稳定。',
    suggestion: '继续保持记录，关注宝宝的活动规律。',
    emoji: '✅'
  };
}

/**
 * 获取胎动建议
 * @param {number} currentWeek - 当前孕周
 * @param {number} todayCount - 今天的胎动次数
 * @returns {Object} 建议
 */
export function getMovementAdvice(currentWeek, todayCount) {
  if (currentWeek < 28) {
    return {
      title: '观察阶段',
      advice: [
        '现在可以开始熟悉宝宝的活动规律',
        '注意宝宝在什么时候比较活跃',
        '28周后开始正式每天数胎动'
      ]
    };
  }

  if (todayCount === 0) {
    return {
      title: '记得数胎动',
      advice: [
        '建议每天固定时间数胎动',
        '可以选择早中晚各1小时',
        '或者集中精力数2小时'
      ]
    };
  }

  if (todayCount < 10) {
    return {
      title: '继续观察',
      advice: [
        '现在的记录还不够，继续观察',
        '可以尝试侧躺或吃点东西，刺激宝宝活动',
        '如果持续减少，及时就医'
      ]
    };
  }

  return {
    title: '保持记录',
    advice: [
      '今天的胎动记录很好',
      '继续保持每天数胎动的习惯',
      '如有任何异常，及时咨询医生'
    ]
  };
}

/**
 * 判断是否是同一天
 * @param {Date} date1 - 日期1
 * @param {Date} date2 - 日期2
 * @returns {boolean}
 */
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

export default {
  analyzeFetalMovement,
  compareWithYesterday,
  getMovementAdvice
};
