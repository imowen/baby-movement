import express from 'express';
import multer from 'multer';
import { authenticateToken as auth } from '../middleware/auth.js';
import { getDb } from '../db.js';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/pregnancy-photos'));
  },
  filename: (req, file, cb) => {
    const userId = req.user.id;
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    // 使用时间戳作为主要标识，避免req.body未解析的问题
    cb(null, `user${userId}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPG、PNG、WebP 格式的图片'));
    }
  }
});

/**
 * POST /api/photos/upload
 * 上传孕照
 */
router.post('/upload', auth, upload.single('photo'), async (req, res) => {
  try {
    const { week, type = 'main' } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的照片' });
    }

    if (!week || week < 1 || week > 40) {
      return res.status(400).json({ error: '孕周必须在1-40之间' });
    }

    if (!['main', 'additional'].includes(type)) {
      return res.status(400).json({ error: '照片类型错误' });
    }

    const db = getDb();

    // 检查该周的照片数量
    const weekPhotos = db.data.pregnancyPhotos?.filter(
      p => p.userId === userId && p.week === parseInt(week)
    ) || [];

    // 如果是主照片，检查是否已存在
    if (type === 'main') {
      const existingMain = weekPhotos.find(p => p.type === 'main');
      if (existingMain) {
        // 删除旧的主照片文件
        const oldFilePath = path.join(__dirname, '../uploads/pregnancy-photos', existingMain.filename);
        if (existsSync(oldFilePath)) {
          await unlink(oldFilePath);
        }
        // 从数据库中删除
        db.data.pregnancyPhotos = db.data.pregnancyPhotos.filter(p => p.id !== existingMain.id);
      }
    } else {
      // 辅助照片最多2张
      const additionalPhotos = weekPhotos.filter(p => p.type === 'additional');
      if (additionalPhotos.length >= 2) {
        return res.status(400).json({ error: '每周最多只能上传2张辅助照片' });
      }
    }

    // 初始化pregnancyPhotos数组
    if (!db.data.pregnancyPhotos) {
      db.data.pregnancyPhotos = [];
    }

    // 创建照片记录
    const photo = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      week: parseInt(week),
      type,
      filename: req.file.filename,
      url: `/uploads/pregnancy-photos/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadDate: new Date().toISOString()
    };

    db.data.pregnancyPhotos.push(photo);
    await db.write();

    res.json({
      message: '照片上传成功',
      photo
    });
  } catch (error) {
    console.error('上传照片失败:', error);
    // 如果出错，删除已上传的文件
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/pregnancy-photos', req.file.filename);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    }
    res.status(500).json({ error: error.message || '上传失败' });
  }
});

/**
 * GET /api/photos/week/:weekNumber
 * 获取指定周的照片
 */
router.get('/week/:weekNumber', auth, (req, res) => {
  try {
    const weekNumber = parseInt(req.params.weekNumber);
    const userId = req.user.id;

    if (weekNumber < 1 || weekNumber > 40) {
      return res.status(400).json({ error: '孕周必须在1-40之间' });
    }

    const db = getDb();
    const photos = db.data.pregnancyPhotos?.filter(
      p => p.userId === userId && p.week === weekNumber
    ) || [];

    // 分类照片
    const mainPhoto = photos.find(p => p.type === 'main');
    const additionalPhotos = photos.filter(p => p.type === 'additional');

    res.json({
      week: weekNumber,
      mainPhoto: mainPhoto || null,
      additionalPhotos,
      totalCount: photos.length
    });
  } catch (error) {
    console.error('获取照片失败:', error);
    res.status(500).json({ error: '获取照片失败' });
  }
});

/**
 * GET /api/photos/timeline
 * 获取所有周的照片时间线
 */
router.get('/timeline', auth, (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDb();

    const userPhotos = db.data.pregnancyPhotos?.filter(
      p => p.userId === userId
    ) || [];

    // 按周分组
    const timeline = [];
    for (let week = 1; week <= 40; week++) {
      const weekPhotos = userPhotos.filter(p => p.week === week);
      const mainPhoto = weekPhotos.find(p => p.type === 'main');
      const additionalCount = weekPhotos.filter(p => p.type === 'additional').length;

      timeline.push({
        week,
        hasPhotos: weekPhotos.length > 0,
        mainPhoto: mainPhoto || null,
        additionalCount,
        totalCount: weekPhotos.length
      });
    }

    res.json({ timeline });
  } catch (error) {
    console.error('获取时间线失败:', error);
    res.status(500).json({ error: '获取时间线失败' });
  }
});

/**
 * DELETE /api/photos/:photoId
 * 删除照片
 */
router.delete('/:photoId', auth, async (req, res) => {
  try {
    const { photoId } = req.params;
    const userId = req.user.id;
    const db = getDb();

    const photo = db.data.pregnancyPhotos?.find(
      p => p.id === photoId && p.userId === userId
    );

    if (!photo) {
      return res.status(404).json({ error: '照片不存在' });
    }

    // 删除文件
    const filePath = path.join(__dirname, '../uploads/pregnancy-photos', photo.filename);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    // 从数据库删除
    db.data.pregnancyPhotos = db.data.pregnancyPhotos.filter(p => p.id !== photoId);
    await db.write();

    res.json({ message: '照片删除成功' });
  } catch (error) {
    console.error('删除照片失败:', error);
    res.status(500).json({ error: '删除照片失败' });
  }
});

export default router;
