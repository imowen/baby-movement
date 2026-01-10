# 快速开始指南 🚀

## 本地开发运行

### 1. 启动开发服务器

```bash
npm run dev
```

这会同时启动：
- 🎨 前端：http://localhost:5173
- 🔧 后端：http://localhost:3000

### 2. 访问应用

在浏览器中打开：**http://localhost:5173**

### 3. 注册账号

第一次使用需要注册账号：
- 用户名：如 `daddy` 或 `mommy`
- 密码：设置一个安全的密码
- 昵称：如 `爸爸` 或 `妈妈`

建议你和老婆各注册一个账号，这样双方都能记录和查看。

### 4. 开始记录

点击大大的 **"感受到了"** 按钮，选择：
- 强度：轻微 / 明显 / 强烈
- 类型：踢腿 / 翻身 / 打嗝 / 推肚子 / 伸懒腰 / 其他
- 备注（可选）

### 5. 查看统计

点击底部的 📊 统计按钮，查看：
- 每日胎动趋势图
- 强度和类型分布
- 历史记录

## VPS 部署

### 准备工作

1. 一台 VPS（Ubuntu/Debian）
2. Node.js 20+ 已安装
3. 域名（可选，可以用 IP 访问）

### 快速部署脚本

```bash
# 1. 上传代码到 VPS
scp -r baby-movement-tracker user@your-vps:/home/user/

# 2. 登录 VPS
ssh user@your-vps

# 3. 进入项目目录
cd baby-movement-tracker

# 4. 安装依赖
npm install

# 5. 构建前端
npm run build

# 6. 配置环境变量
cp .env.example .env
nano .env  # 修改配置

# 7. 安装 PM2
npm install -g pm2

# 8. 启动应用
pm2 start server/server.js --name baby-tracker
pm2 save
pm2 startup  # 设置开机自启

# 9. 查看运行状态
pm2 status
pm2 logs baby-tracker
```

### 配置 Nginx（可选）

如果想通过域名访问：

```bash
# 安装 Nginx
sudo apt-get install nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/baby-tracker

# 粘贴以下内容：
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

# 启用站点
sudo ln -s /etc/nginx/sites-available/baby-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 配置 HTTPS（推荐）

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 手机访问

### 添加到主屏幕

**iOS (Safari):**
1. 访问应用网址
2. 点击底部分享按钮
3. 选择"添加到主屏幕"
4. 点击"添加"

**Android (Chrome):**
1. 访问应用网址
2. 点击菜单（三个点）
3. 选择"添加到主屏幕"
4. 点击"添加"

添加后，应用图标会出现在手机桌面，打开就像原生 App 一样！

## 数据管理

### 备份数据

```bash
# 创建备份目录
mkdir -p backups

# 备份数据库
cp server/db.json backups/db-$(date +%Y%m%d).json
```

### 定时备份（可选）

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨2点备份）
0 2 * * * cd /path/to/baby-movement-tracker && cp server/db.json backups/db-$(date +\%Y\%m\%d).json
```

### 导出数据给医生

数据库文件 `server/db.json` 是纯文本 JSON 格式，可以直接：
- 复制内容发给医生
- 或者在应用中查看统计图表截图

## 常见问题

### 端口被占用

修改 `.env` 文件中的端口：
```
PORT=3001  # 改成其他端口
```

### 忘记密码

编辑 `server/db.json`，删除对应的用户记录，然后重新注册。

### 无法访问

检查：
1. 服务是否运行：`pm2 status`
2. 端口是否开放：`sudo ufw allow 3000`
3. 防火墙设置

### 数据丢失怎么办

如果有备份：
```bash
cp backups/db-20240115.json server/db.json
pm2 restart baby-tracker
```

## 更新孕周显示

编辑 `client/src/views/Home.vue`：

```javascript
// 找到这一行（约第9行）
<p class="text-sm text-gray-500 mt-1">第21周 · {{ currentDate }}</p>

// 修改为当前孕周
<p class="text-sm text-gray-500 mt-1">第22周 · {{ currentDate }}</p>
```

然后重新构建：
```bash
npm run build
pm2 restart baby-tracker
```

## 下一步

✅ 应用已经可以使用了！
🎯 建议每次感受到胎动就立即记录
📊 每天查看统计，了解宝宝的活动规律
💕 和老婆分享记录，一起期待宝宝的到来

有问题随时问我！
