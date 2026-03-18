# 冒险者协会 - 完整部署指南

## 项目结构

```
adventurers-guild/
├── ui/                    # 前端源代码（React + Vite）
├── server/                # 后端服务器（WebSocket + Express）
├── dist/                  # 前端构建产物（自动生成）
├── package.json           # 根项目配置
└── vite.config.ts         # Vite 构建配置
```

## 快速开始

### 1. 安装依赖

```bash
# 根目录安装前端依赖
npm install

# 服务器目录安装后端依赖
cd server
npm install
cd ..
```

### 2. 开发模式

**方式一：分离运行（推荐开发时使用）**

```bash
# 终端 1：启动前端开发服务器（热重载）
npm run dev
# 访问 http://localhost:5173

# 终端 2：启动 WebSocket 服务器
cd server
npm run dev
# WebSocket: ws://localhost:3000
```

**方式二：集成运行**

```bash
# 构建前端 + 启动完整服务器
npm run build
cd server
npm start
# UI: http://localhost:5173
# WebSocket: ws://localhost:3000
```

### 3. 生产部署

```bash
# 1. 构建前端
npm run build

# 2. 构建后端
cd server
npm run build

# 3. 启动服务器
npm start
```

## 环境变量

创建 `server/.env` 文件：

```env
PORT=3000          # WebSocket 端口
UI_PORT=5173       # UI 端口
NODE_ENV=production
```

## 端口说明

- **5173**: 前端 UI（开发模式由 Vite 提供，生产模式由 Express 提供）
- **3000**: WebSocket 服务器（Agent 连接）

## 构建产物

运行 `npm run build` 后，前端会构建到 `dist/` 目录：

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── ...
```

服务器会自动从 `dist/` 目录提供静态文件。

## 开发工作流

1. **前端开发**: 修改 `ui/` 下的文件，Vite 自动热重载
2. **后端开发**: 修改 `server/src/` 下的文件，重启 `npm run dev`
3. **测试集成**: 运行 `npm run build` 后启动服务器

## 部署到生产环境

### 使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 构建项目
npm run build
cd server
npm run build

# 启动服务
pm2 start dist/index.js --name adventurers-guild

# 查看日志
pm2 logs adventurers-guild

# 重启
pm2 restart adventurers-guild
```

### 使用 Docker

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY server/package*.json ./server/

# 安装依赖
RUN npm install
RUN cd server && npm install

# 复制源代码
COPY . .

# 构建
RUN npm run build
RUN cd server && npm run build

# 暴露端口
EXPOSE 3000 5173

# 启动
CMD ["node", "server/dist/index.js"]
```

```bash
# 构建镜像
docker build -t adventurers-guild .

# 运行容器
docker run -p 3000:3000 -p 5173:5173 adventurers-guild
```

## 故障排查

### 前端无法访问

1. 检查 `dist/` 目录是否存在
2. 运行 `npm run build` 重新构建
3. 检查服务器日志

### WebSocket 连接失败

1. 检查端口 3000 是否被占用
2. 检查防火墙设置
3. 查看服务器日志：`pm2 logs adventurers-guild`

### 构建失败

1. 删除 `node_modules` 和 `package-lock.json`
2. 重新安装：`npm install`
3. 检查 Node.js 版本（需要 >= 18）

## 更新日志

### 2026-03-18 - UI 升级到 2026 设计标准

- ✅ Deep Space Dark 主题
- ✅ 玻璃拟态 2.0 卡片
- ✅ 长条形任务卡片布局
- ✅ 鼠标跟随光晕效果
- ✅ 粒子爆炸动画
- ✅ 悬浮展开式用户徽章
- ✅ 完整中文汉化

---

**作者**: Brathon & ORION 🌌  
**许可证**: MIT
