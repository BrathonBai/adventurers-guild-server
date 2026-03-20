import WebSocket from 'ws';

export interface AgentConnection {
  id: string;
  ws: WebSocket;
  name: string;
  capabilities: string[];
  registeredAt: number;
}

export interface GuildReputationRecord {
  score: number;
  tier: 'APPRENTICE' | 'REGULAR' | 'ELITE' | 'LEGENDARY';
  badges: string[];
  completedQuests: number;
  reliability: number;
}

export interface GuildMemberRecord {
  id: string;
  handle: string;
  displayName: string;
  role: 'CLIENT' | 'BUILDER' | 'HYBRID' | 'MODERATOR';
  status: 'ACTIVE' | 'AWAY' | 'SUSPENDED';
  bio: string;
  specialties: string[];
  homeRegion: string;
  reputation: GuildReputationRecord;
  agentIds: string[];
}

export interface GuildAgentProfile {
  id: string;
  handle: string;
  displayName: string;
  classification: 'PERSONAL' | 'FREE_AGENT' | 'GUILD_SERVICE';
  autonomy: 'SUPERVISED' | 'DELEGATED' | 'AUTONOMOUS';
  availability: 'ONLINE' | 'IDLE' | 'OFFLINE';
  ownerMemberId?: string;
  operatorNotes: string;
  capabilities: string[];
  reputation: GuildReputationRecord;
}

export interface GuildDelegationRecord {
  id: string;
  memberId: string;
  agentId: string;
  scopes: Array<
    'PUBLISH_QUEST' | 'ACCEPT_QUEST' | 'NEGOTIATE' | 'COORDINATE_PARTY' | 'DELIVER_RESULTS'
  >;
  status: 'ACTIVE' | 'PAUSED';
  operatingNote: string;
}

export interface ActivityFeedItem {
  id: string;
  kind: 'QUEST_POSTED' | 'PARTY_FORMED' | 'AGENT_JOINED' | 'DELIVERABLE_SUBMITTED';
  title: string;
  detail: string;
  timestampLabel: string;
}

export interface PartyMember {
  userId: string;
  role: string;
  skills: string[];
  status: 'PENDING' | 'ACTIVE' | 'LEFT';
  joinedAt: number;
  unitType?: 'MEMBER' | 'AGENT';
}

export interface Party {
  id: string;
  questId?: string;
  name: string;
  description?: string;
  missionBrief?: string;
  leaderId: string;
  leaderType?: 'MEMBER' | 'AGENT';
  members: PartyMember[];
  maxSize: number;
  status: 'RECRUITING' | 'ACTIVE' | 'DELIVERING' | 'DISBANDED';
  lookingFor: string[];
  requiredSkills: string[];
  createdAt: number;
}

export interface RequiredMember {
  role: string;
  count: number;
  filled: number;
  skills: string[];
  preferredUnit?: 'HUMAN' | 'AGENT' | 'HYBRID';
}

export interface QuestSubtask {
  title: string;
  estimatedHours: number;
  description: string;
  assignedTo?: string;
}

export interface GuildQuest {
  id: string;
  title: string;
  description: string;
  publisherId: string;
  publisherMemberId?: string;
  publisherAgentId?: string;
  deadline?: string;
  reward?: string;
  tags?: string[];
  trustRequirements?: string[];
  requiredMembers: RequiredMember[];
  subtasks: QuestSubtask[];
  status: 'OPEN' | 'FORMING_PARTY' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
  teamMembers: string[];
  createdAt: number;
  partyId?: string;
}

export interface GuildTask {
  id: string;
  questId: string;
  partyId: string;
  title: string;
  description: string;
  assigneeId: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'blocked';
  progress: number;
  notes?: string;
}

export interface GuildSnapshotRecord {
  members: GuildMemberRecord[];
  agents: GuildAgentProfile[];
  quests: GuildQuest[];
  parties: Party[];
  delegations: GuildDelegationRecord[];
  activity: ActivityFeedItem[];
}

export interface JoinGuildMemberPayload {
  id?: string;
  handle?: string;
  displayName: string;
  role?: GuildMemberRecord['role'];
  bio?: string;
  specialties?: string[];
  homeRegion?: string;
}

export interface JoinGuildAgentPayload {
  id?: string;
  handle?: string;
  displayName: string;
  classification?: GuildAgentProfile['classification'];
  autonomy?: GuildAgentProfile['autonomy'];
  availability?: GuildAgentProfile['availability'];
  capabilities: string[];
  operatorNotes?: string;
}

export interface JoinGuildDelegationPayload {
  scopes: GuildDelegationRecord['scopes'];
  operatingNote?: string;
  status?: GuildDelegationRecord['status'];
}

export interface JoinGuildPayload {
  member?: JoinGuildMemberPayload;
  agent: JoinGuildAgentPayload;
  delegation?: JoinGuildDelegationPayload;
}

export interface GuildJoinResult {
  member?: GuildMemberRecord;
  agent: GuildAgentProfile;
  delegation?: GuildDelegationRecord;
  snapshot: GuildSnapshotRecord;
}

export interface RecruitmentBookPacket {
  name: string;
  version: string;
  thesis: string;
  markdown: string;
  http: {
    recruitmentEndpoint: string;
    joinEndpoint: string;
  };
  websocket: {
    getBookMessageType: 'get_recruitment_book';
    joinMessageType: 'join_guild';
    legacyRegisterMessageType: 'register';
  };
  exampleJoinPayload: JoinGuildPayload;
}

export interface GuildBootstrapState {
  members: GuildMemberRecord[];
  agents: GuildAgentProfile[];
  quests: GuildQuest[];
  parties: Party[];
  delegations: GuildDelegationRecord[];
  activity: ActivityFeedItem[];
}

export type IncomingMessage = {
  type: string;
  data?: Record<string, any>;
  [key: string]: any;
};
