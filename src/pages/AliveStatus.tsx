import { useEffect, useState } from "react";

type Player = {
  name: string;
  eliminated: boolean;
  kills: number;
};

type Team = {
  id: number;
  name: string;
  logo: string;
  eliminated: boolean;
  players: Player[];
};

export default function AliveStatus() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchTime, setMatchTime] = useState(0);

  // Load & listen to localStorage updates
  useEffect(() => {
    const loadData = () => {
      const saved = localStorage.getItem("matchData");
      if (saved) {
        const parsed = JSON.parse(saved);
        setTeams(parsed.teams || []);
        setMatchTime(parsed.matchTime || 0);
      }
    };

    loadData();

    const handler = (e: StorageEvent) => {
      if (e.key === "matchData" && e.newValue) {
        const parsed = JSON.parse(e.newValue);
        setTeams(parsed.teams || []);
        setMatchTime(parsed.matchTime || 0);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="bg-transparent text-white min-h-screen p-4">
      {/* Match Timer */}
      <div className="text-center text-5xl font-bold mb-6">
        ⏱ {formatTime(matchTime)}
      </div>

      {/* Teams Ranking Table */}
      <table className="w-full border-collapse text-center">
        <thead>
          <tr className="bg-black/60 text-xl">
            <th className="p-3">#</th>
            <th className="p-3">Team</th>
            <th className="p-3">Alive</th>
            <th className="p-3">Kills</th>
            <th className="p-3">Total</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, idx) => {
            const aliveCount = team.players.filter((p) => !p.eliminated).length;
            const totalKills = team.players.reduce((s, p) => s + p.kills, 0);
            const totalScore = totalKills + aliveCount; // example formula

            return (
              <tr
                key={team.id}
                className="bg-black/40 text-2xl font-semibold"
              >
                {/* Rank */}
                <td className="p-3">{idx + 1}</td>

                {/* Team name + logo */}
                <td className="flex items-center justify-center space-x-3 p-3">
                  <img
                    src={team.logo}
                    alt="logo"
                    className="w-10 h-10 rounded"
                  />
                  <span>{team.name}</span>
                </td>

                {/* Alive players (bars) */}
                <td className="p-3">
                  <div className="flex space-x-1 justify-center">
                    {team.players.map((p, i) => (
                      <div
                        key={i}
                        className={`w-5 h-8 rounded ${
                          p.eliminated ? "bg-red-600" : "bg-green-400"
                        }`}
                        title={`${p.name} (${p.kills} kills)`}
                      />
                    ))}
                  </div>
                </td>

                {/* Kills */}
                <td className="p-3">{totalKills}</td>

                {/* Total */}
                <td className="p-3 text-teal-400">{totalScore}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
