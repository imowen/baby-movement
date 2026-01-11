import express from 'express';
import { settingsOperations } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取设置
router.get('/', (req, res) => {
  try {
    const settings = settingsOperations.get();
    res.json(settings);
  } catch (error) {
    console.error('获取设置错误:', error);
    res.status(500).json({ error: '获取设置失败' });
  }
});

// 设置预产期
router.post('/due-date', (req, res) => {
  try {
    const { dueDate } = req.body;

    if (!dueDate) {
      return res.status(400).json({ error: '请提供预产期' });
    }

    // 验证日期格式
    const date = new Date(dueDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: '预产期格式不正确' });
    }

    const settings = settingsOperations.setDueDate(dueDate);
    res.json(settings);
  } catch (error) {
    console.error('设置预产期错误:', error);
    res.status(500).json({ error: '设置失败' });
  }
});

export default router;
