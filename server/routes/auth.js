import express from 'express';
import bcrypt from 'bcryptjs';
import { userOperations } from '../db.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;

    if (!username || !password || !displayName) {
      return res.status(400).json({ error: '请填写所有字段' });
    }

    // 检查用户是否已存在
    const existingUser = userOperations.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const user = userOperations.create(username, passwordHash, displayName);

    const token = generateToken({
      id: user.id,
      username: user.username
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name
      },
      token
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请填写用户名和密码' });
    }

    // 查找用户
    const user = userOperations.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = generateToken({
      id: user.id,
      username: user.username
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name
      },
      token
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

export default router;
