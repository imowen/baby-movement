# VPS 部署指南（Caddy）

## 准备工作

### 1. 确认 VPS 环境

```bash
# 检查系统版本
lsb_release -a

# 检查 Node.js（需要 18+）
node -v

# 检查 Caddy
caddy version
```

### 2. 域名配置（可选）

如果使用域名，需要先在 DNS 提供商处添加 A 记录：

```
类型: A
主机记录: baby（或 @）
记录值: 你的VPS IP
TTL: 600
```

等待 DNS 生效（通常几分钟到几小时）。

---

## 快速部署

### 方式一：一键部署脚本（推荐）

```bash
# 1. 克隆代码
git clone https://github.com/imowen/baby-movement.git
cd baby-movement

# 2. 运行部署脚本
bash deploy-to-vps.sh

# 3. 检查应用状态
pm2 status
pm2 logs baby-movement
```

### 方式二：手动部署

```bash
# 1. 克隆代码
git clone https://github.com/imowen/baby-movement.git
cd baby-movement

# 2. 安装依赖
npm install

# 3. 构建前端
npm run build

# 4. 配置环境变量
cp .env.example .env

# 生成随机 JWT 密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 编辑 .env 文件，替换 JWT_SECRET
nano .env

# 5. 安装 PM2
sudo npm install -g pm2

# 6. 启动应用
pm2 start server/server.js --name baby-movement
pm2 save
pm2 startup

# 7. 查看状态
pm2 status
pm2 logs baby-movement
```

---

## Caddy 配置

### 1. 修改 Caddyfile

编辑项目中的 `Caddyfile`：

```bash
nano Caddyfile
```

**使用域名（推荐）：**

将 `baby.yourdomain.com` 替换为你的实际域名，其他保持不变。

**使用 IP 访问：**

注释掉域名配置，取消 IP 配置的注释：

```caddy
http://your-vps-ip {
    reverse_proxy localhost:3010
    encode gzip
}
```

### 2. 复制到 Caddy 配置目录

```bash
# 备份原配置（如果有）
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup

# 复制新配置
sudo cp Caddyfile /etc/caddy/Caddyfile

# 验证配置
sudo caddy validate --config /etc/caddy/Caddyfile

# 如果验证通过，重启 Caddy
sudo systemctl reload caddy
```

### 3. 查看 Caddy 日志

```bash
# 查看实时日志
sudo journalctl -u caddy -f

# 查看应用日志
sudo tail -f /var/log/caddy/baby-movement.log
```

---

## 配置防火墙

```bash
# 允许 HTTP 和 HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 查看防火墙状态
sudo ufw status
```

---

## 访问应用

**使用域名：**
- HTTP: `http://baby.yourdomain.com`（自动跳转到 HTTPS）
- HTTPS: `https://baby.yourdomain.com`

**使用 IP：**
- `http://your-vps-ip`

---

## 后续更新

### 从 GitHub 拉取更新

```bash
cd ~/baby-movement

# 拉取最新代码
git pull

# 重新构建
npm run build

# 重启应用
pm2 restart baby-movement

# 查看日志确认
pm2 logs baby-movement --lines 50
```

### 自动更新脚本（可选）

创建更新脚本：

```bash
nano ~/update-baby-movement.sh
```

内容：

```bash
#!/bin/bash
cd ~/baby-movement
git pull
npm install  # 如果有新依赖
npm run build
pm2 restart baby-movement
echo "✅ 更新完成！"
```

设置权限：

```bash
chmod +x ~/update-baby-movement.sh
```

使用：

```bash
bash ~/update-baby-movement.sh
```

---

## 数据备份

### 手动备份

```bash
cd ~/baby-movement
mkdir -p backups
cp server/db.json backups/db-$(date +%Y%m%d-%H%M%S).json
```

### 自动备份

编辑定时任务：

```bash
crontab -e
```

添加（每天凌晨 2 点备份）：

```bash
0 2 * * * cd ~/baby-movement && mkdir -p backups && cp server/db.json backups/db-$(date +\%Y\%m\%d-\%H\%M\%S).json
```

清理旧备份（保留 30 天）：

```bash
0 3 * * * find ~/baby-movement/backups -name "db-*.json" -mtime +30 -delete
```

---

## 监控和维护

### PM2 监控

```bash
# 实时监控
pm2 monit

# 查看详细信息
pm2 show baby-movement

# 查看日志
pm2 logs baby-movement

# 重启应用
pm2 restart baby-movement

# 停止应用
pm2 stop baby-movement
```

### 系统资源监控

```bash
# CPU 和内存使用
htop

# 磁盘使用
df -h

# 查看端口占用
sudo netstat -tlnp | grep 3010
```

---

## 常见问题

### 1. 端口被占用

```bash
# 查看占用 3010 端口的进程
sudo lsof -i :3010

# 或
sudo netstat -tlnp | grep 3010

# 杀死进程（替换 PID）
sudo kill -9 PID
```

### 2. Caddy 无法获取 SSL 证书

**原因：**
- DNS 未正确解析
- 防火墙未开放 80 端口
- 域名指向错误

**检查：**

```bash
# 检查 DNS
nslookup baby.yourdomain.com

# 检查 80 端口
sudo ufw status | grep 80

# 查看 Caddy 日志
sudo journalctl -u caddy -n 100
```

### 3. 应用无法启动

```bash
# 查看 PM2 日志
pm2 logs baby-movement --err

# 检查端口是否被占用
sudo lsof -i :3010

# 检查环境变量
cat .env

# 手动启动测试
NODE_ENV=production PORT=3010 node server/server.js
```

### 4. 数据库文件权限问题

```bash
# 确保正确的权限
cd ~/baby-movement
chmod 755 server/
chmod 644 server/db.json  # 如果文件存在

# 如果文件不存在，启动应用会自动创建
```

### 5. 更新后白屏

```bash
# 清除浏览器缓存
# 或使用隐私/无痕模式访问

# 检查构建是否成功
ls -la dist/

# 重新构建
npm run build
pm2 restart baby-movement
```

---

## 性能优化

### 1. 启用 Caddy 缓存

在 Caddyfile 中添加：

```caddy
baby.yourdomain.com {
    reverse_proxy localhost:3010

    # 静态文件缓存
    @static {
        path *.js *.css *.png *.jpg *.svg *.ico
    }
    header @static Cache-Control "public, max-age=31536000, immutable"

    encode gzip
}
```

### 2. PM2 集群模式（可选）

如果流量大，可以启用集群：

```bash
pm2 delete baby-movement
pm2 start server/server.js --name baby-movement -i 2
pm2 save
```

---

## 安全建议

1. **定期更新系统**

```bash
sudo apt update && sudo apt upgrade -y
```

2. **配置防火墙**

```bash
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
```

3. **定期备份数据**

4. **监控应用日志**

```bash
pm2 logs baby-movement
```

5. **更改默认 SSH 端口**（可选）

---

## 卸载

```bash
# 停止应用
pm2 delete baby-movement
pm2 save

# 删除代码
rm -rf ~/baby-movement

# 删除 Caddy 配置
sudo rm /etc/caddy/Caddyfile
sudo systemctl reload caddy

# 卸载 PM2（可选）
sudo npm uninstall -g pm2
```

---

需要帮助？查看主文档 README.md 或提交 Issue。
