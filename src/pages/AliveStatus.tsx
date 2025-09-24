import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";

type Player = { name: string; eliminated: boolean; kills: number };
type Team = { id: number; name: string; logo: string; eliminated: boolean; players: Player[] };

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
      }
    });
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="bg-transparent text-white min-h-screen p-6">
      <h1 className="text-3xl mb-4">Match Time: {formatTime(matchTime)}</h1>
      <table className="w-full border-collapse text-center">
        <thead>
          <tr className="bg-black/60 text-lg">
            <th>#</th><th>Team</th><th>Alive</th><th>Kills</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, idx) => {
            const aliveCount = team.players.filter((p) => !p.eliminated).length;
            const totalKills = team.players.reduce((s, p) => s + p.kills, 0);
            return (
              <tr key={team.id} className="bg-black/40 text-xl">
                <td>{idx + 1}</td>
                <td className="flex items-center justify-center space-x-2">
                  {team.logo && <img src={team.logo} alt="logo" className="w-8 h-8 rounded" />}
                  <span>{team.name}</span>
                </td>
                <td>
                  <div className="flex space-x-1 justify-center">
                    {team.players.map((p, i) => (
                      <div key={i} className={`w-4 h-6 rounded ${p.eliminated ? "bg-red-600" : "bg-green-400"}`} />
                    ))}
                  </div>
                </td>
                <td>{totalKills}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
