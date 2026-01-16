import express from 'express';
import { authenticateToken as auth } from '../middleware/auth.js';
import { getDb, settingsOperations } from '../db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  calculateGestationalAge,
  calculateGestationalAgeFromEDD,
  shouldMonitorFetalMovement,
  getCheckupInfo,
  validatePregnancyDate
} from '../utils/pregnancyCalculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pregnancyData = JSON.parse(
  readFileSync(join(__dirname, '../data/pregnancy-info.json'), 'utf-8')
);

const router = express.Router();

/**
 * GET /api/pregnancy/info
 * 获取当前孕周信息和胎儿发育数据
 */
router.get('/info', auth, async (req, res) => {
  try {
    const db = getDb();
    const user = db.data.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 同步settings中的预产期(如果用户没有设置edd但settings有dueDate)
    const settings = settingsOperations.get();
    if (settings.dueDate && !user.edd && !user.lmp) {
      user.edd = settings.dueDate;
      await db.write();
    }

    // 检查用户是否设置了孕期信息
    if (!user.lmp && !user.edd) {
      return res.json({
        hasPregnancyInfo: false,
        message: '请先设置末次月经或预产期'
      });
    }

    // 计算孕周
    let gestationalAge;
    if (user.lmp) {
      gestationalAge = calculateGestationalAge(new Date(user.lmp));
    } else if (user.edd) {
      gestationalAge = calculateGestationalAgeFromEDD(new Date(user.edd));
    }

    if (!gestationalAge.isValid) {
      return res.status(400).json({
        error: '孕周数据异常，请检查末次月经或预产期设置'
      });
    }

    // 获取当前周的发育信息
    const currentWeek = Math.min(Math.max(gestationalAge.weeks, 1), 40); // 限制在1-40周
    const weekData = pregnancyData.weeklyDevelopment[currentWeek.toString()];

    // 获取胎动监测建议
    const movementMonitoring = shouldMonitorFetalMovement(
      gestationalAge.weeks,
      user.isHighRisk || false
    );

    // 获取产检信息
    const checkupInfo = getCheckupInfo(gestationalAge.weeks);

    res.json({
      hasPregnancyInfo: true,
      gestationalAge: {
        weeks: gestationalAge.weeks,
        days: gestationalAge.days,
        formatted: gestationalAge.formattedWeeks,
        trimester: gestationalAge.trimester,
        totalDays: gestationalAge.totalDays
      },
      edd: gestationalAge.edd,
      daysUntilEDD: gestationalAge.daysUntilEDD,
      currentWeekData: weekData,
      fetalMovementStandards: pregnancyData.fetalMovementStandards,
      movementMonitoring,
      checkupInfo,
      nutritionGuidelines: pregnancyData.nutritionGuidelines
    });
  } catch (error) {
    console.error('获取孕期信息失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * POST /api/pregnancy/setup
 * 设置孕期信息（末次月经或预产期）
 */
router.post('/setup', auth, async (req, res) => {
  try {
    const { lmp, edd, isHighRisk } = req.body;

    // 至少需要提供一个日期
    if (!lmp && !edd) {
      return res.status(400).json({ error: '请提供末次月经或预产期' });
    }

    // 验证日期
    if (lmp) {
      const validation = validatePregnancyDate(lmp, 'lmp');
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.message });
      }
    }

    if (edd) {
      const validation = validatePregnancyDate(edd, 'edd');
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.message });
      }
    }

    const db = getDb();
    const user = db.data.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 更新用户信息
    if (lmp) user.lmp = lmp;
    if (edd) user.edd = edd;
    if (typeof isHighRisk !== 'undefined') user.isHighRisk = isHighRisk;

    // 同步预产期到settings,保持两个系统数据一致
    if (edd) {
      settingsOperations.setDueDate(edd);
    }

    await db.write();

    // 返回计算结果
    let gestationalAge;
    if (user.lmp) {
      gestationalAge = calculateGestationalAge(new Date(user.lmp));
    } else {
      gestationalAge = calculateGestationalAgeFromEDD(new Date(user.edd));
    }

    res.json({
      message: '孕期信息设置成功',
      gestationalAge: {
        weeks: gestationalAge.weeks,
        days: gestationalAge.days,
        formatted: gestationalAge.formattedWeeks,
        trimester: gestationalAge.trimester
      },
      edd: gestationalAge.edd
    });
  } catch (error) {
    console.error('设置孕期信息失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * GET /api/pregnancy/week/:weekNumber
 * 获取指定孕周的发育信息
 */
router.get('/week/:weekNumber', auth, (req, res) => {
  try {
    const weekNumber = parseInt(req.params.weekNumber);

    if (weekNumber < 1 || weekNumber > 40) {
      return res.status(400).json({
        error: '周数必须在1-40之间'
      });
    }

    const weekData = pregnancyData.weeklyDevelopment[weekNumber.toString()];

    if (!weekData) {
      return res.status(404).json({
        error: '未找到该周的数据'
      });
    }

    res.json({
      week: weekNumber,
      data: weekData
    });
  } catch (error) {
    console.error('获取孕周数据失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * GET /api/pregnancy/standards
 * 获取胎动监测标准
 */
router.get('/standards', auth, (req, res) => {
  try {
    res.json({
      fetalMovementStandards: pregnancyData.fetalMovementStandards,
      checkupSchedule: pregnancyData.checkupSchedule,
      nutritionGuidelines: pregnancyData.nutritionGuidelines,
      metadata: pregnancyData.metadata
    });
  } catch (error) {
    console.error('获取标准数据失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * GET /api/pregnancy/timeline
 * 获取完整的孕期时间线（1-40周概览）
 */
router.get('/timeline', auth, (req, res) => {
  try {
    const timeline = [];

    for (let week = 1; week <= 40; week++) {
      const weekData = pregnancyData.weeklyDevelopment[week.toString()];
      if (weekData) {
        timeline.push({
          week,
          trimester: weekData.trimester,
          length: weekData.fetal.length,
          weight: weekData.fetal.weight,
          sizeComparison: weekData.fetal.sizeComparison,
          keyHighlight: weekData.fetal.highlights[0] // 只取第一个亮点
        });
      }
    }

    res.json({ timeline });
  } catch (error) {
    console.error('获取时间线失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
