#!/bin/bash

# 宝宝胎动记录应用 - VPS 部署脚本
# 使用方法：bash deploy-to-vps.sh

set -e  # 遇到错误立即退出

echo "🤰 开始部署宝宝胎动记录应用..."
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js 20+"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 安装依赖
echo ""
echo "📦 安装依赖..."
npm install

# 构建前端
echo ""
echo "🔨 构建前端..."
npm run build

# 检查构建结果
if [ ! -d "dist" ]; then
    echo "❌ 构建失败，未找到 dist 目录"
    exit 1
fi

echo "✅ 前端构建完成"

# 配置环境变量
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 配置环境变量..."
    cp .env.example .env

    # 生成随机 JWT 密钥
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

    # 替换配置
    sed -i "s/请替换为随机生成的密钥/${JWT_SECRET}/" .env

    echo "✅ 环境变量配置完成"
    echo "⚠️  请检查 .env 文件并根据需要调整配置"
else
    echo ""
    echo "✅ 环境变量文件已存在"
fi

# 检查 PM2
echo ""
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    sudo npm install -g pm2
fi

echo "✅ PM2 版本: $(pm2 -v)"

# 停止旧进程
echo ""
echo "🔄 检查是否有旧进程..."
pm2 delete baby-tracker 2>/dev/null || echo "没有旧进程需要停止"

# 启动应用
echo ""
echo "🚀 启动应用..."
pm2 start server/server.js --name baby-tracker

# 保存进程列表
pm2 save

# 设置开机自启（仅第一次需要）
echo ""
echo "⚙️  配置开机自启..."
pm2 startup || echo "请手动运行上面的命令配置开机自启"

# 显示状态
echo ""
echo "📊 应用状态："
pm2 status

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 后续步骤："
echo "1. 配置 Caddy（参考 Caddyfile）"
echo "2. 访问应用测试"
echo "3. 查看日志：pm2 logs baby-tracker"
echo ""
echo "🔧 常用命令："
echo "  pm2 restart baby-tracker  # 重启应用"
echo "  pm2 stop baby-tracker      # 停止应用"
echo "  pm2 logs baby-tracker      # 查看日志"
echo "  pm2 monit                  # 监控面板"
