#!/bin/bash
# 宝宝胎动追踪 - VPS部署脚本

set -e  # 遇到错误立即退出

echo "🚀 开始更新部署..."

# 拉取最新代码
echo "📦 拉取最新代码..."
git pull origin main

# 安装依赖
echo "📚 安装依赖..."
npm install

# 构建前端
echo "🏗️  构建前端..."
cd client
npm install
npm run build
cd ..

# 重启服务(根据你的实际情况修改)
echo "🔄 重启服务..."
# 如果使用pm2:
pm2 restart baby-movement-server

# 或者使用systemd:
# sudo systemctl restart baby-movement

echo "✅ 部署完成!"
echo "🌐 请访问你的网站查看更新"
