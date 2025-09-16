import { useContext, useState, useEffect } from "react";
import { TeamsContext } from "../context/TeamsContext";

export default function Scoreboard() {
  const { teams } = useContext(TeamsContext);

  const [teamData, setTeamData] = useState(
    teams.map((t) => ({
      ...t,
      eliminated: false,
      players: t.players.map((p) => ({
        name: p,
        kills: 0,
        eliminated: false,
      })),
    }))
  );

  const [matchTime, setMatchTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Timer
  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => setMatchTime((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Stats
  const totalKills = teamData.reduce(
    (sum, team) => sum + team.players.reduce((s, p) => s + p.kills, 0),
    0
  );
  const totalPlayers = teamData.reduce((sum, t) => sum + t.players.length, 0);
  const alivePlayers = teamData.reduce(
    (sum, team) => sum + team.players.filter((p) => !p.eliminated).length,
    0
  );
  const aliveTeams = teamData.filter(
    (team) => team.players.some((p) => !p.eliminated)
  ).length;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const updatePlayer = (teamId, playerIndex, field, value) => {
    setTeamData((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? {
              ...team,
              players: team.players.map((player, i) =>
                i === playerIndex ? { ...player, [field]: value } : player
              ),
              eliminated: team.players.every((pl, i) =>
                i === playerIndex ? value : pl.eliminated
              ),
            }
          : team
      )
    );
  };

  return (
    <div className="p-6">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white rounded-lg p-4 mb-6 flex flex-wrap justify-between items-center">
        <div className="flex space-x-6">
          <div>
            <p className="text-sm text-gray-300">Alive Players</p>
            <p className="text-xl font-bold">{alivePlayers}</p>
          </div>
          <div>
            <p className="text-sm text-gray-300">Alive Teams</p>
            <p className="text-xl font-bold">{aliveTeams}</p>
          </div>
          <div>
            <p className="text-sm text-gray-300">Total Kills</p>
            <p className="text-xl font-bold

