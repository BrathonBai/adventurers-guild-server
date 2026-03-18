#!/bin/bash

# 冒险家协会 - 一键启动脚本
# Adventurer's Guild - One-Click Start Script

set -e

echo "🌌 冒险家协会 - 启动中..."
echo "Adventurer's Guild - Starting..."
echo ""

# 检查 Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ 错误: 需要 Node.js 18 或更高版本"
  echo "❌ Error: Node.js 18 or higher is required"
  echo "当前版本 / Current version: $(node -v)"
  exit 1
fi

echo "✅ Node.js 版本检查通过: $(node -v)"
echo ""

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
  echo "📦 安装前端依赖..."
  echo "📦 Installing frontend dependencies..."
  npm install
  echo ""
fi

if [ ! -d "server/node_modules" ]; then
  echo "📦 安装后端依赖..."
  echo "📦 Installing backend dependencies..."
  cd server && npm install && cd ..
  echo ""
fi

# 构建前端
echo "🔨 构建前端..."
echo "🔨 Building frontend..."
npm run build
echo ""

# 构建后端
echo "🔨 构建后端..."
echo "🔨 Building backend..."
cd server && npm run build && cd ..
echo ""

# 启动服务器
echo "🚀 启动服务器..."
echo "🚀 Starting server..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 前端 UI: http://localhost:5173"
echo "📡 WebSocket: ws://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "Press Ctrl+C to stop the server"
echo ""

cd server && npm start
