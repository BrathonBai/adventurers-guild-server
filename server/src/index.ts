import { GuildServer } from './GuildServer';
import express from 'express';
import path from 'path';
import { createServer } from 'http';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const UI_PORT = process.env.UI_PORT ? parseInt(process.env.UI_PORT) : 5173;

// 创建 Express 应用（用于静态文件服务）
const app = express();
const httpServer = createServer(app);

// 静态文件服务 - 提供前端构建产物
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// SPA 路由 - 所有路由都返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// 启动 HTTP 服务器（前端）
httpServer.listen(UI_PORT, () => {
  console.log(`🎨 UI Server running at http://localhost:${UI_PORT}`);
});

// 启动 WebSocket 服务器（后端）
const guildServer = new GuildServer(PORT);

// 优雅关闭
const shutdown = () => {
  console.log('\n👋 Shutting down gracefully...');
  guildServer.close();
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('🚀 Adventurer\'s Guild Server is ready!');
console.log(`🎨 UI: http://localhost:${UI_PORT}`);
console.log(`📡 WebSocket: ws://localhost:${PORT}`);
