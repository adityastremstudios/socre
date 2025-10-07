import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";

type Player = { name: string; eliminated: boolean; kills: number };
type Team = { id: number; name: string; logo?: string; eliminated: boolean; players: Player[] };

export default function AliveStatus() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchTime, setMatchTime] = useState(0);

  useEffect(() => {
    const matchRef = ref(db, "matchData");
    onValue(matchRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTeams(data.teams || []);
        setMatchTime(data.matchTime || 0);
      } else {
        setTeams([]);
        setMatchTime(0);
      }
    });
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div
      className="w-screen h-screen bg-black text-white p-6 flex flex-col"
      style={{
        backgroundImage: "url('/gfx/bg.png')", // ✅ your background GFX
        backgroundSize: "cover",
      }}
    >
      {/* Header with timer */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">LIVE MATCH</h1>
        <span className="text-3xl font-mono">{formatTime(matchTime)}</span>
      </div>

      {/* Teams grid */}
      <div className="grid grid-cols-2 gap-6">
        {teams.map((team) => {
          const alivePlayers = team.players.filter((p) => !p.eliminated).length;
          return (
            <div
              key={team.id}
              className={`rounded-2xl p-4 relative`}
              style={{
                backgroundImage: "url('/gfx/team-card.png')", // ✅ custom team card asset
                backgroundSize: "cover",
              }}
            >
              {/* Team header */}
              <div className="flex items-center mb-3">
                {team.logo && (
                  <img
                    src={team.logo}
                    alt="logo"
                    className="w-10 h-10 rounded-full mr-3"
                  />
                )}
                <h2 className="text-xl font-bold">{team.name}</h2>
                <span className="ml-auto text-lg">
                  {alivePlayers}/{team.players.length}
                </span>
              </div>

              {/* Player bars */}
              <div className="space-y-2">
                {team.players.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className={`flex-1 h-4 rounded ${
                        p.eliminated ? "bg-yellow-600/70" : "bg-green-400"
                      }`}
                    />
                    <span className="text-sm">{p.name}</span>
                    <span className="text-sm">({p.kills})</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Watermark */}
      <div className="absolute bottom-4 right-4 opacity-60">
        <img src="/gfx/watermark.png" className="h-12" />
      </div>
    </div>
  );
}
