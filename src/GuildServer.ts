import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

/**
 * Agent 连接信息
 */
interface AgentConnection {
  id: string;
  ws: WebSocket;
  name: string;
  capabilities: any[];
  registeredAt: number;
}

/**
 * 队伍信息
 */
interface Party {
  id: string;
  name: string;
  description?: string;
  leaderId: string;
  members: PartyMember[];
  maxSize: number;
  status: 'RECRUITING' | 'ACTIVE' | 'DISBANDED';
  lookingFor: string[];
  requiredSkills: string[];
  createdAt: number;
}

/**
 * 队员信息
 */
interface PartyMember {
  userId: string;
  role: string;
  skills: string[];
  status: 'PENDING' | 'ACTIVE' | 'LEFT';
  joinedAt: number;
}

/**
 * 任务信息（基于 Markdown 文档）
 */
interface Quest {
  id: string; // 格式: QUEST-YYYY-NNN
  title: string;
  description: string;
  publisherId: string;
  deadline?: string;
  reward?: string;
  requiredMembers: RequiredMember[];
  subtasks: Subtask[];
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  teamMembers: string[]; // Agent IDs in this quest
  createdAt: number;
}

/**
 * 需要的协作成员
 */
interface RequiredMember {
  role: string;
  count: number;
  filled: number;
  skills: string[];
}

/**
 * 子任务
 */
interface Subtask {
  title: string;
  estimatedHours: number;
  description: string;
  assignedTo?: string;
}

/**
 * 任务信息
 */
interface Task {
  id: string;
  questId: string; // 关联到 Quest
  partyId: string;
  title: string;
  description: string;
  assigneeId: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'blocked';
  progress: number;
  notes?: string;
}

/**
 * 冒险家协会 WebSocket 服务器（增强版）
 * 
 * 新增功能：
 * 1. 队伍管理
 * 2. 任务协调
 * 3. 成员招募
 */
export class GuildServer {
  private wss: WebSocketServer;
  private agents: Map<string, AgentConnection> = new Map();
  private parties: Map<string, Party> = new Map();
  private quests: Map<string, Quest> = new Map(); // 新增：任务列表
  private tasks: Map<string, Task> = new Map();
  private applications: Map<string, any[]> = new Map(); // partyId -> applications
  private port: number;
  private questCounter: number = 0; // 任务计数器

  constructor(port: number = 3001) {
    this.port = port;
    this.wss = new WebSocketServer({ port });
    this.setupServer();
  }

  private setupServer(): void {
    console.log(`🏰 Adventurer's Guild Server started on port ${this.port}`);

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('📡 New connection established');

      ws.on('message', (data: Buffer) => {
        this.handleMessage(ws, data.toString());
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    // 心跳检测
    setInterval(() => {
      this.heartbeat();
    }, 30000);
  }

  /**
   * 处理消息
   */
  private handleMessage(ws: WebSocket, data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        // 原有功能
        case 'register':
          this.handleRegister(ws, message);
          break;
        case 'agent_message':
          this.handleAgentMessage(ws, message);
          break;
        case 'agent_broadcast':
          this.handleAgentBroadcast(ws, message);
          break;
        
        // 任务相关（新规则）
        case 'publish_quest':
          this.handlePublishQuest(ws, message);
          break;
        case 'list_quests':
          this.handleListQuests(ws, message);
          break;
        case 'accept_quest':
          this.handleAcceptQuest(ws, message);
          break;
        case 'invite_to_quest':
          this.handleInviteToQuest(ws, message);
          break;
        case 'get_quest_team':
          this.handleGetQuestTeam(ws, message);
          break;
        case 'send_to_quest_team':
          this.handleSendToQuestTeam(ws, message);
          break;
        
        // 任务相关（旧）
        case 'post_quest':
          this.handlePostQuest(ws, message);
          break;
        case 'find_agents':
          this.handleFindAgents(ws, message);
          break;
        
        // 队伍管理
        case 'create_party':
          this.handleCreateParty(ws, message);
          break;
        case 'recruit_members':
          this.handleRecruitMembers(ws, message);
          break;
        case 'review_application':
          this.handleReviewApplication(ws, message);
          break;
        case 'add_member':
          this.handleAddMember(ws, message);
          break;
        case 'remove_member':
          this.handleRemoveMember(ws, message);
          break;
        case 'get_party_status':
          this.handleGetPartyStatus(ws, message);
          break;
        case 'disband_party':
          this.handleDisbandParty(ws, message);
          break;
        case 'list_my_parties':
          this.handleListMyParties(ws, message);
          break;
        
        // 任务协调
        case 'assign_task':
          this.handleAssignTask(ws, message);
          break;
        case 'update_task_status':
          this.handleUpdateTaskStatus(ws, message);
          break;
        case 'get_task_progress':
          this.handleGetTaskProgress(ws, message);
          break;
        case 'integrate_results':
          this.handleIntegrateResults(ws, message);
          break;
        case 'team_message':
          this.handleTeamMessage(ws, message);
          break;
        case 'request_help':
          this.handleRequestHelp(ws, message);
          break;
        
        case 'pong':
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to handle message:', error);
      this.sendError(ws, 'INVALID_MESSAGE', 'Failed to parse message');
    }
  }

  /**
   * 注册 Agent（规则1：自动会员招募）
   */
  private handleRegister(ws: WebSocket, message: any): void {
    const agentId = message.agentId || uuidv4();
    
    const agent: AgentConnection = {
      id: agentId,
      ws,
      name: message.name || 'Anonymous',
      capabilities: message.capabilities || [],
      registeredAt: Date.now(),
    };

    this.agents.set(agentId, agent);

    console.log(`✅ Agent registered: ${agent.name} (${agentId})`);
    console.log(`   Capabilities: ${agent.capabilities.join(', ')}`);

    this.sendToWs(ws, {
      type: 'registered',
      agentId,
      message: 'Successfully registered to Adventurer\'s Guild',
      capabilities: agent.capabilities
    });

    // 广播新成员加入
    this.broadcast({
      type: 'new_member',
      data: {
        agentId,
        name: agent.name,
        capabilities: agent.capabilities
      }
    }, agentId);
  }

  /**
   * 发布任务（规则2：Markdown 文档发布）
   */
  private handlePublishQuest(ws: WebSocket, message: any): void {
    const agent = this.getAgentByWs(ws);
    if (!agent) {
      this.sendError(ws, 'NOT_REGISTERED', 'Please register first');
      return;
    }

    this.questCounter++;
    const year = new Date().getFullYear();
    const questId = `QUEST-${year}-${String(this.questCounter).padStart(3, '0')}`;

    const quest: Quest = {
      id: questId,
      title: message.data.title,
      description: message.data.description,
      publisherId: agent.id,
      deadline: message.data.deadline,
      reward: message.data.reward,
      requiredMembers: message.data.requiredMembers || [],
      subtasks: message.data.subtasks || [],
      status: 'OPEN',
      teamMembers: [agent.id], // 发布者自动加入
      createdAt: Date.now()
    };

    this.quests.set(questId, quest);

    console.log(`📝 Quest published: ${quest.title} (${questId})`);
    console.log(`   Required members: ${quest.requiredMembers.map(m => m.role).join(', ')}`);

    this.sendToWs(ws, {
      type: 'quest_published',
      questId,
      quest
    });

    // 广播新任务
    this.broadcast({
      type: 'new_quest',
      data: {
        questId,
        title: quest.title,
        requiredMembers: quest.requiredMembers,
        publisherName: agent.name
      }
    }, agent.id);
  }

  /**
   * 列出所有任务
   */
  private handleListQuests(ws: WebSocket, message: any): void {
    const agent = this.getAgentByWs(ws);
    if (!agent) {
      this.sendError(ws, 'NOT_REGISTERED', 'Please register first');
      return;
    }

    const filter = message.data?.status || 'OPEN';
    const quests = Array.from(this.quests.values())
      .filter(q => !filter || q.status === filter)
      .map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        requiredMembers: q.requiredMembers,
        status: q.status,
        deadline: q.deadline,
        reward: q.reward
      }));

    this.sendToWs(ws, {
      type: 'quest_list',
      quests
    });
  }

  /**
   * 接取任务（规则2：检查空缺 + 评估能力）
   */
  private handleAcceptQuest(ws: WebSocket, message: any): void {
    const agent = this.getAgentByWs(ws);
    if (!agent) {
      this.sendError(ws, 'NOT_REGISTERED', 'Please register first');
      return;
    }

    const questId = message.data.questId;
    const role = message.data.role;
    const quest = this.quests.get(questId);

    if (!quest) {
      this.sendError(ws, 'QUEST_NOT_FOUND', 'Quest not found');
      return;
    }

    if (quest.status !== 'OPEN') {
      this.sendError(ws, 'QUEST_NOT_OPEN', 'Quest is not open for acceptance');
      return;
    }

    // 检查是否已经在队伍中
    if (quest.teamMembers.includes(agent.id)) {
      this.sendError(ws, 'ALREADY_IN_TEAM', 'You are already in this quest team');
      return;
    }

    // 检查角色是否还有空缺
    const requiredMember = quest.requiredMembers.find(m => m.role === role);
    if (!requiredMember) {
      this.sendError(ws, 'ROLE_NOT_FOUND', 'Role not found in quest requirements');
      return;
    }

    if (requiredMember.filled >= requiredMember.count) {
      this.sendError(ws, 'ROLE_FILLED', 'This role is already filled');
      return;
    }

    // 加入队伍
    quest.teamMembers.push(agent.id);
    requiredMember.filled++;

    // 如果所有角色都填满，更新状态
    const allFilled = quest.requiredMembers.every(m => m.filled >= m.count);
    if (allFilled) {
      quest.status = 'IN_PROGRESS';
    }

    console.log(`✅ ${agent.name} accepted quest ${questId} as ${role}`);

    this.sendToWs(ws, {
      type: 'quest_accepted',
      questId,
      role,
      teamMembers: quest.teamMembers
    });

    // 通知队伍其他成员
    quest.teamMembers.forEach(memberId => {
      if (memberId !== agent.id) {
        this.sendToAgent(memberId, {
          type: 'team_member_joined',
          questId,
          data: {
            agentId: agent.id,
            name: agent.name,
            role
          }
        });
      }
    });
  }

  /**
   * 邀请其他会员（规则2：主动邀请填补空缺）
   */
  private handleInviteToQuest(ws: WebSocket, message: any): void {
    const agent = this.getAgentByWs(ws);
    if (!agent) {
      this.sendError(ws, 'NOT_REGISTERED', 'Please register first');
      return;
    }

    const questId = message.data.questId;
    const targetAgentId = message.data.targetAgentId;
    const role = message.data.role;

    const quest = this.quests.get(questId);
    if (!quest) {
      this.sendError(ws, 'QUEST_NOT_FOUND', 'Quest not found');
      return;
    }

    // 检查邀请者是否在队伍中
    if (!quest.teamMembers.includes(agent.id)) {
      this.sendError(ws, 'NOT_IN_TEAM', 'You are not in this quest team');
      return;
    }

    const targetAgent = this.agents.get(targetAgentId);
    if (!targetAgent) {
      this.sendError(ws, 'AGENT_NOT_FOUND', 'Target agent not found');
      return;
    }

    console.log(`📨 ${agent.name} invited ${targetAgent.name} to ${questId} as ${role}`);

    // 发送邀请
    this.sendToAgent(targetAgentId, {
      type: 'quest_invitation',
      data: {
        questId,
        questTitle: quest.title,
        role,
        inviterName: agent.name,
        inviterId: agent.id
      }
    });

    this.sendToWs(ws, {
      type: 'invitation_sent',
      targetAgentId,
      targetAgentName: targetAgent.name
    });
  }

  /**
   * 获取任务队伍成员（规则3：同任务标识 = 协作小队）
   */
  private handleGetQuestTeam(ws: WebSocket, message: any): void {
    const agent = this.getAgentByWs(ws);
    if (!agent) {
      this.sendError(ws, 'NOT_REGISTERED', 'Please register first');
      return;
    }

    const questId = message.data.questId;
    const quest = this.quests.get(questId);

    if (!quest) {
      this.sendError(ws, 'QUEST_NOT_FOUND', 'Quest not found');
      return;
    }

    const teamMembers = quest.teamMembers.map(memberId => {
      const member = this.agents.get(memberId);
      return member ? {
        id: member.id,
        name: member.name,
        capabilities: member.capabilities
      } : null;
    }).filter(m => m !== null);

    this.sendToWs(ws, {
      type: 'quest_team',
      questId,
      teamMembers,
      requiredMembers: quest.requiredMembers
    });
  }

  /**
   * 发送消息给任务队伍（规则3：小队通信）
   */
  private handleSendToQuestTeam(ws: WebSocket, message: any): void {
    const agent = this.getAgentByWs(ws);
    if (!agent) {
      this.sendError(ws, 'NOT_REGISTERED', 'Please register first');
      return;
    }

    const questId = message.data.questId;
    const content = message.data.content;
    const quest = this.quests.get(questId);

    if (!quest) {
      this.sendError(ws, 'QUEST_NOT_FOUND', 'Quest not found');
      return;
    }

    // 检查发送者是否在队伍中
    if (!quest.teamMembers.includes(agent.id)) {
      this.sendError(ws, 'NOT_IN_TEAM', 'You are not in this quest team');
      return;
    }

    console.log(`💬 [${questId}] ${agent.name}: ${content}`);

    // 发送给队伍所有成员
    quest.teamMembers.forEach(memberId => {
      this.sendToAgent(memberId, {
        type: 'quest_team_message',
        questId,
        data: {
          sender: agent.name,
          senderId: agent.id,
          content,
          timestamp: Date.now()
        }
      });
    });
  }

  /**
   * 注册 Agent（旧版本，保持兼容）
   */
  private handleRegisterOld(ws: WebSocket, message: any): void {
    this.handleRegister(ws, message);
  }

  /**
   * 发布任务
   */
  private handlePostQuest(ws: WebSocket, message: any): void {
    const agent = this.getAgentByWs(ws);
    if (!agent) return;

    const questId = uuidv4();
    console.log(`📝 Quest posted: ${message.data.title} (${questId})`);

    this.sendToWs(ws, {
      type: 'quest_posted',
      questId,
      status: 'PENDING_REVIEW'
    });
  }

  /**
   * 搜索 Agent
   */
  private handleFindAgents(ws: WebSocket, message: any): void {
    const criteria = message.data;
    const matchedAgents = Array.from(this.agents.values())
      .filter(agent => {
        if (criteria.skill) {
          return agent.capabilities.some((cap: any) => 
            cap.toLowerCase().includes(criteria.skill.toLowerCase())
          );
        }
        return true;
      })
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        capabilities: agent.capabilities,
        reputation: 'REGULAR' // TODO: 从数据库获取
      }));

    this.sendToWs(ws, {
      type: 'agents_found',
      agents: matchedAgents
    });
  }

  /**
   * 创建队伍
   */
  private handleCreateParty(ws: WebSocket, message: any): void {
    const agent = this.getAgentByWs(ws);
    if (!agent) return;

    const partyId = uuidv4();
    const party: Party = {
      id: partyId,
      name: message.data.name,
      description: message.data.description,
      leaderId: agent.id,
      members: [],
      maxSize: message.data.maxSize || 5,
      status: 'RECRUITING',
      lookingFor: message.data.lookingFor || [],
      requiredSkills: message.data.requiredSkills || [],
      createdAt: Date.now()
    };

    this.parties.set(partyId, party);
    console.log(`🎉 Party created: ${party.name} (${partyId})`);

    this.sendToWs(ws, {
      type: 'party_created',
      party: {
        id: party.id,
        name: party.name,
        leaderId: party.leaderId,
        status: party.status
      }
    });
  }

  /**
   * 招募成员
   */
  private handleRecruitMembers(ws: WebSocket, message: any): void {
    const party = this.parties.get(message.partyId);
    if (!party) {
      this.sendError(ws, 'PARTY_NOT_FOUND', 'Party not found');
      return;
    }

    // 模拟收到申请
    const mockApplications = [
      {
        applicantId: 'agent-' + Math.random().toString(36).substr(2, 9),
        name: 'CodeWizard',
        skills: ['react', 'typescript'],
        reputation: 'ELITE'
      },
      {
        applicantId: 'agent-' + Math.random().toString(36).substr(2, 9),
        name: 'BackendMaster',
        skills: ['nodejs', 'postgresql'],
        reputation: 'REGULAR'
      }
    ];

    this.applications.set(message.partyId, mockApplications);

    console.log(`📢 Recruiting for party ${party.name}`);

    this.sendToWs(ws, {
      type: 'applications_received',
      partyId: message.partyId,
      applications: mockApplications
    });
  }

  /**
   * 审核申请
   */
  private handleReviewApplication(ws: WebSocket, message: any): void {
    const party = this.parties.get(message.partyId);
    if (!party) return;

    if (message.approved) {
      const member: PartyMember = {
        userId: message.applicantId,
        role: message.role,
        skills: [],
        status: 'ACTIVE',
        joinedAt: Date.now()
      };
      party.members.push(member);
      console.log(`✅ ${message.applicantId} joined ${party.name} as ${message.role}`);
    }

    this.sendToWs(ws, {
      type: 'application_reviewed',
      partyId: message.partyId,
      applicantId: message.applicantId,
      approved: message.approved
    });
  }

  /**
   * 添加成员
   */
  private handleAddMember(ws: WebSocket, message: any): void {
    const party = this.parties.get(message.partyId);
    if (!party) return;

    const member: PartyMember = {
      userId: message.userId,
      role: message.role,
      skills: message.skills || [],
      status: 'ACTIVE',
      joinedAt: Date.now()
    };

    party.members.push(member);
    console.log(`➕ ${message.userId} added to ${party.name}`);

    this.sendToWs(ws, {
      type: 'member_added',
      partyId: message.partyId,
      member
    });
  }

  /**
   * 移除成员
   */
  private handleRemoveMember(ws: WebSocket, message: any): void {
    const party = this.parties.get(message.partyId);
    if (!party) return;

    party.members = party.members.filter(m => m.userId !== message.userId);
    console.log(`➖ ${message.userId} removed from ${party.name}`);

    this.sendToWs(ws, {
      type: 'member_removed',
      partyId: message.partyId,
      userId: message.userId
    });
  }

  /**
   * 获取队伍状态
   */
  private handleGetPartyStatus(ws: WebSocket, message: any): void {
    const party = this.parties.get(message.partyId);
    if (!party) {
      this.sendError(ws, 'PARTY_NOT_FOUND', 'Party not found');
      return;
    }

    const leader = this.agents.get(party.leaderId);
    const membersWithDetails = party.members.map(m => ({
      ...m,
      user: {
        id: m.userId,
        name: this.agents.get(m.userId)?.name || 'Unknown'
      }
    }));

    this.sendToWs(ws, {
      type: 'party_status',
      party: {
        ...party,
        leader: {
          id: party.leaderId,
          name: leader?.name || 'Unknown'
        },
        members: membersWithDetails
      }
    });
  }

  /**
   * 解散队伍
   */
  private handleDisbandParty(ws: WebSocket, message: any): void {
    const party = this.parties.get(message.partyId);
    if (!party) return;

    party.status = 'DISBANDED';
    console.log(`💔 Party disbanded: ${party.name}`);

    this.sendToWs(ws, {
      type: 'party_disbanded',
      partyId: message.partyId
    });
  }

  /**
   * 列出我的队伍
   */
  private handleListMyParties(ws: WebSocket, message: any): void {
    const agent = this.getAgentByWs(ws);
    if (!agent) return;

    const myParties = Array.from(this.parties.values())
      .filter(p => p.leaderId === agent.id || p.members.some(m => m.userId === agent.id))
      .map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        members: p.members.length,
        maxSize: p.maxSize,
        lookingFor: p.lookingFor
      }));

    this.sendToWs(ws, {
      type: 'my_parties',
      parties: myParties
    });
  }

  /**
   * 分配任务
   */
  private handleAssignTask(ws: WebSocket, message: any): void {
    const taskId = uuidv4();
    const task: Task = {
      id: taskId,
      questId: message.questId || '', // 添加 questId
      partyId: message.partyId,
      title: message.task.title,
      description: message.task.description,
      assigneeId: message.assigneeId,
      status: 'assigned',
      progress: 0
    };

    this.tasks.set(taskId, task);
    console.log(`📋 Task assigned: ${task.title} -> ${message.assigneeId}`);

    this.sendToWs(ws, {
      type: 'task_assigned',
      taskId,
      assigneeId: message.assigneeId,
      status: 'assigned'
    });
  }

  /**
   * 更新任务状态
   */
  private handleUpdateTaskStatus(ws: WebSocket, message: any): void {
    const task = this.tasks.get(message.taskId);
    if (!task) return;

    task.status = message.status;
    task.progress = message.progress;
    task.notes = message.notes;

    console.log(`📝 Task updated: ${task.title} -> ${message.status} (${message.progress}%)`);

    this.sendToWs(ws, {
      type: 'task_updated',
      taskId: message.taskId,
      status: message.status,
      progress: message.progress
    });
  }

  /**
   * 获取任务进度
   */
  private handleGetTaskProgress(ws: WebSocket, message: any): void {
    const partyTasks = Array.from(this.tasks.values())
      .filter(t => t.partyId === message.partyId)
      .map(t => ({
        ...t,
        assignee: {
          id: t.assigneeId,
          name: this.agents.get(t.assigneeId)?.name || 'Unknown'
        }
      }));

    this.sendToWs(ws, {
      type: 'task_progress',
      partyId: message.partyId,
      tasks: partyTasks
    });
  }

  /**
   * 整合结果
   */
  private handleIntegrateResults(ws: WebSocket, message: any): void {
    const partyTasks = Array.from(this.tasks.values())
      .filter(t => t.partyId === message.partyId && t.status === 'completed');

    const deliverables = partyTasks.map(t => ({
      name: t.title,
      path: `/deliverables/${t.id}`,
      contributor: t.assigneeId
    }));

    console.log(`🔗 Results integrated for party ${message.partyId}`);

    this.sendToWs(ws, {
      type: 'results_integrated',
      partyId: message.partyId,
      deliverables
    });
  }

  /**
   * 团队消息
   */
  private handleTeamMessage(ws: WebSocket, message: any): void {
    const party = this.parties.get(message.partyId);
    if (!party) return;

    const agent = this.getAgentByWs(ws);
    console.log(`💬 Team message in ${party.name}: ${message.message}`);

    // 发送给所有队员
    party.members.forEach(member => {
      const memberAgent = this.agents.get(member.userId);
      if (memberAgent) {
        this.sendToAgent(member.userId, {
          type: 'team_message',
          from: agent?.id,
          partyId: message.partyId,
          message: message.message
        });
      }
    });
  }

  /**
   * 请求帮助
   */
  private handleRequestHelp(ws: WebSocket, message: any): void {
    console.log(`🆘 Help requested: ${message.issue}`);

    // 模拟有人提供帮助
    setTimeout(() => {
      this.sendToWs(ws, {
        type: 'help_offered',
        partyId: message.partyId,
        taskId: message.taskId,
        helper: {
          id: 'helper-123',
          name: 'HelpfulAgent'
        },
        solution: 'Try checking the documentation'
      });
    }, 1000);
  }

  /**
   * 处理 Agent 间消息
   */
  private handleAgentMessage(ws: WebSocket, message: any): void {
    const fromAgent = this.getAgentByWs(ws);
    if (!fromAgent) return;

    const toAgent = this.agents.get(message.to);
    if (!toAgent) {
      console.warn(`Target agent ${message.to} not found`);
      return;
    }

    console.log(`📨 Message: ${fromAgent.name} → ${toAgent.name}`);

    this.sendToAgent(message.to, {
      type: 'agent_message',
      from: fromAgent.id,
      content: message.content
    });
  }

  /**
   * 处理广播消息
   */
  private handleAgentBroadcast(ws: WebSocket, message: any): void {
    const fromAgent = this.getAgentByWs(ws);
    if (!fromAgent) return;

    console.log(`📢 Broadcast from ${fromAgent.name}`);

    this.broadcast({
      type: 'agent_broadcast',
      from: fromAgent.id,
      data: message.data
    }, fromAgent.id);
  }

  /**
   * 发送错误消息
   */
  private sendError(ws: WebSocket, code: string, message: string): void {
    this.sendToWs(ws, {
      type: 'error',
      code,
      message
    });
  }

  /**
   * 发送消息到 WebSocket
   */
  private sendToWs(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * 发送消息给指定 Agent
   */
  private sendToAgent(agentId: string, message: any): void {
    const agent = this.agents.get(agentId);
    if (agent && agent.ws.readyState === WebSocket.OPEN) {
      agent.ws.send(JSON.stringify(message));
    }
  }

  /**
   * 广播消息
   */
  private broadcast(message: any, excludeAgentId?: string): void {
    this.agents.forEach((agent, agentId) => {
      if (agentId !== excludeAgentId && agent.ws.readyState === WebSocket.OPEN) {
        agent.ws.send(JSON.stringify(message));
      }
    });
  }

  /**
   * 根据 WebSocket 获取 Agent
   */
  private getAgentByWs(ws: WebSocket): AgentConnection | undefined {
    for (const agent of this.agents.values()) {
      if (agent.ws === ws) {
        return agent;
      }
    }
    return undefined;
  }

  /**
   * 处理断开连接
   */
  private handleDisconnect(ws: WebSocket): void {
    const agent = this.getAgentByWs(ws);
    if (agent) {
      console.log(`👋 Agent disconnected: ${agent.name} (${agent.id})`);
      this.agents.delete(agent.id);

      this.broadcast({
        type: 'agent_left',
        data: {
          agentId: agent.id,
          name: agent.name,
        },
      });
    }
  }

  /**
   * 心跳检测
   */
  private heartbeat(): void {
    this.agents.forEach((agent) => {
      if (agent.ws.readyState === WebSocket.OPEN) {
        agent.ws.send(JSON.stringify({ type: 'ping' }));
      }
    });
  }

  /**
   * 关闭服务器
   */
  public close(): void {
    this.wss.close();
    console.log('🏰 Guild Server closed');
  }
}
