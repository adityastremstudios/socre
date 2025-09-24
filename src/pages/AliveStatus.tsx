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

    // Initial load
    loadData();

    // Listen for updates from Scoreboard
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
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">Alive Status</h1>
      <p className="text-lg mb-6">Match Time: {formatTime(matchTime)}</p>

      <table className="w-full border-collapse text-center shadow-lg">
        <thead className="bg-blue-900 text-white">
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">Team</th>
            <th className="p-2">Alive Players</th>
            <th className="p-2">FIN (Kills)</th>
            <th className="p-2">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, idx) => {
            const aliveCount = team.players.filter((p) => !p.eliminated).length;
            const totalKills = team.players.reduce((s, p) => s + p.kills, 0);
            const totalScore = totalKills + aliveCount; // Example formula

            return (
              <tr
                key={team.id}
                className={idx % 2 === 0 ? "bg-gray-800" : "bg-gray-700"}
              >
                {/* Position */}
                <td className="p-2 font-bold">{idx + 1}</td>

                {/* Team name + logo */}
                <td className="flex items-center space-x-2 justify-center p-2">
                  <img
                    src={team.logo}
                    alt="logo"
                    className="w-8 h-8 rounded"
                  />
                  <span>{team.name}</span>
                </td>

                {/* Alive Player Bars */}
                <td className="p-2">
                  <div className="flex space-x-1 justify-center">
                    {team.players.map((p, i) => (
                      <div
                        key={i}
                        title={`${p.name} (${p.kills} kills)`}
                        className={`w-4 h-6 rounded ${
                          p.eliminated ? "bg-red-600" : "bg-green-400"
                        }`}
                      />
                    ))}
                  </div>
                </td>

                {/* Kills */}
                <td className="p-2">{totalKills}</td>

                {/* Total */}
                <td className="p-2 font-bold text-teal-400">{totalScore}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
