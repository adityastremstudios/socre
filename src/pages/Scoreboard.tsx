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
  logo?: string; // kept in data (used by overlay), not rendered here
  eliminated: boolean;
  players: PlayerState[];
  originalIndex: number; // initial slot (fallback)
};

export default function Scoreboard() {
  const { teams } = useContext(TeamsContext);
  const navigate = useNavigate();

  // Core team data
  const [teamData, setTeamData] = useState<TeamState[]>(
    teams.map((t, i) => ({
      ...t,
      eliminated: false,
      originalIndex: i,
      players: t.players.map((p: string) => ({
        name: p,
        kills: 0,
        eliminated: false,
        survivalTime: 0,
        running: true,
      })),
    }))
  );

  // A persistent order of team IDs that respects manual ▲/▼ moves.
  // We never mutate this on elimination/revive; we only change the "view".
  const [teamOrder, setTeamOrder] = useState<number[]>(
    teams.map((t) => t.id)
  );

  const [matchTime, setMatchTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // ===== Helpers to map id -> team and build display order =====
  const teamById = (id: number) => teamData.find((t) => t.id === id)!;

  const getDisplayOrderedTeams = (): TeamState[] => {
    const ordered = teamOrder.map(teamById);
    const alive = ordered.filter((t) => !t.eliminated);
    const elim = ordered.filter((t) => t.eliminated);
    // Alive first (in current manual order), then eliminated (also in manual order)
    return [...alive, ...elim];
  };

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

  // ===== FIREBASE SYNC (send display order so overlay matches scoreboard) =====
  useEffect(() => {
    const ordered = getDisplayOrderedTeams();
    set(ref(db, "matchData"), { teams: ordered, matchTime });
  }, [teamData, matchTime, teamOrder]);

  // ===== TOP BAR STATS =====
  const stats = useMemo(() => {
    const ordered = getDisplayOrderedTeams();
    const totalPlayers = ordered.reduce((s, t) => s + t.players.length, 0);
    const alivePlayers = ordered.reduce(
      (s, t) => s + t.players.filter((p) => !p.eliminated).length,
      0
    );
    const totalKills = ordered.reduce(
      (s, t) => s + t.players.reduce((k, p) => k + p.kills, 0),
      0
    );
    const aliveTeams = ordered.filter((t) =>
      t.players.some((p) => !p.eliminated)
    ).length;
    return { totalPlayers, alivePlayers, totalKills, aliveTeams };
  }, [teamData, teamOrder]);

  const formatTime = (secs: number) => {
    const mm = Math.floor(secs / 60).toString().padStart(2, "0");
    const ss = (secs % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // ===== Manual reorder within partitions (alive block or elim block) =====
  const moveTeam = (teamId: number, dir: "up" | "down") => {
    const ordered = getDisplayOrderedTeams();
    const aliveIds = ordered.filter((t) => !t.eliminated).map((t) => t.id);
    const elimIds = ordered.filter((t) => t.eliminated).map((t) => t.id);

    const isElim = teamById(teamId).eliminated;

    const arr = isElim ? elimIds : aliveIds;
    const idx = arr.indexOf(teamId);
    if (idx === -1) return;

    if (dir === "up" && idx > 0) {
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    } else if (dir === "down" && idx < arr.length - 1) {
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    }

    const newOrder = isElim ? [...aliveIds, ...arr] : [...arr, ...elimIds];
    setTeamOrder(newOrder);
  };

  // ===== Player kills +/- =====
  const changeKills = (teamId: number, playerIdx: number, delta: number) => {
    setTeamData((prev) =>
      prev.map((t) =>
        t.id !== teamId
          ? t
          : {
              ...t,
              players: t.players.map((p, i) =>
                i === playerIdx ? { ...p, kills: Math.max(0, p.kills + delta) } : p
              ),
            }
      )
    );
  };

  // ===== Player eliminate / revive (resume timer on revive) =====
  const togglePlayerElim = (teamId: number, playerIdx: number, value: boolean) => {
    setTeamData((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        const players = t.players.map((p, i) =>
          i === playerIdx ? { ...p, eliminated: value, running: !value } : p
        );
        const allDead = players.every((p) => p.eliminated);
        return { ...t, players, eliminated: allDead };
      })
    );
    // NOTE: teamOrder unchanged; display layer handles bottoming out if team becomes eliminated
  };

  // ===== Team elimination checkbox (revive restores last manual position) =====
  const changeTeamStatus = (teamId: number, eliminated: boolean) => {
    setTeamData((prev) =>
      prev.map((t) =>
        t.id !== teamId
          ? t
          : {
              ...t,
              eliminated,
              players: t.players.map((p) => ({
                ...p,
                eliminated,
                running: !eliminated,
              })),
            }
      )
    );
    // teamOrder not changed here on purpose — keeps last manual position.
  };

  // ===== RESET MATCH =====
  const resetMatch = () => {
    const ok = window.confirm(
      "Are you sure you want to reset the match? This clears kills, eliminations, and timers."
    );
    if (!ok) return;

    const reset = teamData.map((t, i) => ({
      ...t,
      eliminated: false,
      originalIndex: i,
      players: t.players.map((p) => ({
        ...p,
        kills: 0,
        eliminated: false,
        survivalTime: 0,
        running: true,
      })),
    }));

    setTeamData(reset);
    setTeamOrder(reset.map((t) => t.id)); // reset manual order to initial
    setMatchTime(0);
    setIsRunning(false);

    remove(ref(db, "matchData"));
  };

  // Display array (alive first, then elim) derived from teamOrder
  const displayTeams = getDisplayOrderedTeams();

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

      {/* ===== TOP BAR ===== */}
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

      {/* ===== TEAMS GRID (alive first, then eliminated) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayTeams.map((team, visualIdx) => {
          const teamKills = team.players.reduce((s, p) => s + p.kills, 0);

          return (
            <div
              key={team.id}
              className={`border rounded-lg p-4 bg-white shadow ${
                team.eliminated ? "opacity-80" : ""
              }`}
            >
              {/* Team header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">#{visualIdx + 1}</span>
                  <h2 className="font-semibold">{team.name}</h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="font-semibold">{teamKills} kills</div>

                  {/* ✅ Team Elimination Checkbox */}
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={team.eliminated}
                      onChange={(e) => changeTeamStatus(team.id, e.target.checked)}
                    />
                    Team Elim
                  </label>

                  {/* Manual arrows (move within partition) */}
                  <div className="flex flex-col">
                    <button
                      className="px-2 py-1 bg-gray-200 rounded"
                      onClick={() => moveTeam(team.id, "up")}
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      className="px-2 py-1 bg-gray-200 rounded mt-1"
                      onClick={() => moveTeam(team.id, "down")}
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              {/* Players list */}
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
