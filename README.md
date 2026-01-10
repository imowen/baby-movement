# 宝宝胎动记录应用 👶💕

一个温馨可爱的胎动记录 Web 应用，帮助准父母记录和分析宝宝的胎动情况。

## 功能特点

✨ **快速记录**
- 大按钮一键记录胎动
- 选择强度（轻微/明显/强烈）
- 预设标签（踢腿/翻身/打嗝等）
- 添加备注

📊 **数据统计**
- 今日统计和历史趋势
- 每日胎动曲线图
- 强度和类型分布分析
- 平均间隔计算

🎨 **温馨界面**
- 粉色系温馨设计
- 响应式布局，手机平板都适配
- 流畅的动画效果
- 可爱的 Emoji 图标

👥 **多用户支持**
- 夫妻双方可各自注册账号
- 数据实时同步
- 共同查看记录

## 技术栈

**前端：**
- Vue 3 - 渐进式 JavaScript 框架
- Tailwind CSS - 实用优先的 CSS 框架
- Chart.js - 数据可视化
- Vite - 快速构建工具

**后端：**
- Node.js + Express - Web 服务器
- Lowdb - 轻量级 JSON 数据库
- JWT - 用户认证

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置你的配置
```

### 3. 开发模式运行

```bash
npm run dev
```

这会同时启动：
- 前端开发服务器：http://localhost:5173
- 后端 API 服务器：http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
```

### 5. 生产环境运行

```bash
NODE_ENV=production npm start
```

## VPS 部署指南

### 方式一：使用 PM2（推荐）

```bash
# 1. 在 VPS 上安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 安装 PM2
npm install -g pm2

# 3. 克隆代码并安装依赖
git clone <你的仓库地址>
cd baby-movement-tracker
npm install

# 4. 构建前端
npm run build

# 5. 设置环境变量
cp .env.example .env
nano .env  # 编辑配置

# 6. 启动应用
pm2 start server/server.js --name baby-tracker
pm2 save
pm2 startup  # 设置开机自启

# 7. 查看日志
pm2 logs baby-tracker
```

### 方式二：使用 Nginx 反向代理

```nginx
# /etc/nginx/sites-available/baby-tracker
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 配置 HTTPS（推荐）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 数据备份

数据库文件位于 `server/db.json`（JSON 格式）

### 定期备份

```bash
# 创建备份目录
mkdir -p backups

# 手动备份
cp server/db.json backups/db-$(date +%Y%m%d).json

# 设置定时备份（crontab）
0 2 * * * cd /path/to/baby-movement-tracker && cp server/db.json backups/db-$(date +\%Y\%m\%d).json
```

### 恢复备份

```bash
cp backups/db-20240115.json server/db.json
pm2 restart baby-tracker
```

## 目录结构

```
baby-movement-tracker/
├── client/              # 前端代码
│   ├── src/
│   │   ├── components/  # Vue 组件
│   │   ├── views/       # 页面视图
│   │   ├── api.js       # API 接口
│   │   └── main.js      # 入口文件
│   └── index.html
├── server/              # 后端代码
│   ├── routes/          # API 路由
│   ├── middleware/      # 中间件
│   ├── db.js            # 数据库配置
│   └── server.js        # 服务器入口
├── package.json
└── vite.config.js
```

## 常见问题

### 端口被占用

修改 `.env` 文件中的 `PORT` 配置

### 数据库权限问题

```bash
chmod 644 server/db.json
chmod 755 server/
```

### 忘记密码

可以通过直接编辑 `server/db.json` 文件，删除对应用户后重新注册。或者使用以下命令：

```bash
# 备份当前数据
cp server/db.json server/db.backup.json

# 编辑 db.json，手动删除 users 数组中的对应用户
nano server/db.json

# 然后重新注册
```

## 开发说明

### 添加新的胎动类型

编辑 `client/src/views/Home.vue`，修改 `tagOptions` 数组

### 修改颜色主题

编辑 `tailwind.config.js` 中的颜色配置

### 修改孕周显示

编辑 `client/src/views/Home.vue`，修改头部的 "第21周" 文字

## 许可证

MIT License

---

用 ❤️ 为宝宝打造
