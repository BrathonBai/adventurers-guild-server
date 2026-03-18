// Adventurer's Guild - Main App with Admin Dashboard
// 支持在任务大厅和管理员后台之间切换

import { useState } from 'react';
import { QuestBoard } from './components/QuestBoard';
import { AdminDashboard } from './components/AdminDashboard';
import { Quest, ReputationLevel, ExecutorType, RiskLevel, Adventurer } from '../types';

// 模拟数据
const mockQuests: Quest[] = [
  {
    id: 'quest-001',
    title: '开发 React 任务看板',
    description: '需要一个现代化的任务看板组件，支持拖拽排序、实时更新、响应式设计。要求使用 React + TypeScript + Tailwind CSS。',
    tags: ['react', 'typescript', 'ui', 'frontend'],
    reward: 3000,
    status: 'PUBLISHED' as any,
    targetExecutor: ExecutorType.AGENT,
    executor_type: ExecutorType.AGENT,
    required_skills: ['React', 'TypeScript', 'Tailwind CSS'],
    difficulty: 'B',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
    legalCheckResult: {
      is_approved: true,
      risk_level: RiskLevel.LOW,
      reasoning: '任务描述清晰，技术栈合理，无风险。',
      suggested_modifications: [],
      checked_at: new Date().toISOString(),
      checker_version: '1.0.0',
    },
    creatorId: 'user-001',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'quest-002',
    title: '数据分析与可视化',
    description: '分析电商平台的用户行为数据，生成可视化报告。需要使用 Python + Pandas + Matplotlib，输出 PDF 报告。',
    tags: ['python', 'data-analysis', 'visualization'],
    reward: 5000,
    status: 'PUBLISHED' as any,
    targetExecutor: ExecutorType.HYBRID,
    executor_type: ExecutorType.HYBRID,
    required_skills: ['Python', 'Pandas', 'Data Analysis'],
    difficulty: 'A',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14天后
    legalCheckResult: {
      is_approved: true,
      risk_level: RiskLevel.LOW,
      reasoning: '数据分析任务，合法合规。',
      suggested_modifications: [],
      checked_at: new Date().toISOString(),
      checker_version: '1.0.0',
    },
    creatorId: 'user-002',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'quest-003',
    title: 'API 接口开发',
    description: '为移动 App 开发 RESTful API，包含用户认证、数据 CRUD、文件上传等功能。使用 Node.js + Express + MongoDB。',
    tags: ['nodejs', 'api', 'backend', 'mongodb'],
    reward: 6000,
    status: 'PUBLISHED' as any,
    targetExecutor: ExecutorType.HUMAN,
    executor_type: ExecutorType.HUMAN,
    required_skills: ['Node.js', 'Express', 'MongoDB', 'REST API'],
    difficulty: 'A',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10天后
    creatorId: 'user-003',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'quest-004',
    title: '网站性能优化',
    description: '优化现有网站的加载速度和性能，包括代码分割、懒加载、CDN 配置、图片优化等。目标：首屏加载时间 < 2s。',
    tags: ['performance', 'optimization', 'webpack', 'frontend'],
    reward: 4000,
    status: 'PUBLISHED' as any,
    targetExecutor: ExecutorType.AGENT,
    executor_type: ExecutorType.AGENT,
    required_skills: ['Webpack', 'Performance', 'Frontend'],
    difficulty: 'C',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5天后
    legalCheckResult: {
      is_approved: true,
      risk_level: RiskLevel.LOW,
      reasoning: '性能优化任务，技术方案合理。',
      suggested_modifications: [],
      checked_at: new Date().toISOString(),
      checker_version: '1.0.0',
    },
    creatorId: 'user-004',
    assigneeId: 'adv-002',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'quest-005',
    title: '区块链智能合约开发',
    description: '开发一个 NFT 交易市场的智能合约，支持铸造、转让、拍卖等功能。使用 Solidity + Hardhat。',
    tags: ['blockchain', 'solidity', 'smart-contract', 'web3'],
    reward: 10000,
    status: 'PUBLISHED' as any,
    targetExecutor: ExecutorType.HUMAN,
    executor_type: ExecutorType.HUMAN,
    required_skills: ['Solidity', 'Smart Contract', 'Web3', 'Hardhat'],
    difficulty: 'S',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
    legalCheckResult: {
      is_approved: false,
      risk_level: RiskLevel.MEDIUM,
      reasoning: '区块链项目需要确保合规性，建议提供更多项目背景信息。',
      suggested_modifications: ['提供项目白皮书', '说明合规性审查情况'],
      checked_at: new Date().toISOString(),
      checker_version: '1.0.0',
    },
    creatorId: 'user-005',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'quest-006',
    title: 'AI 聊天机器人训练',
    description: '训练一个客服聊天机器人，能够回答常见问题、处理订单查询、转接人工客服。需要使用 NLP 技术。',
    tags: ['ai', 'nlp', 'chatbot', 'machine-learning'],
    reward: 8000,
    status: 'PUBLISHED' as any,
    targetExecutor: ExecutorType.HYBRID,
    executor_type: ExecutorType.HYBRID,
    required_skills: ['NLP', 'Machine Learning', 'Python', 'AI'],
    difficulty: 'A',
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20天后
    legalCheckResult: {
      is_approved: true,
      risk_level: RiskLevel.LOW,
      reasoning: 'AI 应用场景合理，无风险。',
      suggested_modifications: [],
      checked_at: new Date().toISOString(),
      checker_version: '1.0.0',
    },
    creatorId: 'user-006',
    assigneeId: 'adv-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: new Date(),
  },
  {
    id: 'quest-007',
    title: '紧急修复：支付系统 Bug',
    description: '生产环境支付系统出现严重 Bug，导致部分订单无法完成支付。需要立即定位问题并修复。',
    tags: ['urgent', 'bug-fix', 'payment', 'backend'],
    reward: 2000,
    status: 'PUBLISHED' as any,
    targetExecutor: ExecutorType.HUMAN,
    executor_type: ExecutorType.HUMAN,
    required_skills: ['Backend', 'Payment', 'Debugging'],
    difficulty: 'B',
    deadline: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12小时后（紧急）
    legalCheckResult: {
      is_approved: true,
      risk_level: RiskLevel.LOW,
      reasoning: '紧急修复任务，合理。',
      suggested_modifications: [],
      checked_at: new Date().toISOString(),
      checker_version: '1.0.0',
    },
    creatorId: 'user-007',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'quest-008',
    title: 'UI/UX 设计优化',
    description: '重新设计产品的用户界面，提升用户体验。需要提供完整的设计稿（Figma）和交互原型。',
    tags: ['design', 'ui', 'ux', 'figma'],
    reward: 1500,
    status: 'PUBLISHED' as any,
    targetExecutor: ExecutorType.HUMAN,
    executor_type: ExecutorType.HUMAN,
    required_skills: ['UI Design', 'UX Design', 'Figma'],
    difficulty: 'C',
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15天后
    legalCheckResult: {
      is_approved: true,
      risk_level: RiskLevel.LOW,
      reasoning: '设计任务，合理。',
      suggested_modifications: [],
      checked_at: new Date().toISOString(),
      checker_version: '1.0.0',
    },
    creatorId: 'user-008',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockAdventurers: Adventurer[] = [
  {
    id: 'adv-001',
    email: 'alice@example.com',
    username: 'Alice',
    role: 'HUMAN' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    reputation: {
      id: 'rep-001',
      userId: 'adv-001',
      level: ReputationLevel.ELITE,
      score: 850,
      badges: ['fast-responder', 'quality-master'],
      historyLog: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    skills: ['react', 'typescript', 'nodejs', 'ui-design'],
    availability: true,
    currentLoad: 1,
  },
  {
    id: 'adv-002',
    email: 'bob-agent@example.com',
    username: 'BobAgent',
    role: 'AGENT_OWNER' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    reputation: {
      id: 'rep-002',
      userId: 'adv-002',
      level: ReputationLevel.LEGENDARY,
      score: 950,
      badges: ['speed-demon', 'code-wizard', 'test-master'],
      historyLog: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    skills: ['nodejs', 'postgresql', 'api-design', 'testing'],
    availability: true,
    currentLoad: 1,
  },
  {
    id: 'adv-003',
    email: 'charlie@example.com',
    username: 'Charlie',
    role: 'HUMAN' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    reputation: {
      id: 'rep-003',
      userId: 'adv-003',
      level: ReputationLevel.REGULAR,
      score: 600,
      badges: ['reliable'],
      historyLog: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    skills: ['react', 'css', 'html'],
    availability: false,
    currentLoad: 3,
  },
  {
    id: 'adv-004',
    email: 'diana-agent@example.com',
    username: 'DianaAgent',
    role: 'AGENT_OWNER' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    reputation: {
      id: 'rep-004',
      userId: 'adv-004',
      level: ReputationLevel.ELITE,
      score: 820,
      badges: ['database-guru', 'performance-optimizer'],
      historyLog: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    skills: ['postgresql', 'mongodb', 'redis', 'sql-optimization'],
    availability: true,
    currentLoad: 2,
  },
  {
    id: 'adv-005',
    email: 'eve@example.com',
    username: 'Eve',
    role: 'HUMAN' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    reputation: {
      id: 'rep-005',
      userId: 'adv-005',
      level: ReputationLevel.APPRENTICE,
      score: 250,
      badges: [],
      historyLog: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    skills: ['python', 'data-analysis'],
    availability: true,
    currentLoad: 0,
  },
];

const mockUserReputation = {
  level: ReputationLevel.ELITE,
  score: 850,
  badges: ['fast-responder', 'quality-master', 'team-player'],
};

function App() {
  const [view, setView] = useState<'quest-board' | 'admin'>('quest-board');
  const [quests, setQuests] = useState(mockQuests);

  const handleQuestClick = (quest: Quest) => {
    console.log('Quest clicked:', quest);
  };

  const handleApproveQuest = (questId: string) => {
    setQuests(quests.map(q => 
      q.id === questId ? { ...q, status: 'PUBLISHED' as any } : q
    ));
    console.log('Quest approved:', questId);
  };

  const handleRejectQuest = (questId: string) => {
    setQuests(quests.map(q => 
      q.id === questId ? { ...q, status: 'REJECTED' as any } : q
    ));
    console.log('Quest rejected:', questId);
  };

  // 检测管理员权限（实际应该从后端验证）
  const isAdmin = window.location.search.includes('admin=true');

  return (
    <div className="relative">
      {/* Admin Toggle Button - 仅管理员可见 */}
      {isAdmin && (
        <button
          onClick={() => setView(view === 'quest-board' ? 'admin' : 'quest-board')}
          className="fixed bottom-4 left-4 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-purple-500/50 transition-shadow flex items-center gap-2"
        >
          {view === 'quest-board' ? '🏛️ 管理员后台' : '⚔️ 任务大厅'}
        </button>
      )}

      {/* Content */}
      {view === 'quest-board' ? (
        <QuestBoard
          quests={quests.filter(q => q.status === 'PUBLISHED' || q.status === 'IN_PROGRESS')}
          userReputation={mockUserReputation}
          onQuestClick={handleQuestClick}
        />
      ) : isAdmin ? (
        <AdminDashboard
          quests={quests}
          adventurers={mockAdventurers}
          onApproveQuest={handleApproveQuest}
          onRejectQuest={handleRejectQuest}
        />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-3xl font-bold text-white mb-2">权限不足</h1>
            <p className="text-slate-400">你没有访问管理员后台的权限</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
