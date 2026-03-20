import { useEffect, useState } from 'react';
import { GuildSnapshot, JoinGuildPayload, RecruitmentBookPacket } from '../types';
import { GuildCommandCenter } from './components/GuildCommandCenter';
import { guildV1Demo } from './data/guildV1Demo';
import { fetchGuildSnapshot, fetchRecruitmentBook, joinGuild } from './lib/guildApi';

function App() {
  const [snapshot, setSnapshot] = useState<GuildSnapshot>(guildV1Demo);
  const [recruitmentBook, setRecruitmentBook] = useState<RecruitmentBookPacket | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionNote, setConnectionNote] = useState('当前显示的是本地协会演示数据。');

  useEffect(() => {
    void refreshGuildData();
  }, []);

  const refreshGuildData = async () => {
    setIsSyncing(true);

    try {
      const [nextSnapshot, nextBook] = await Promise.all([fetchGuildSnapshot(), fetchRecruitmentBook()]);
      setSnapshot(nextSnapshot);
      setRecruitmentBook(nextBook);
      setConnectionNote('已连接后端，当前展示真实 guild snapshot。');
    } catch (error) {
      console.error(error);
      setConnectionNote('后端未连接，当前回退到本地 demo 数据。');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleJoinGuild = async (payload: JoinGuildPayload) => {
    const nextSnapshot = await joinGuild(payload);
    setSnapshot(nextSnapshot);

    if (!recruitmentBook) {
      const nextBook = await fetchRecruitmentBook();
      setRecruitmentBook(nextBook);
    }

    setConnectionNote('新的 Agent 已通过正式入会协议加入协会。');
  };

  return (
    <GuildCommandCenter
      snapshot={snapshot}
      recruitmentBook={recruitmentBook}
      isSyncing={isSyncing}
      connectionNote={connectionNote}
      onRefresh={refreshGuildData}
      onJoinGuild={handleJoinGuild}
    />
  );
}

export default App;
