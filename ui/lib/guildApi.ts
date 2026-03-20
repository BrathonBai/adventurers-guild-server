import {
  AgentAutonomyLevel,
  AgentAvailability,
  AgentClassification,
  DelegationScope,
  ExecutorType,
  GuildActivity,
  GuildMember,
  GuildMemberRole,
  GuildMemberStatus,
  GuildPartyStatus,
  GuildQuest,
  GuildQuestStatus,
  GuildSnapshot,
  GuildUnitType,
  JoinGuildPayload,
  RecruitmentBookPacket,
} from '../../types';

type ServerSnapshot = {
  members: Array<{
    id: string;
    handle: string;
    displayName: string;
    role: GuildMemberRole;
    status: GuildMemberStatus;
    bio: string;
    specialties: string[];
    homeRegion: string;
    reputation: GuildMember['reputation'];
    agentIds: string[];
  }>;
  agents: Array<{
    id: string;
    handle: string;
    displayName: string;
    classification: AgentClassification;
    autonomy: AgentAutonomyLevel;
    availability: AgentAvailability;
    ownerMemberId?: string;
    operatorNotes: string;
    capabilities: string[];
    reputation: GuildMember['reputation'];
  }>;
  quests: Array<{
    id: string;
    title: string;
    description: string;
    status: 'OPEN' | 'FORMING_PARTY' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
    publisherMemberId?: string;
    publisherAgentId?: string;
    reward?: string;
    tags?: string[];
    trustRequirements?: string[];
    requiredMembers: Array<{
      role: string;
      count: number;
      filled: number;
      preferredUnit?: 'HUMAN' | 'AGENT' | 'HYBRID';
      skills: string[];
    }>;
    deadline?: string;
    partyId?: string;
  }>;
  parties: Array<{
    id: string;
    questId?: string;
    name: string;
    missionBrief?: string;
    leaderId: string;
    leaderType?: 'MEMBER' | 'AGENT';
    members: Array<{
      userId: string;
      role: string;
      joinedAt: number;
      unitType?: 'MEMBER' | 'AGENT';
    }>;
    status: 'RECRUITING' | 'ACTIVE' | 'DELIVERING' | 'DISBANDED';
    lookingFor: string[];
  }>;
  delegations: GuildSnapshot['delegations'];
  activity: GuildActivity[];
};

type JoinGuildResult = {
  snapshot: ServerSnapshot;
};

export async function fetchGuildSnapshot(): Promise<GuildSnapshot> {
  const response = await fetch('/api/guild-snapshot');
  if (!response.ok) {
    throw new Error(`Failed to fetch guild snapshot: ${response.status}`);
  }

  const snapshot = (await response.json()) as ServerSnapshot;
  return adaptSnapshot(snapshot);
}

export async function fetchRecruitmentBook(): Promise<RecruitmentBookPacket> {
  const response = await fetch('/api/recruitment-book');
  if (!response.ok) {
    throw new Error(`Failed to fetch recruitment book: ${response.status}`);
  }

  return (await response.json()) as RecruitmentBookPacket;
}

export async function joinGuild(payload: JoinGuildPayload): Promise<GuildSnapshot> {
  const response = await fetch('/api/agent/join', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = typeof errorBody?.message === 'string' ? errorBody.message : `Join failed: ${response.status}`;
    throw new Error(message);
  }

  const result = (await response.json()) as JoinGuildResult;
  return adaptSnapshot(result.snapshot);
}

function adaptSnapshot(server: ServerSnapshot): GuildSnapshot {
  return {
    members: server.members,
    agents: server.agents,
    quests: server.quests.map((quest) => ({
      id: quest.id,
      title: quest.title,
      summary: quest.description,
      status: adaptQuestStatus(quest.status),
      publisherMemberId: quest.publisherMemberId,
      publisherAgentId: quest.publisherAgentId,
      reward: parseReward(quest.reward),
      tags: quest.tags ?? [],
      needs: quest.requiredMembers.map((need) => ({
        role: need.role,
        seats: need.count,
        filled: need.filled,
        preferredUnit: adaptExecutorType(need.preferredUnit),
        requiredSkills: need.skills,
      })),
      trustRequirements: quest.trustRequirements ?? [],
      deadlineLabel: quest.deadline ?? '待定',
      partyId: quest.partyId,
    })),
    parties: server.parties.map((party) => ({
      id: party.id,
      questId: party.questId || '',
      name: party.name,
      status: adaptPartyStatus(party.status),
      leaderUnitType: party.leaderType === 'MEMBER' ? GuildUnitType.MEMBER : GuildUnitType.AGENT,
      leaderUnitId: party.leaderId,
      missionBrief: party.missionBrief || '队伍正在准备任务说明。',
      roster: party.members.map((member) => ({
        unitType: member.unitType === 'MEMBER' ? GuildUnitType.MEMBER : GuildUnitType.AGENT,
        unitId: member.userId,
        role: member.role,
        joinedAtLabel: formatJoinedAt(member.joinedAt),
      })),
      openRoles: party.lookingFor,
    })),
    delegations: server.delegations.map((delegation) => ({
      ...delegation,
      scopes: delegation.scopes as DelegationScope[],
    })),
    activity: server.activity,
  };
}

function parseReward(reward?: string): GuildQuest['reward'] {
  if (!reward) {
    return { amount: 0, currency: 'CNY', model: 'NEGOTIABLE' };
  }

  const amountMatch = reward.match(/\d+/);
  const currencyMatch = reward.match(/[A-Z]{3}/);
  const lower = reward.toLowerCase();
  return {
    amount: amountMatch ? Number(amountMatch[0]) : 0,
    currency: currencyMatch?.[0] || 'CNY',
    model: lower.includes('rev') ? 'REV_SHARE' : lower.includes('negotiable') ? 'NEGOTIABLE' : 'FIXED',
  };
}

function adaptQuestStatus(status: ServerSnapshot['quests'][number]['status']): GuildQuestStatus {
  switch (status) {
    case 'OPEN':
      return GuildQuestStatus.OPEN;
    case 'FORMING_PARTY':
      return GuildQuestStatus.FORMING_PARTY;
    case 'IN_PROGRESS':
      return GuildQuestStatus.ACTIVE;
    case 'REVIEW':
      return GuildQuestStatus.REVIEW;
    case 'COMPLETED':
      return GuildQuestStatus.COMPLETED;
    default:
      return GuildQuestStatus.CANCELLED;
  }
}

function adaptPartyStatus(status: ServerSnapshot['parties'][number]['status']): GuildPartyStatus {
  switch (status) {
    case 'RECRUITING':
      return GuildPartyStatus.FORMING;
    case 'ACTIVE':
      return GuildPartyStatus.ACTIVE;
    case 'DELIVERING':
      return GuildPartyStatus.DELIVERING;
    default:
      return GuildPartyStatus.DISBANDED;
  }
}

function adaptExecutorType(value?: 'HUMAN' | 'AGENT' | 'HYBRID'): ExecutorType {
  switch (value) {
    case 'HUMAN':
      return ExecutorType.HUMAN;
    case 'AGENT':
      return ExecutorType.AGENT;
    default:
      return ExecutorType.HYBRID;
  }
}

function formatJoinedAt(joinedAt: number): string {
  const hours = Math.max(1, Math.round((Date.now() - joinedAt) / (1000 * 60 * 60)));
  return hours < 24 ? `${hours} 小时前` : `${Math.round(hours / 24)} 天前`;
}
