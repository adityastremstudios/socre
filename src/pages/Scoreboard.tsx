import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeamsContext } from "../context/TeamsContext";
import { ref, set, remove } from "firebase/database";
import { db } from "../firebaseConfig";

type PlayerState = {
  name: string;
  kills: number;
  eliminated: boolean;
  survivalTime: number;
  running: boolean;
};

type TeamState = {
  id: number;
  name: string;
  logo?: string;
  eliminated: boolean;
  players: PlayerState[];
};

export default function Scoreboard() {
  const { teams } = useContext(TeamsContext);
  const navigate = useNavigate();

  const [teamData, setTeamData] = useState<TeamState[]>(
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

  // ===== TIMER =====
  useEffect(() => {
    let id: any;
    if (isRunning) id = setInterval(() => setMatchTime((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // Per-player survival timers
  useEffect(() => {
    let id: any;
    if (isRunning) {
      id = setInterval(() => {
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
    return () => clearInterval(id);
  }, [isRunning]);

  // ===== FIREBASE SYNC =====
  useEffect(() => {
    set(ref(db, "matchData"), { teams: teamData, matchTime });
  }, [teamData, matchTime]);

  // ===== TOP BAR STATS =====
  const stats = useMemo(() => {
    const totalPlayers = teamData.reduce((s, t) => s + t.players.length, 0);
    const alivePlayers = teamData.reduce(
      (s, t) => s + t.players.filter((p) => !p.eliminated).length,
      0
    );
    const totalKills = teamData.reduce(
      (s, t) => s + t.players.reduce((k, p) => k + p.kills, 0),
      0
    );
    const aliveTeams = teamData.filter((t) =>
      t.players.some((p) => !p.eliminated)
    ).length;
    return { totalPlayers, alivePlayers, totalKills, aliveTeams };
  }, [teamData]);

  const formatTime = (secs: number) => {
    const mm = Math.floor(secs / 60).toString().padStart(2, "0");
    const ss = (secs % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // ===== HELPERS =====
  const autoPushEliminatedDown = (arr: TeamState[]) => {
    const alive = arr.filter((t) => !t.eliminated);
    const elim = arr.filter((t) => t.eliminated);
    return [...alive, ...elim];
  };

  // Manual reorder (arrows)
  const moveTeam = (index: number, dir: "up" | "down") => {
    setTeamData((prev) => {
      const next = [...prev];
      if (dir === "up" && index > 0) {
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
      }
      if (dir === "down" && index < next.length - 1) {
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
      }
      return next;
    });
  };

  // Player kills
  const changeKills = (teamId: number, idx: number, delta: number) => {
    setTeamData((prev) =>
      prev.map((t) =>
        t.id !== teamId
          ? t
          : {
              ...t,
              players: t.players.map((p, i) =>
                i === idx ? { ...p, kills: Math.max(0, p.kills + delta) } : p
              ),
            }
      )
    );
  };

  // Player eliminate toggle
  const togglePlayerElim = (teamId: number, idx: number, value: boolean) => {
    setTeamData((prev) =>
      autoPushEliminatedDown(
        prev.map((t) => {
          if (t.id !== teamId) return t;
          const players = t.players.map((p, i) =>
            i === idx ? { ...p, eliminated: value, running: !value } : p
          );
          const allDead = players.every((p) => p.eliminated);
          return { ...t, players, eliminated: allDead };
        })
      )
    );
  };

  // Team Status dropdown (Alive / Eliminated)
  const changeTeamStatus = (teamId: number, status: "alive" | "eliminated") => {
    const isElim = status === "eliminated";
    setTeamData((prev) =>
      autoPushEliminatedDown(
        prev.map((t) =>
          t.id !== teamId
            ? t
            : {
                ...t,
                eliminated: isElim,
                players: t.players.map((p) => ({
                  ...p,
                  eliminated: isElim,
                  running: !isElim, // resume timers if made alive again
                })),
              }
        )
      )
    );
  };

  // ===== RESET MATCH =====
  const resetMatch = () => {
    const ok = window.confirm(
      "Are you sure you want to reset the match? This clears kills, eliminations, and timers."
    );
    if (!ok) return;

    const reset = teamData.map((t) => ({
      ...t,
      eliminated: false,
      players: t.players.map((p) => ({
        ...p,
        kills: 0,
        eliminated: false,
        survivalTime: 0,
        running: true,
      })),
    }));
    setTeamData(reset);
    setMatchTime(0);
    setIsRunning(false);

    // also clear Firebase node
    remove(ref(db, "matchData"));
  };

  return (
    <div className="p-6">
      {/* Nav */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => navigate("/")}
          className="bg-gray-600 text-white px-4 py-2 rounded"
        >
          ⬅ Back to Teams
        </button>
      </div>

      {/* ===== TOP BAR: Alive stats + timer ===== */}
      <div className="bg-gray-900 text-white rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between">
        <div className="flex gap-6">
          <div>
            <div className="text-xs text-gray-300">Alive Players</div>
            <div className="text-xl font-bold">{stats.alivePlayers}</div>
          </div>
          <div>
            <div className="text-xs text-gray-300">Alive Teams</div>
            <div className="text-xl font-bold">{stats.aliveTeams}</div>
          </div>
          <div>
            <div className="text-xs text-gray-300">Total Kills</div>
            <div className="text-xl font-bold">{stats.totalKills}</div>
          </div>
          <div>
            <div className="text-xs text-gray-300">Total Players</div>
            <div className="text-xl font-bold">{stats.totalPlayers}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-lg font-mono">{formatTime(matchTime)}</div>
          <button
            onClick={() => setIsRunning((v) => !v)}
            className="bg-blue-500 px-4 py-2 rounded"
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          <button onClick={resetMatch} className="bg-yellow-500 px-4 py-2 rounded">
            Reset Match
          </button>
        </div>
      </div>

      {/* ===== TEAMS GRID ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teamData.map((team, idx) => {
          const teamKills = team.players.reduce((s, p) => s + p.kills, 0);

          return (
            <div key={team.id} className="border rounded-lg p-4 bg-white shadow">
              {/* Header row: position, logo+name, team status dropdown, manual arrows */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">#{idx + 1}</span>
                  {team.logo ? (
                    <img src={team.logo} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-200" />
                  )}
                  <h2 className="font-semibold">{team.name}</h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="font-semibold">{teamKills} kills</div>

                  {/* Team Status DROPDOWN */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Status</label>
                    <select
                      className="border rounded px-2 py-1"
                      value={team.eliminated ? "eliminated" : "alive"}
                      onChange={(e) =>
                        changeTeamStatus(team.id, e.target.value as "alive" | "eliminated")
                      }
                    >
                      <option value="alive">Alive</option>
                      <option value="eliminated">Eliminated</option>
                    </select>
                  </div>

                  {/* Manual position arrows */}
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
                {team.players.map((p, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center border-b pb-1"
                  >
                    <span>
                      {p.name}{" "}
                      <span className="text-xs text-gray-500">
                        ({formatTime(p.survivalTime)})
                      </span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 bg-green-500 text-white rounded disabled:opacity-50"
                        onClick={() => changeKills(team.id, i, +1)}
                        disabled={p.eliminated}
                      >
                        +
                      </button>
                      <span className="w-6 text-center">{p.kills}</span>
                      <button
                        className="px-2 bg-red-500 text-white rounded disabled:opacity-50"
                        onClick={() => changeKills(team.id, i, -1)}
                        disabled={p.eliminated}
                      >
                        -
                      </button>

                      <label className="ml-2 text-sm">
                        <input
                          type="checkbox"
                          checked={p.eliminated}
                          onChange={(e) =>
                            togglePlayerElim(team.id, i, e.target.checked)
                          }
                        />{" "}
                        Elim
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
