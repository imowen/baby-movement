import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import movementsRoutes from './routes/movements.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/movements', movementsRoutes);

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
