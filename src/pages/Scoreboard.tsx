import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TeamsContext } from "../context/TeamsContext";

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

  // Global match timer
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

  // Save to localStorage whenever match state changes
  useEffect(() => {
    const data = { teams: teamData, matchTime };
    localStorage.setItem("matchData", JSON.stringify(data));
  }, [teamData, matchTime]);

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

  // Toggle individual player elimination
  const togglePlayerElim = (
    teamId: number,
    playerIndex: number,
    value: boolean
  ) => {
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

  // Update kills
  const updatePlayerKills = (
    teamId: number,
    playerIndex: number,
    delta: number
  ) => {
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

  // Toggle team elimination
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

  // Manual reorder
  const moveTeam = (index: number, direction: "up" | "down") => {
    setTeamData((prev) => {
      const newTeams = [...prev];
      if (direction === "up" && index > 0) {
        [newTeams[index - 1], newTeams[index]] = [
          newTeams[index],
          newTeams[index - 1],
        ];
      }
      if (direction === "down" && index < newTeams.length - 1) {
        [newTeams[index], newTeams[index + 1]] = [
          newTeams[index + 1],
          newTeams[index],
        ];
      }
      return newTeams;
    });
  };

  // Auto sort eliminated teams down
  useEffect(() => {
    setTeamData((prev) => {
      const alive = prev.filter((t) => !t.eliminated);
      const eliminated = prev.filter((t) => t.eliminated);
      return [...alive, ...eliminated];
    });
  }, [teamData.map((t) => t.eliminated).join(",")]);

  // Reset the match (with confirmation)
  const resetMatch = () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset the match? This will clear all kills, eliminations, and timers!"
    );
    if (!confirmed) return;

    setIsRunning(false);
    setMatchTime(0);

    setTeamData((prev) =>
      prev.map((team) => ({
        ...team,
        eliminated: false,
        players: team.players.map((p) => ({
          ...p,
          kills: 0,
          eliminated: false,
          survivalTime: 0,
          running: true,
        })),
      }))
    );

    localStorage.removeItem("matchData");
  };

  return (
    <div className="p-6">
      {/* Back + Reset Buttons */}
      <div className="flex space-x-3 mb-4">
        <button
          onClick={() => navigate("/")}
          className="bg-gray-600 text-white px-4 py-2 rounded"
        >
          ⬅ Back to Teams
        </button>
        <button
          onClick={resetMatch}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          🔄 Reset Match
        </button>
      </div>

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
            <p className="text-xl font-bold">{totalKills}</p>
          </div>
          <div>
            <p className="text-sm text-gray-300">Total Players</p>
            <p className="text-xl font-bold">{totalPlayers}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <p className="text-lg font-mono">{formatTime(matchTime)}</p>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="bg-blue-500 px-4 py-2 rounded"
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setMatchTime(0);
            }}
            className="bg-yellow-500 px-4 py-2 rounded"
          >
            Reset Timer
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teamData.map((team, idx) => {
          const teamKills = team.players.reduce((s, p) => s + p.kills, 0);

          return (
            <div key={team.id} className="border rounded-lg p-4 bg-white shadow">
              {/* Team Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-xl">#{idx + 1}</span>
                  <img
                    src={team.logo}
                    alt="logo"
                    className="w-10 h-10 object-cover rounded"
                  />
                  <h2 className="font-semibold">{team.name}</h2>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="font-bold">{teamKills} Kills</div>
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={team.eliminated}
                      onChange={(e) => toggleTeamElim(team.id, e.target.checked)}
                    />
                    <span className="text-sm">Elim</span>
                  </label>
                  <div className="flex flex-col">
                    <button
                      className="px-2 py-1 bg-gray-200 rounded"
                      onClick={() => moveTeam(idx, "up")}
                    >
                      ▲
                    </button>
                    <button
                      className="px-2 py-1 bg-gray-200 rounded mt-1"
                      onClick={() => moveTeam(idx, "down")}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              {/* Players */}
              <ul className="space-y-2">
                {team.players.map((player, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center border-b pb-1"
                  >
                    <span>
                      {player.name}{" "}
                      <span className="text-xs text-gray-500">
                        ({formatTime(player.survivalTime)})
                      </span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        className="px-2 bg-green-300 rounded"
                        onClick={() => updatePlayerKills(team.id, i, +1)}
                        disabled={player.eliminated}
                      >
                        +
                      </button>
                      <span>{player.kills}</span>
                      <button
                        className="px-2 bg-red-300 rounded"
                        onClick={() => updatePlayerKills(team.id, i, -1)}
                        disabled={player.eliminated}
                      >
                        -
                      </button>
                      <label className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          checked={player.eliminated}
                          onChange={(e) =>
                            togglePlayerElim(team.id, i, e.target.checked)
                          }
                        />
                        <span className="text-sm">Elim</span>
                      </label>
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


