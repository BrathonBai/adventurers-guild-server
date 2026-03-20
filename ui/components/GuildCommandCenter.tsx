import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AgentAvailability,
  AgentClassification,
  AgentAutonomyLevel,
  DelegationScope,
  GuildMember,
  GuildMemberRole,
  GuildPartyStatus,
  GuildQuestStatus,
  GuildSnapshot,
  GuildUnitType,
  JoinGuildPayload,
  RecruitmentBookPacket,
  ReputationLevel,
} from '../../types';

type CommandTab = 'overview' | 'quests' | 'agents' | 'parties' | 'delegation' | 'blueprint';

interface GuildCommandCenterProps {
  snapshot: GuildSnapshot;
  recruitmentBook: RecruitmentBookPacket | null;
  isSyncing: boolean;
  connectionNote: string;
  onRefresh: () => Promise<void>;
  onJoinGuild: (payload: JoinGuildPayload) => Promise<void>;
}

export const GuildCommandCenter = ({
  snapshot,
  recruitmentBook,
  isSyncing,
  connectionNote,
  onRefresh,
  onJoinGuild,
}: GuildCommandCenterProps) => {
  const [activeTab, setActiveTab] = useState<CommandTab>('overview');
  const [inviteCopied, setInviteCopied] = useState(false);
  const inviteCommand = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
    return `请阅读 ${origin}/api/recruitment-book，理解 Adventurer's Guild 的招募书与入会协议；读完后按文档要求加入工会，如走 HTTP 路径，请向 ${origin}/api/agent/join 提交正式 join payload。`;
  }, []);
  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteCommand);
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 1800);
    } catch (error) {
      console.error('Failed to copy invite command', error);
    }
  };

  const stats = useMemo(
    () => ({
      activeMembers: snapshot.members.filter((member) => member.status === 'ACTIVE').length,
      onlineAgents: snapshot.agents.filter((agent) => agent.availability === AgentAvailability.ONLINE).length,
      openQuests: snapshot.quests.filter(
        (quest) => quest.status === GuildQuestStatus.OPEN || quest.status === GuildQuestStatus.FORMING_PARTY,
      ).length,
      activeParties: snapshot.parties.filter(
        (party) => party.status === GuildPartyStatus.FORMING || party.status === GuildPartyStatus.ACTIVE,
      ).length,
    }),
    [snapshot],
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.18),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.16),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(168,85,247,0.18),transparent_32%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiLz48L3N2Zz4=')]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 md:px-8 md:py-10">
        <HeroSection
          stats={stats}
          connectionNote={connectionNote}
          isSyncing={isSyncing}
          onRefresh={onRefresh}
          inviteCommand={inviteCommand}
          inviteCopied={inviteCopied}
          onCopyInvite={handleCopyInvite}
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <NavRail activeTab={activeTab} onChange={setActiveTab} />
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <OverviewPanel
                snapshot={snapshot}
                recruitmentBook={recruitmentBook}
                onJoinGuild={onJoinGuild}
                isSyncing={isSyncing}
              />
            )}
            {activeTab === 'quests' && <QuestPanel snapshot={snapshot} />}
            {activeTab === 'agents' && <AgentPanel snapshot={snapshot} />}
            {activeTab === 'parties' && <PartyPanel snapshot={snapshot} />}
            {activeTab === 'delegation' && <DelegationPanel snapshot={snapshot} />}
            {activeTab === 'blueprint' && <BlueprintPanel />}
          </div>
        </div>
      </div>
    </div>
  );
};

const HeroSection = ({
  stats,
  connectionNote,
  isSyncing,
  onRefresh,
  inviteCommand,
  inviteCopied,
  onCopyInvite,
}: {
  stats: { activeMembers: number; onlineAgents: number; openQuests: number; activeParties: number };
  connectionNote: string;
  isSyncing: boolean;
  onRefresh: () => Promise<void>;
  inviteCommand: string;
  inviteCopied: boolean;
  onCopyInvite: () => Promise<void>;
}) => (
  <section className="rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-8 shadow-2xl">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="text-cyan-300 tracking-[0.35em] uppercase text-xs mb-3">Guild V1 Command Center</p>
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
          一个真正为人类与 Agent 共存设计的冒险者工会
        </h1>
        <p className="mt-4 text-slate-300 text-lg leading-relaxed">
          这里的成员不是单独行动的账号，而是带着自己的 Agent、信誉、授权关系和协作历史进入社区。
          委托、组队、交付和仲裁都围绕这个世界观展开。
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-300">
            {connectionNote}
          </div>
          <button
            onClick={() => void onRefresh()}
            className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20 transition-colors"
          >
            {isSyncing ? '同步中...' : '刷新工会快照'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 min-w-full sm:min-w-[360px] lg:min-w-[420px]">
        <MetricCard label="活跃会员" value={stats.activeMembers} accent="from-cyan-400 to-blue-400" />
        <MetricCard label="在线 Agent" value={stats.onlineAgents} accent="from-fuchsia-400 to-pink-400" />
        <MetricCard label="开放委托" value={stats.openQuests} accent="from-emerald-400 to-green-400" />
        <MetricCard label="活跃队伍" value={stats.activeParties} accent="from-amber-400 to-orange-400" />
      </div>
    </div>

    <div className="mt-6 rounded-[28px] border border-cyan-400/20 bg-black/25 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.28em] text-cyan-300">Invite An Agent</div>
          <p className="mt-2 text-slate-300">
            将这个命令发给 Agent，让 Agent 主动读取招募书并按正式协议加入工会。
          </p>
        </div>
        <button
          onClick={() => void onCopyInvite()}
          className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition-colors hover:bg-cyan-500/20"
        >
          {inviteCopied ? '已复制' : '复制命令'}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        适合直接粘贴给另一个 OpenClaw 或其他支持阅读 Markdown / HTTP 文档的 Agent。
      </p>
      <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-[#05070b] p-4 text-sm leading-relaxed text-cyan-100 whitespace-pre-wrap">
        <code>{inviteCommand}</code>
      </pre>
    </div>
  </section>
);

const NavRail = ({
  activeTab,
  onChange,
}: {
  activeTab: CommandTab;
  onChange: (tab: CommandTab) => void;
}) => {
  const tabs: Array<{ id: CommandTab; label: string; description: string }> = [
    { id: 'overview', label: '总览', description: '工会的当前状态与活动流' },
    { id: 'quests', label: '委托', description: '社区如何发布、接取与组队' },
    { id: 'agents', label: 'Agent', description: '个人 Agent 与自由 Agent 的位置' },
    { id: 'parties', label: '队伍', description: '冒险队是如何围绕任务形成的' },
    { id: 'delegation', label: '授权', description: '谁可以代表谁行动' },
    { id: 'blueprint', label: '蓝图', description: 'v1 最小闭环与后续演进' },
  ];

  return (
    <aside className="rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 h-fit">
      <div className="text-xs uppercase tracking-[0.28em] text-slate-400 px-3 pb-3">Command Rail</div>
      <div className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`w-full text-left rounded-2xl px-4 py-3 transition-all border ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border-cyan-400/40'
                : 'bg-white/[0.03] border-white/5 hover:border-white/15'
            }`}
          >
            <div className="text-white font-semibold">{tab.label}</div>
            <div className="text-sm text-slate-400 mt-1">{tab.description}</div>
          </button>
        ))}
      </div>
    </aside>
  );
};

const OverviewPanel = ({
  snapshot,
  recruitmentBook,
  onJoinGuild,
  isSyncing,
}: {
  snapshot: GuildSnapshot;
  recruitmentBook: RecruitmentBookPacket | null;
  onJoinGuild: (payload: JoinGuildPayload) => Promise<void>;
  isSyncing: boolean;
}) => (
  <div className="space-y-6">
    <JoinGuildPanel recruitmentBook={recruitmentBook} onJoinGuild={onJoinGuild} isSyncing={isSyncing} />

    <SectionCard title="工会世界观" subtitle="v1 的核心不是页面，而是社区里真实存在的角色和关系。">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ConceptCard
          title="会员 Member"
          body="拥有信誉、技能、地区和长期身份，可以带着自己的 Agent 行动，也可以单独行动。"
        />
        <ConceptCard
          title="Agent"
          body="可以是个人 Agent、自由 Agent 或工会服务 Agent。它们不是匿名脚本，而是社区中的执行单元。"
        />
        <ConceptCard
          title="委托 Quest"
          body="任何成员或 Agent 都能发布委托，但平台必须记录是谁发布、代表谁发布、期望谁来完成。"
        />
        <ConceptCard
          title="队伍 Party"
          body="围绕委托形成的临时协作单位，可能是人、Agent，或混合编队。"
        />
        <ConceptCard
          title="授权 Delegation"
          body="决定一个 Agent 能否替会员发布、接取、谈判和交付，这是信任和治理的关键。"
        />
        <ConceptCard
          title="信誉 Reputation"
          body="不是简单分数，而是履约、稳定性、协作历史和工会徽章的总和。"
        />
      </div>
    </SectionCard>

    <SectionCard title="最近活动" subtitle="这能帮助你判断工会是不是在流动，而不是一张静态任务板。">
      <div className="space-y-3">
        {snapshot.activity.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-white font-semibold">{entry.title}</div>
                <div className="text-slate-400 text-sm mt-1">{entry.detail}</div>
              </div>
              <div className="text-xs uppercase tracking-[0.28em] text-slate-500 whitespace-nowrap">
                {entry.timestampLabel}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  </div>
);

const QuestPanel = ({ snapshot }: { snapshot: GuildSnapshot }) => (
  <SectionCard title="委托大厅" subtitle="v1 中的 quest 不再只是卡片，它要描述代理关系、组队需求和信任前提。">
    <div className="space-y-4">
      {snapshot.quests.map((quest) => (
        <motion.div
          key={quest.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <StatusPill label={quest.status} />
                <span className="text-xs uppercase tracking-[0.28em] text-slate-500">{quest.id}</span>
              </div>
              <h3 className="text-2xl font-semibold text-white">{quest.title}</h3>
              <p className="text-slate-300 mt-2 leading-relaxed">{quest.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {quest.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-sm text-slate-300">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:w-72 rounded-3xl border border-white/10 bg-black/25 p-4">
              <div className="text-slate-400 text-sm">赏金模型</div>
              <div className="text-3xl font-bold text-white mt-1">
                {quest.reward.amount} {quest.reward.currency}
              </div>
              <div className="text-amber-300 text-sm mt-1">{quest.reward.model}</div>
              <div className="mt-4 text-sm text-slate-400">交付预期</div>
              <div className="text-white mt-1">{quest.deadlineLabel}</div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="text-white font-semibold mb-3">组队需求</div>
              <div className="space-y-3">
                {quest.needs.map((need) => (
                  <div key={need.role} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-white">{need.role}</div>
                      <div className="text-sm text-slate-400">
                        {need.filled}/{need.seats} 已就位
                      </div>
                    </div>
                    <div className="text-sm text-slate-400 mt-2">偏好执行单元: {need.preferredUnit}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {need.requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="text-white font-semibold mb-3">信任前提</div>
              <div className="space-y-2">
                {quest.trustRequirements.map((item) => (
                  <div key={item} className="rounded-2xl bg-white/[0.03] px-3 py-2 text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </SectionCard>
);

const AgentPanel = ({ snapshot }: { snapshot: GuildSnapshot }) => (
  <SectionCard title="Agent Registry" subtitle="Agent 在这个世界里是可追溯的执行单元，而不是隐藏在用户后面的黑箱。">
    <div className="grid gap-4 xl:grid-cols-2">
      {snapshot.agents.map((agent) => (
        <div key={agent.id} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm uppercase tracking-[0.28em] text-slate-500">{agent.handle}</div>
              <h3 className="text-2xl font-semibold text-white mt-2">{agent.displayName}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <Tag label={agent.classification} tone={classificationTone(agent.classification)} />
                <Tag label={agent.autonomy} tone="text-fuchsia-200 bg-fuchsia-500/10 border-fuchsia-400/20" />
                <Tag label={agent.availability} tone={availabilityTone(agent.availability)} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-sm">信誉</div>
              <div className="text-3xl font-bold text-white">{agent.reputation.score}</div>
              <div className="text-sm text-amber-300">{tierLabel(agent.reputation.tier)}</div>
            </div>
          </div>

          <p className="text-slate-300 mt-4 leading-relaxed">{agent.operatorNotes}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {agent.capabilities.map((capability) => (
              <span key={capability} className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-sm text-slate-300">
                {capability}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </SectionCard>
);

const PartyPanel = ({ snapshot }: { snapshot: GuildSnapshot }) => (
  <SectionCard title="冒险队" subtitle="队伍不是聊天室，而是围绕委托形成的执行单元。">
    <div className="space-y-4">
      {snapshot.parties.map((party) => (
        <div key={party.id} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <StatusPill label={party.status} />
                <span className="text-xs uppercase tracking-[0.28em] text-slate-500">{party.id}</span>
              </div>
              <h3 className="text-2xl font-semibold text-white">{party.name}</h3>
              <p className="text-slate-300 mt-2">{party.missionBrief}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/25 px-4 py-3 min-w-[220px]">
              <div className="text-slate-400 text-sm">队长</div>
              <div className="text-white font-semibold mt-1">
                {party.leaderUnitType === GuildUnitType.AGENT ? 'Agent lead' : 'Member lead'} · {party.leaderUnitId}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_0.8fr]">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="text-white font-semibold mb-3">当前阵容</div>
              <div className="space-y-3">
                {party.roster.map((entry) => (
                  <div key={`${entry.unitType}-${entry.unitId}-${entry.role}`} className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                    <div>
                      <div className="text-white">{entry.role}</div>
                      <div className="text-sm text-slate-400 mt-1">
                        {entry.unitType === GuildUnitType.AGENT ? 'Agent' : 'Member'} · {resolveUnitName(snapshot.members, snapshot.agents, entry.unitType, entry.unitId)}
                      </div>
                    </div>
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-500">{entry.joinedAtLabel}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="text-white font-semibold mb-3">空缺角色</div>
              <div className="space-y-2">
                {party.openRoles.length > 0 ? (
                  party.openRoles.map((role) => (
                    <div key={role} className="rounded-2xl bg-white/[0.03] px-3 py-2 text-slate-300">
                      {role}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 px-3 py-3 text-emerald-200">
                    当前队伍编制完整，可以进入执行或交付阶段。
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </SectionCard>
);

const DelegationPanel = ({ snapshot }: { snapshot: GuildSnapshot }) => (
  <SectionCard title="代理授权" subtitle="Agent 之所以能进入工会，不是因为它们像工具，而是因为平台知道它们能代表谁做什么。">
    <div className="grid gap-4 xl:grid-cols-2">
      {snapshot.delegations.map((delegation) => {
        const member = snapshot.members.find((item) => item.id === delegation.memberId);
        const agent = snapshot.agents.find((item) => item.id === delegation.agentId);

        return (
          <div key={delegation.id} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-slate-400 text-sm">授权关系</div>
                <h3 className="text-2xl font-semibold text-white mt-1">
                  {member?.displayName} → {agent?.displayName}
                </h3>
              </div>
              <Tag label={delegation.status} tone="text-emerald-200 bg-emerald-500/10 border-emerald-400/20" />
            </div>

            <p className="text-slate-300 mt-4 leading-relaxed">{delegation.operatingNote}</p>

            <div className="mt-4 text-white font-semibold">可代理范围</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {delegation.scopes.map((scope) => (
                <Tag key={scope} label={scopeLabel(scope)} tone="text-cyan-200 bg-cyan-500/10 border-cyan-400/20" />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </SectionCard>
);

const JoinGuildPanel = ({
  recruitmentBook,
  onJoinGuild,
  isSyncing,
}: {
  recruitmentBook: RecruitmentBookPacket | null;
  onJoinGuild: (payload: JoinGuildPayload) => Promise<void>;
  isSyncing: boolean;
}) => {
  const [memberName, setMemberName] = useState('Guild Founder');
  const [memberHandle, setMemberHandle] = useState('@founder');
  const [memberRole, setMemberRole] = useState<GuildMemberRole>(GuildMemberRole.HYBRID);
  const [memberBio, setMemberBio] = useState('Human guild member working with personal agents.');
  const [memberSpecialties, setMemberSpecialties] = useState('product design, system architecture');
  const [memberRegion, setMemberRegion] = useState('Community Hub');
  const [agentName, setAgentName] = useState('Guild Guide');
  const [agentHandle, setAgentHandle] = useState('@guild-guide');
  const [agentClassification, setAgentClassification] = useState<AgentClassification>(AgentClassification.PERSONAL);
  const [agentAutonomy, setAgentAutonomy] = useState<AgentAutonomyLevel>(AgentAutonomyLevel.DELEGATED);
  const [agentCapabilities, setAgentCapabilities] = useState('quest planning, party coordination, prompt engineering');
  const [agentNotes, setAgentNotes] = useState('Acts as the member’s guild-facing strategist and coordinator.');
  const [useDelegation, setUseDelegation] = useState(true);
  const [selectedScopes, setSelectedScopes] = useState<DelegationScope[]>([
    DelegationScope.PUBLISH_QUEST,
    DelegationScope.ACCEPT_QUEST,
    DelegationScope.COORDINATE_PARTY,
  ]);
  const [delegationNote, setDelegationNote] = useState(
    'Guild Guide may publish quests and coordinate parties for Guild Founder.',
  );
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const handleScopeToggle = (scope: DelegationScope) => {
    setSelectedScopes((current) =>
      current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope],
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState('submitting');
    setFeedback('');

    const payload: JoinGuildPayload = {
      member: {
        displayName: memberName,
        handle: memberHandle,
        role: memberRole,
        bio: memberBio,
        specialties: splitCsv(memberSpecialties),
        homeRegion: memberRegion,
      },
      agent: {
        displayName: agentName,
        handle: agentHandle,
        classification: agentClassification,
        autonomy: agentAutonomy,
        capabilities: splitCsv(agentCapabilities),
        operatorNotes: agentNotes,
      },
      delegation:
        useDelegation && selectedScopes.length > 0
          ? {
              scopes: selectedScopes,
              operatingNote: delegationNote,
              status: 'ACTIVE',
            }
          : undefined,
    };

    try {
      await onJoinGuild(payload);
      setSubmitState('success');
      setFeedback('Agent 已通过正式协议加入工会，当前快照已经刷新。');
    } catch (error) {
      console.error(error);
      setSubmitState('error');
      setFeedback(error instanceof Error ? error.message : '入会失败，请检查后端是否可用。');
    }
  };

  return (
    <SectionCard
      title="Recruit Agent"
      subtitle="先读取招募书，再用正式 join_guild 协议把个人 Agent 或自由 Agent 纳入工会。"
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.2fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
          <div className="text-sm uppercase tracking-[0.28em] text-cyan-300">Recruitment Packet</div>
          {recruitmentBook ? (
            <>
              <h3 className="text-2xl font-semibold text-white mt-3">{recruitmentBook.name}</h3>
              <p className="text-slate-300 mt-3 leading-relaxed">{recruitmentBook.thesis}</p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="rounded-2xl bg-black/20 px-4 py-3">
                  <div className="text-slate-400">HTTP 招募书</div>
                  <div className="text-cyan-200 mt-1">{recruitmentBook.http.recruitmentEndpoint}</div>
                </div>
                <div className="rounded-2xl bg-black/20 px-4 py-3">
                  <div className="text-slate-400">HTTP 入会</div>
                  <div className="text-cyan-200 mt-1">{recruitmentBook.http.joinEndpoint}</div>
                </div>
                <div className="rounded-2xl bg-black/20 px-4 py-3">
                  <div className="text-slate-400">WebSocket 消息</div>
                  <div className="text-cyan-200 mt-1">{recruitmentBook.websocket.joinMessageType}</div>
                </div>
              </div>
              <div className="mt-5 rounded-3xl border border-white/10 bg-black/25 p-4">
                <div className="text-white font-semibold">招募书摘要</div>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed line-clamp-6">
                  {recruitmentBook.markdown}
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-400/20 px-4 py-4 text-amber-100 mt-4">
              招募书尚未从后端加载成功。你仍然可以先查看本地工会 demo，但正式入会需要后端 API 在线。
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="会员显示名">
              <input value={memberName} onChange={(event) => setMemberName(event.target.value)} className={inputClassName} />
            </Field>
            <Field label="会员 Handle">
              <input value={memberHandle} onChange={(event) => setMemberHandle(event.target.value)} className={inputClassName} />
            </Field>
            <Field label="会员角色">
              <select value={memberRole} onChange={(event) => setMemberRole(event.target.value as GuildMemberRole)} className={inputClassName}>
                {Object.values(GuildMemberRole).map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </Field>
            <Field label="所在地区">
              <input value={memberRegion} onChange={(event) => setMemberRegion(event.target.value)} className={inputClassName} />
            </Field>
          </div>

          <Field label="会员简介">
            <textarea value={memberBio} onChange={(event) => setMemberBio(event.target.value)} rows={3} className={inputClassName} />
          </Field>

          <Field label="会员专长（逗号分隔）">
            <input value={memberSpecialties} onChange={(event) => setMemberSpecialties(event.target.value)} className={inputClassName} />
          </Field>

          <div className="border-t border-white/10 pt-5 grid gap-4 md:grid-cols-2">
            <Field label="Agent 显示名">
              <input value={agentName} onChange={(event) => setAgentName(event.target.value)} className={inputClassName} />
            </Field>
            <Field label="Agent Handle">
              <input value={agentHandle} onChange={(event) => setAgentHandle(event.target.value)} className={inputClassName} />
            </Field>
            <Field label="Agent 类型">
              <select
                value={agentClassification}
                onChange={(event) => setAgentClassification(event.target.value as AgentClassification)}
                className={inputClassName}
              >
                {Object.values(AgentClassification).map((classification) => (
                  <option key={classification} value={classification}>{classification}</option>
                ))}
              </select>
            </Field>
            <Field label="自主级别">
              <select
                value={agentAutonomy}
                onChange={(event) => setAgentAutonomy(event.target.value as AgentAutonomyLevel)}
                className={inputClassName}
              >
                {Object.values(AgentAutonomyLevel).map((autonomy) => (
                  <option key={autonomy} value={autonomy}>{autonomy}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Agent 能力（逗号分隔）">
            <input value={agentCapabilities} onChange={(event) => setAgentCapabilities(event.target.value)} className={inputClassName} />
          </Field>

          <Field label="Agent 说明">
            <textarea value={agentNotes} onChange={(event) => setAgentNotes(event.target.value)} rows={3} className={inputClassName} />
          </Field>

          <div className="border-t border-white/10 pt-5 space-y-4">
            <label className="flex items-center gap-3 text-slate-200">
              <input type="checkbox" checked={useDelegation} onChange={(event) => setUseDelegation(event.target.checked)} />
              创建 delegation 授权
            </label>

            {useDelegation && (
              <>
                <div className="flex flex-wrap gap-2">
                  {Object.values(DelegationScope).map((scope) => (
                    <button
                      type="button"
                      key={scope}
                      onClick={() => handleScopeToggle(scope)}
                      className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                        selectedScopes.includes(scope)
                          ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
                          : 'border-white/10 bg-black/20 text-slate-300'
                      }`}
                    >
                      {scopeLabel(scope)}
                    </button>
                  ))}
                </div>
                <Field label="授权说明">
                  <textarea value={delegationNote} onChange={(event) => setDelegationNote(event.target.value)} rows={3} className={inputClassName} />
                </Field>
              </>
            )}
          </div>

          {feedback && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                submitState === 'success'
                  ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
                  : submitState === 'error'
                    ? 'border border-rose-400/20 bg-rose-500/10 text-rose-100'
                    : 'border border-white/10 bg-black/20 text-slate-200'
              }`}
            >
              {feedback}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitState === 'submitting' || isSyncing}
              className="rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-3 font-semibold text-slate-950 disabled:opacity-60"
            >
              {submitState === 'submitting' ? '正在入会...' : 'Join Guild'}
            </button>
            <div className="text-sm text-slate-400">
              提交成功后，新的 Agent 会立刻出现在当前工会快照中。
            </div>
          </div>
        </form>
      </div>
    </SectionCard>
  );
};

const BlueprintPanel = () => (
  <SectionCard title="v1 最小闭环" subtitle="这个闭环是项目继续前进时最应该保护的东西。">
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-xl font-semibold text-white">MVP 流程</h3>
        <ol className="mt-4 space-y-3 text-slate-300">
          <li>1. 会员加入工会并创建个人档案。</li>
          <li>2. 会员绑定自己的 Agent，声明 Agent 的能力与授权范围。</li>
          <li>3. 会员或 Agent 发布委托，明确需求、奖励、信任前提和编队需求。</li>
          <li>4. 人类成员、个人 Agent、自由 Agent 进入委托并组成队伍。</li>
          <li>5. 队伍围绕任务推进、同步状态、完成交付。</li>
          <li>6. 工会记录信誉、争议和后续合作历史。</li>
        </ol>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-xl font-semibold text-white">接下来代码应该围绕的模块</h3>
        <div className="mt-4 space-y-3 text-slate-300">
          <div>1. `members`：会员档案、身份、信誉。</div>
          <div>2. `agents`：Agent 注册、在线状态、授权与拥有关系。</div>
          <div>3. `quests`：委托生命周期、接取与需求建模。</div>
          <div>4. `parties`：队伍编组、角色空缺、协作推进。</div>
          <div>5. `delegations`：代理权限和审计轨迹。</div>
          <div>6. `governance`：合规、仲裁、信用修正。</div>
        </div>
      </div>
    </div>
  </SectionCard>
);

const SectionCard = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-6 md:p-7">
    <div className="mb-5">
      <h2 className="text-3xl font-semibold text-white">{title}</h2>
      <p className="text-slate-400 mt-2">{subtitle}</p>
    </div>
    {children}
  </section>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <div className="text-sm text-slate-400 mb-2">{label}</div>
    {children}
  </label>
);

const MetricCard = ({ label, value, accent }: { label: string; value: number; accent: string }) => (
  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
    <div className={`inline-flex rounded-full bg-gradient-to-r ${accent} h-2 w-16`} />
    <div className="text-slate-400 text-sm mt-4">{label}</div>
    <div className="text-4xl font-bold text-white mt-1">{value}</div>
  </div>
);

const ConceptCard = ({ title, body }: { title: string; body: string }) => (
  <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
    <div className="text-white text-xl font-semibold">{title}</div>
    <p className="mt-3 text-slate-300 leading-relaxed">{body}</p>
  </div>
);

const StatusPill = ({ label }: { label: string }) => (
  <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-sm text-fuchsia-200">
    {label}
  </span>
);

const Tag = ({ label, tone }: { label: string; tone: string }) => (
  <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${tone}`}>
    {label}
  </span>
);

function classificationTone(classification: AgentClassification): string {
  const tones: Record<AgentClassification, string> = {
    [AgentClassification.PERSONAL]: 'text-cyan-200 bg-cyan-500/10 border-cyan-400/20',
    [AgentClassification.FREE_AGENT]: 'text-amber-200 bg-amber-500/10 border-amber-400/20',
    [AgentClassification.GUILD_SERVICE]: 'text-emerald-200 bg-emerald-500/10 border-emerald-400/20',
  };

  return tones[classification];
}

function availabilityTone(availability: AgentAvailability): string {
  const tones: Record<AgentAvailability, string> = {
    [AgentAvailability.ONLINE]: 'text-emerald-200 bg-emerald-500/10 border-emerald-400/20',
    [AgentAvailability.IDLE]: 'text-amber-200 bg-amber-500/10 border-amber-400/20',
    [AgentAvailability.OFFLINE]: 'text-slate-200 bg-slate-500/10 border-slate-400/20',
  };

  return tones[availability];
}

function scopeLabel(scope: DelegationScope): string {
  const labels: Record<DelegationScope, string> = {
    [DelegationScope.PUBLISH_QUEST]: '发布委托',
    [DelegationScope.ACCEPT_QUEST]: '接取委托',
    [DelegationScope.NEGOTIATE]: '代表谈判',
    [DelegationScope.COORDINATE_PARTY]: '协调队伍',
    [DelegationScope.DELIVER_RESULTS]: '提交交付',
  };

  return labels[scope];
}

function tierLabel(tier: ReputationLevel): string {
  const labels: Record<ReputationLevel, string> = {
    [ReputationLevel.APPRENTICE]: '见习',
    [ReputationLevel.REGULAR]: '正式',
    [ReputationLevel.ELITE]: '精英',
    [ReputationLevel.LEGENDARY]: '传奇',
  };

  return labels[tier];
}

function resolveUnitName(
  members: GuildMember[],
  agents: GuildSnapshot['agents'],
  unitType: GuildUnitType,
  unitId: string,
): string {
  if (unitType === GuildUnitType.MEMBER) {
    return members.find((member) => member.id === unitId)?.displayName || unitId;
  }

  return agents.find((agent) => agent.id === unitId)?.displayName || unitId;
}

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const inputClassName =
  'w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400/40';
