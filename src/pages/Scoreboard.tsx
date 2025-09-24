import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TeamsContext } from "../context/TeamsContext";
import { ref, set } from "firebase/database";
import { db } from "../firebaseConfig";

export default function Scoreboard() {
  const { teams } = useContext(TeamsContext);
  const navigate = useNavigate();

  const [teamData, setTeamData] = useState(
    teams.map((t) => ({
      ...t,
      eliminated: false,
      players: t.players.map((p: string) => ({
        name: p,
        kills: 0,
        eliminated: false,
        survivalTime: 0,
        running: true,
      })),
    }))
  );

  const [matchTime, setMatchTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Match Timer
  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => setMatchTime((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Player survival timers
  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setTeamData((prev) =>
          prev.map((team) => ({
            ...team,
            players: team.players.map((p) =>
              p.running && !p.eliminated
                ? { ...p, survivalTime: p.survivalTime + 1 }
                : p
            ),
          }))
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // ✅ Sync to Firebase on changes
  useEffect(() => {
    const data = { teams: teamData, matchTime };
    set(ref(db, "matchData"), data);
  }, [teamData, matchTime]);

  // --- Utility functions ---
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const togglePlayerElim = (teamId: number, playerIndex: number, value: boolean) => {
    setTeamData((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? {
              ...team,
              players: team.players.map((player, i) =>
                i === playerIndex
                  ? { ...player, eliminated: value, running: !value }
                  : player
              ),
              eliminated: team.players.every((pl, i) =>
                i === playerIndex ? value : pl.eliminated
              ),
            }
          : team
      )
    );
  };

  const updatePlayerKills = (teamId: number, playerIndex: number, delta: number) => {
    setTeamData((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? {
              ...team,
              players: team.players.map((player, i) =>
                i === playerIndex
                  ? { ...player, kills: Math.max(0, player.kills + delta) }
                  : player
              ),
            }
          : team
      )
    );
  };

  const toggleTeamElim = (teamId: number, value: boolean) => {
    setTeamData((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? {
              ...team,
              eliminated: value,
              players: team.players.map((p) => ({
                ...p,
                eliminated: value,
                running: !value,
              })),
            }
          : team
      )
    );
  };

  return (
    <div className="p-6">
      <div className="flex space-x-3 mb-4">
        <button onClick={() => navigate("/")} className="bg-gray-600 text-white px-4 py-2 rounded">
          ⬅ Back to Teams
        </button>
      </div>

      {/* Timer + Controls */}
      <div className="bg-gray-900 text-white rounded-lg p-4 mb-6 flex justify-between">
        <div className="text-lg font-mono">{formatTime(matchTime)}</div>
        <div className="space-x-2">
          <button onClick={() => setIsRunning(!isRunning)} className="bg-blue-500 px-4 py-2 rounded">
            {isRunning ? "Pause" : "Start"}
          </button>
          <button onClick={() => { setIsRunning(false); setMatchTime(0); }} className="bg-yellow-500 px-4 py-2 rounded">
            Reset
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teamData.map((team, idx) => {
          const teamKills = team.players.reduce((s, p) => s + p.kills, 0);
          return (
            <div key={team.id} className="border rounded-lg p-4 bg-white shadow">
              <div className="flex justify-between mb-4">
                <h2 className="font-bold text-lg">#{idx + 1} {team.name}</h2>
                <div>{teamKills} kills</div>
                <label>
                  <input type="checkbox" checked={team.eliminated} onChange={(e) => toggleTeamElim(team.id, e.target.checked)} />
                  Team Elim
                </label>
              </div>

              <ul className="space-y-2">
                {team.players.map((p, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{p.name} ({formatTime(p.survivalTime)})</span>
                    <div className="flex space-x-2">
                      <button onClick={() => updatePlayerKills(team.id, i, +1)} disabled={p.eliminated}>+</button>
                      <span>{p.kills}</span>
                      <button onClick={() => updatePlayerKills(team.id, i, -1)} disabled={p.eliminated}>-</button>
                      <input type="checkbox" checked={p.eliminated} onChange={(e) => togglePlayerElim(team.id, i, e.target.checked)} /> Elim
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
