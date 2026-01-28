import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import movementsRoutes from './routes/movements.js';
import settingsRoutes from './routes/settings.js';
import pregnancyRoutes from './routes/pregnancy.js';
import photosRoutes from './routes/photos.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件：提供上传的照片访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/movements', movementsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/pregnancy', pregnancyRoutes);
app.use('/api/photos', photosRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '宝宝胎动记录服务运行中 💕' });
});

// 生产环境：提供静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('*', (req, res) => {
    res.sendFile(new URL('../dist/index.html', import.meta.url).pathname);
  });
}

app.listen(PORT, () => {
  console.log(`🤰 服务器运行在端口 ${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
});
