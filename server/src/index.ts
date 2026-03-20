import { GuildServer } from './GuildServer';
import express from 'express';
import path from 'path';
import { createServer } from 'http';
import { JoinGuildPayload } from './types';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const UI_PORT = process.env.UI_PORT ? parseInt(process.env.UI_PORT) : 3001;
const BIND_HOST = process.env.BIND_HOST || '0.0.0.0';
const NETWORK_HOST = process.env.NETWORK_HOST || 'localhost';

// 创建 Express 应用（用于静态文件服务）
const app = express();
const httpServer = createServer(app);
const guildServer = new GuildServer(PORT, BIND_HOST, NETWORK_HOST);

app.use(express.json());

app.get('/api/recruitment-book', (_req, res) => {
  res.json(guildServer.getRecruitmentBookPacket());
});

app.get('/api/guild-snapshot', (_req, res) => {
  res.json(guildServer.getGuildSnapshot());
});

app.post('/api/agent/join', (req, res) => {
  const payload = req.body as JoinGuildPayload;

  if (!payload?.agent?.displayName || !Array.isArray(payload.agent.capabilities)) {
    res.status(400).json({
      error: 'INVALID_JOIN_PAYLOAD',
      message: 'agent.displayName and agent.capabilities are required',
    });
    return;
  }

  const result = guildServer.joinGuildFromApi(payload);
  res.status(201).json(result);
});

// 静态文件服务 - 提供前端构建产物
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// SPA 路由 - 所有路由都返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// 启动 HTTP 服务器（前端）
httpServer.listen(UI_PORT, BIND_HOST, () => {
  console.log(`🎨 UI Server bound on http://${BIND_HOST}:${UI_PORT}`);
  console.log(`🎨 Local UI: http://localhost:${UI_PORT}`);
  console.log(`🎨 Network UI: http://${NETWORK_HOST}:${UI_PORT}`);
  console.log(`📜 Recruitment API: http://${NETWORK_HOST}:${UI_PORT}/api/recruitment-book`);
  console.log(`🪪 Agent Join API: http://${NETWORK_HOST}:${UI_PORT}/api/agent/join`);
});

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
console.log(`🎨 UI: http://${NETWORK_HOST}:${UI_PORT}`);
console.log(`📡 WebSocket: ws://${NETWORK_HOST}:${PORT}`);
