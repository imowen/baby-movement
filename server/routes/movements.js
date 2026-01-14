import express from 'express';
import { movementOperations } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 记录胎动
router.post('/', (req, res) => {
  try {
    const { timestamp, intensity, tag, note } = req.body;
    const userId = req.user.id;

    if (!timestamp || !intensity || !tag) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const movement = movementOperations.create(userId, timestamp, intensity, tag, note);

    res.json(movement);
  } catch (error) {
    console.error('记录胎动错误:', error);
    res.status(500).json({ error: '记录失败' });
  }
});

// 获取记录列表（支持日期筛选）
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, limit = 50 } = req.query;

    const movements = movementOperations.findAll({
      userId,
      startDate,
      endDate,
      limit: parseInt(limit)
    });

    res.json(movements);
  } catch (error) {
    console.error('获取记录错误:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// 获取今日统计
router.get('/today-stats', (req, res) => {
  try {
    const userId = req.user.id;

    // 支持两种模式：
    // 1. 新模式：使用UTC日期范围（startDate, endDate）
    // 2. 旧模式：使用日期字符串（date） - 向后兼容

    if (req.query.startDate && req.query.endDate) {
      // 新模式：使用日期范围
      const stats = movementOperations.getTodayStats(
        { startDate: req.query.startDate, endDate: req.query.endDate },
        userId
      );
      res.json(stats);
    } else {
      // 旧模式：使用日期字符串（向后兼容）
      let today;
      if (req.query.date) {
        today = req.query.date;
      } else {
        // 回退到服务器本地时间
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        today = `${year}-${month}-${day}`;
      }

      const stats = movementOperations.getTodayStats(today, userId);
      res.json(stats);
    }
  } catch (error) {
    console.error('获取统计错误:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

// 获取历史统计（按天）
router.get('/daily-stats', (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30, timezone = 'auto' } = req.query;
    const stats = movementOperations.getDailyStats(parseInt(days), userId, timezone);

    res.json(stats);
  } catch (error) {
    console.error('获取历史统计错误:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

// 删除记录
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const movement = movementOperations.delete(parseInt(id), userId);

    if (!movement) {
      return res.status(404).json({ error: '记录不存在' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('删除记录错误:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

export default router;
