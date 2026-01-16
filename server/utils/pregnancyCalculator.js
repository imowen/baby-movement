/**
 * 孕周计算工具
 * 基于末次月经(LMP)或预产期(EDD)计算当前孕周
 */

/**
 * 根据末次月经计算预产期
 * 使用内格勒计算法：LMP + 280天
 * @param {Date} lmp - 末次月经第一天
 * @returns {Date} 预产期
 */
function calculateEDD(lmp) {
  const edd = new Date(lmp);
  edd.setDate(edd.getDate() + 280);
  return edd;
}

/**
 * 根据预产期计算末次月经
 * @param {Date} edd - 预产期
 * @returns {Date} 末次月经第一天
 */
function calculateLMP(edd) {
  const lmp = new Date(edd);
  lmp.setDate(lmp.getDate() - 280);
  return lmp;
}

/**
 * 计算当前孕周和天数
 * @param {Date} lmp - 末次月经第一天
 * @param {Date} currentDate - 当前日期（默认为今天）
 * @returns {Object} { weeks, days, totalDays, trimester, edd }
 */
function calculateGestationalAge(lmp, currentDate = new Date()) {
  const lmpDate = new Date(lmp);
  const current = new Date(currentDate);

  // 计算天数差
  const diffTime = current - lmpDate;
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 计算周数和剩余天数
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  // 计算孕期（第几个三月期）
  let trimester;
  if (weeks < 14) {
    trimester = 1;
  } else if (weeks < 28) {
    trimester = 2;
  } else {
    trimester = 3;
  }

  // 计算预产期
  const edd = calculateEDD(lmpDate);

  // 计算距离预产期还有多少天
  const daysUntilEDD = Math.floor((edd - current) / (1000 * 60 * 60 * 24));

  return {
    weeks,
    days,
    totalDays,
    trimester,
    edd,
    daysUntilEDD,
    formattedWeeks: `${weeks}周${days}天`,
    isValid: weeks >= 0 && weeks <= 42 // 有效孕周范围
  };
}

/**
 * 根据预产期计算当前孕周
 * @param {Date} edd - 预产期
 * @param {Date} currentDate - 当前日期（默认为今天）
 * @returns {Object} 同calculateGestationalAge
 */
function calculateGestationalAgeFromEDD(edd, currentDate = new Date()) {
  const lmp = calculateLMP(edd);
  return calculateGestationalAge(lmp, currentDate);
}

/**
 * 判断是否应该开始胎动监测
 * @param {number} weeks - 当前孕周
 * @param {boolean} isHighRisk - 是否高危孕妇
 * @returns {Object} { shouldMonitor, reason }
 */
function shouldMonitorFetalMovement(weeks, isHighRisk = false) {
  if (isHighRisk && weeks >= 26) {
    return {
      shouldMonitor: true,
      reason: '高危孕妇建议从26周开始监测胎动'
    };
  }

  if (weeks >= 28) {
    return {
      shouldMonitor: true,
      reason: '所有孕妇从28周开始应该每天数胎动'
    };
  }

  return {
    shouldMonitor: false,
    reason: weeks < 26 ? '26周前可以不用正式数胎动' : '28周前一般孕妇可以观察但不必每天计数'
  };
}

/**
 * 获取当前孕周的推荐产检项目
 * @param {number} weeks - 当前孕周
 * @returns {Object} 产检信息
 */
function getCheckupInfo(weeks) {
  if (weeks < 6) {
    return { period: '孕早期', frequency: '尚未建档', items: ['确认怀孕后尽快就医'] };
  } else if (weeks <= 13) {
    return {
      period: '6-13+6周',
      frequency: '初次产检，建档',
      items: ['确认宫内孕', '核对孕周', '评估风险', '建立孕期保健手册']
    };
  } else if (weeks <= 19) {
    return {
      period: '14-19+6周',
      frequency: '每4周一次',
      items: ['常规检查', '唐氏筛查（15-20周）']
    };
  } else if (weeks <= 24) {
    return {
      period: '20-24周',
      frequency: '每4周一次',
      items: ['大排畸超声（18-24周最佳）', '常规检查']
    };
  } else if (weeks <= 28) {
    return {
      period: '24-28周',
      frequency: '每4周一次',
      items: ['糖筛（24-28周）', '常规检查']
    };
  } else if (weeks <= 36) {
    return {
      period: '28-36周',
      frequency: '每2周一次',
      items: ['常规检查', '胎心监护', '评估胎位']
    };
  } else {
    return {
      period: '36-40周',
      frequency: '每周一次',
      items: ['常规检查', '胎心监护', '评估分娩方式', 'B超评估']
    };
  }
}

/**
 * 验证日期是否合理
 * @param {Date} date - 要验证的日期
 * @param {string} type - 日期类型（'lmp' 或 'edd'）
 * @returns {Object} { isValid, message }
 */
function validatePregnancyDate(date, type = 'lmp') {
  const now = new Date();
  const inputDate = new Date(date);

  if (type === 'lmp') {
    // 末次月经不能在未来
    if (inputDate > now) {
      return { isValid: false, message: '末次月经日期不能是未来日期' };
    }

    // 末次月经不能超过44周前（超过预产期4周）
    const maxLMP = new Date(now);
    maxLMP.setDate(maxLMP.getDate() - 308); // 44周
    if (inputDate < maxLMP) {
      return { isValid: false, message: '末次月经日期过早，请检查输入' };
    }

    return { isValid: true, message: '日期有效' };
  }

  if (type === 'edd') {
    // 预产期必须在未来
    if (inputDate <= now) {
      return { isValid: false, message: '预产期必须是未来日期' };
    }

    // 预产期不能太远（超过280天）
    const maxEDD = new Date(now);
    maxEDD.setDate(maxEDD.getDate() + 280);
    if (inputDate > maxEDD) {
      return { isValid: false, message: '预产期日期过晚，请检查输入' };
    }

    return { isValid: true, message: '日期有效' };
  }

  return { isValid: false, message: '未知的日期类型' };
}

export {
  calculateEDD,
  calculateLMP,
  calculateGestationalAge,
  calculateGestationalAgeFromEDD,
  shouldMonitorFetalMovement,
  getCheckupInfo,
  validatePregnancyDate
};
