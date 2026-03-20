import { createBootstrapState } from './seedState';
import { randomUUID } from 'crypto';
import {
  ActivityFeedItem,
  AgentConnection,
  GuildJoinResult,
  GuildAgentProfile,
  GuildDelegationRecord,
  GuildMemberRecord,
  GuildQuest,
  GuildSnapshotRecord,
  GuildTask,
  IncomingMessage,
  JoinGuildPayload,
  Party,
} from './types';
import {
  readOptionalAutonomy,
  readOptionalClassification,
  readOptionalString,
  readStringArray,
} from './messageUtils';

export type Application = {
  applicantId: string;
  name: string;
  skills: string[];
  reputation: string;
};

export class GuildState {
  readonly liveAgents = new Map<string, AgentConnection>();
  readonly members = new Map<string, GuildMemberRecord>();
  readonly agentProfiles = new Map<string, GuildAgentProfile>();
  readonly parties = new Map<string, Party>();
  readonly quests = new Map<string, GuildQuest>();
  readonly delegations = new Map<string, GuildDelegationRecord>();
  readonly activityFeed: ActivityFeedItem[] = [];
  readonly tasks = new Map<string, GuildTask>();
  readonly applications = new Map<string, Application[]>();
  private questCounter = 0;

  constructor() {
    this.bootstrap();
  }

  private bootstrap(): void {
    const state = createBootstrapState();

    state.members.forEach((member) => {
      this.members.set(member.id, member);
    });

    state.agents.forEach((agent) => {
      this.agentProfiles.set(agent.id, agent);
    });

    state.quests.forEach((quest) => {
      this.quests.set(quest.id, quest);
    });
    this.questCounter = state.quests.length;

    state.parties.forEach((party) => {
      this.parties.set(party.id, party);
    });

    state.delegations.forEach((delegation) => {
      this.delegations.set(delegation.id, delegation);
    });

    this.activityFeed.push(...state.activity);
  }

  nextQuestId(): string {
    this.questCounter += 1;
    const year = new Date().getFullYear();
    return `QUEST-${year}-${String(this.questCounter).padStart(3, '0')}`;
  }

  createSnapshot(): GuildSnapshotRecord {
    return {
      members: Array.from(this.members.values()),
      agents: Array.from(this.agentProfiles.values()),
      quests: Array.from(this.quests.values()),
      parties: Array.from(this.parties.values()),
      delegations: Array.from(this.delegations.values()),
      activity: this.activityFeed,
    };
  }

  joinGuild(payload: JoinGuildPayload, options?: { liveAgent?: AgentConnection }): GuildJoinResult {
    const member = payload.member ? this.upsertMemberProfile(payload.member, payload.agent.id) : undefined;
    const agentId = payload.agent.id || options?.liveAgent?.id || randomUUID();
    const agent = this.upsertGuildAgent(payload.agent, agentId, member?.id, options?.liveAgent);
    let delegation: GuildDelegationRecord | undefined;

    if (member && payload.delegation && payload.delegation.scopes.length > 0) {
      delegation = this.upsertDelegation(member.id, agent.id, payload.delegation);
    }

    if (member && !member.agentIds.includes(agent.id)) {
      member.agentIds.push(agent.id);
    }

    this.activityFeed.unshift({
      id: `activity-${Date.now()}`,
      kind: 'AGENT_JOINED',
      title: `${agent.displayName} 完成了工会入会登记`,
      detail: member
        ? `${agent.displayName} 已与会员 ${member.displayName} 建立可追溯的工会身份关系。`
        : `${agent.displayName} 作为自由 Agent 进入工会。`,
      timestampLabel: 'just now',
    });

    return {
      member,
      agent,
      delegation,
      snapshot: this.createSnapshot(),
    };
  }

  upsertAgentProfile(agentId: string, message: IncomingMessage, liveAgent: AgentConnection): void {
    const data = message.data ?? {};
    const ownerMemberId = readOptionalString(data.ownerMemberId) || readOptionalString(message.ownerMemberId);
    const existing = this.agentProfiles.get(agentId);

    const profile: GuildAgentProfile = {
      id: agentId,
      handle:
        readOptionalString(data.handle) ||
        readOptionalString(message.handle) ||
        existing?.handle ||
        `@${agentId.slice(0, 8)}`,
      displayName: liveAgent.name,
      classification:
        readOptionalClassification(data.classification) ||
        readOptionalClassification(message.classification) ||
        existing?.classification ||
        (ownerMemberId ? 'PERSONAL' : 'FREE_AGENT'),
      autonomy:
        readOptionalAutonomy(data.autonomy) ||
        readOptionalAutonomy(message.autonomy) ||
        existing?.autonomy ||
        'DELEGATED',
      availability: 'ONLINE',
      ownerMemberId: ownerMemberId || existing?.ownerMemberId,
      operatorNotes:
        readOptionalString(data.operatorNotes) ||
        readOptionalString(message.operatorNotes) ||
        existing?.operatorNotes ||
        'Runtime registration',
      capabilities: liveAgent.capabilities,
      reputation: existing?.reputation || {
        score: 500,
        tier: 'REGULAR',
        badges: [],
        completedQuests: 0,
        reliability: 80,
      },
    };

    this.agentProfiles.set(agentId, profile);

    if (ownerMemberId) {
      this.upsertMemberFromRegistration(ownerMemberId, message, agentId);
    }
  }

  markAgentOffline(agentId: string): void {
    const profile = this.agentProfiles.get(agentId);
    if (profile) {
      profile.availability = 'OFFLINE';
    }
  }

  private upsertMemberProfile(
    payload: NonNullable<JoinGuildPayload['member']>,
    fallbackAgentId?: string,
  ): GuildMemberRecord {
    const memberId = payload.id || this.findMemberIdByHandle(payload.handle) || randomUUID();
    const existing = this.members.get(memberId);
    const nextAgentIds = new Set(existing?.agentIds ?? []);
    if (fallbackAgentId) {
      nextAgentIds.add(fallbackAgentId);
    }

    const member: GuildMemberRecord = {
      id: memberId,
      handle: payload.handle || existing?.handle || this.makeHandle(payload.displayName, memberId),
      displayName: payload.displayName || existing?.displayName || memberId,
      role: payload.role || existing?.role || 'HYBRID',
      status: existing?.status || 'ACTIVE',
      bio: payload.bio || existing?.bio || 'Guild member joined through recruitment book onboarding.',
      specialties: payload.specialties || existing?.specialties || [],
      homeRegion: payload.homeRegion || existing?.homeRegion || 'Unknown',
      reputation:
        existing?.reputation || {
          score: 500,
          tier: 'REGULAR',
          badges: [],
          completedQuests: 0,
          reliability: 80,
        },
      agentIds: Array.from(nextAgentIds),
    };

    this.members.set(memberId, member);
    return member;
  }

  private upsertGuildAgent(
    payload: JoinGuildPayload['agent'],
    agentId: string,
    ownerMemberId?: string,
    liveAgent?: AgentConnection,
  ): GuildAgentProfile {
    const existing = this.agentProfiles.get(agentId);
    const profile: GuildAgentProfile = {
      id: agentId,
      handle: payload.handle || existing?.handle || this.makeHandle(payload.displayName, agentId),
      displayName: payload.displayName || existing?.displayName || agentId,
      classification:
        payload.classification || existing?.classification || (ownerMemberId ? 'PERSONAL' : 'FREE_AGENT'),
      autonomy: payload.autonomy || existing?.autonomy || 'DELEGATED',
      availability:
        liveAgent ? 'ONLINE' : payload.availability || existing?.availability || 'IDLE',
      ownerMemberId: ownerMemberId || existing?.ownerMemberId,
      operatorNotes: payload.operatorNotes || existing?.operatorNotes || 'Joined via recruitment book.',
      capabilities: payload.capabilities.length > 0 ? payload.capabilities : existing?.capabilities || [],
      reputation:
        existing?.reputation || {
          score: 500,
          tier: 'REGULAR',
          badges: [],
          completedQuests: 0,
          reliability: 80,
        },
    };

    this.agentProfiles.set(agentId, profile);
    return profile;
  }

  private upsertDelegation(
    memberId: string,
    agentId: string,
    payload: NonNullable<JoinGuildPayload['delegation']>,
  ): GuildDelegationRecord {
    const existing = Array.from(this.delegations.values()).find(
      (delegation) => delegation.memberId === memberId && delegation.agentId === agentId,
    );
    const delegation: GuildDelegationRecord = {
      id: existing?.id || randomUUID(),
      memberId,
      agentId,
      scopes: payload.scopes,
      status: payload.status || existing?.status || 'ACTIVE',
      operatingNote:
        payload.operatingNote ||
        existing?.operatingNote ||
        `${agentId} may act for ${memberId} within the declared guild scopes.`,
    };

    this.delegations.set(delegation.id, delegation);
    return delegation;
  }

  private findMemberIdByHandle(handle?: string): string | undefined {
    if (!handle) {
      return undefined;
    }

    return Array.from(this.members.values()).find((member) => member.handle === handle)?.id;
  }

  private makeHandle(displayName: string, fallbackId: string): string {
    const normalized = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return normalized ? `@${normalized}` : `@${fallbackId.slice(0, 8)}`;
  }

  private upsertMemberFromRegistration(
    memberId: string,
    message: IncomingMessage,
    agentId: string,
  ): void {
    const data = message.data ?? {};
    const existing = this.members.get(memberId);
    const nextAgentIds = new Set(existing?.agentIds ?? []);
    nextAgentIds.add(agentId);

    this.members.set(memberId, {
      id: memberId,
      handle:
        readOptionalString(data.memberHandle) ||
        readOptionalString(message.memberHandle) ||
        existing?.handle ||
        `@${memberId.slice(0, 8)}`,
      displayName:
        readOptionalString(data.memberName) ||
        readOptionalString(message.memberName) ||
        existing?.displayName ||
        memberId,
      role: existing?.role || 'HYBRID',
      status: existing?.status || 'ACTIVE',
      bio: existing?.bio || 'Member registered through live agent session.',
      specialties: existing?.specialties || [],
      homeRegion: existing?.homeRegion || 'Unknown',
      reputation:
        existing?.reputation || {
          score: 500,
          tier: 'REGULAR',
          badges: [],
          completedQuests: 0,
          reliability: 80,
        },
      agentIds: Array.from(nextAgentIds),
    });
  }

  static resolveDisplayName(state: GuildState, unitId: string): string {
    return (
      state.agentProfiles.get(unitId)?.displayName ||
      state.members.get(unitId)?.displayName ||
      'Unknown'
    );
  }

  static resolveCapabilities(state: GuildState, unitId: string): string[] {
    return (
      state.liveAgents.get(unitId)?.capabilities ||
      state.agentProfiles.get(unitId)?.capabilities ||
      state.members.get(unitId)?.specialties ||
      []
    );
  }
}
