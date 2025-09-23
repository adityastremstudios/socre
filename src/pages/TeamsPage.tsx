import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeamsContext } from "../context/TeamsContext";

export default function TeamsPage() {
  const { teams, setTeams } = useContext(TeamsContext);
  const [teamName, setTeamName] = useState("");
  const [teamTag, setTeamTag] = useState("");
  const [logo, setLogo] = useState("");
  const [players, setPlayers] = useState<string[]>([""]);
  const navigate = useNavigate();

  const handleAddPlayer = () => setPlayers([...players, ""]);
  const handleChangePlayer = (i: number, value: string) => {
    const updated = [...players];
    updated[i] = value;
    setPlayers(updated);
  };

  const handleAddTeam = () => {
    if (!teamName) return;
    const newTeam = {
      id: Date.now(),
      name: teamName,
      tag: teamTag,
      logo: logo || "/default-logo.png",
      players: players.filter((p) => p.trim() !== ""),
    };
    setTeams([...teams, newTeam]);
    setTeamName("");
    setTeamTag("");
    setLogo("");
    setPlayers([""]);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teams Management</h1>

      {/* Add Team Form */}
      <div className="border rounded-lg p-4 shadow bg-white mb-6">
        <h2 className="text-lg font-semibold mb-3">Add Team</h2>
        <input
          className="border p-2 w-full mb-2"
          placeholder="Team Name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-2"
          placeholder="Team Tag"
          value={teamTag}
          onChange={(e) => setTeamTag(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-2"
          placeholder="Logo URL"
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
        />

        {/* Players */}
        <div className="mb-2">
          <h3 className="font-semibold mb-1">Players</h3>
          {players.map((p, i) => (
            <input
              key={i}
              className="border p-2 w-full mb-2"
              placeholder={`Player ${i + 1}`}
              value={p}
              onChange={(e) => handleChangePlayer(i, e.target.value)}
            />
          ))}
          <button
            className="bg-gray-200 px-3 py-1 rounded"
            onClick={handleAddPlayer}
          >
            + Add Player
          </button>
        </div>

        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={handleAddTeam}
        >
          Add Team
        </button>
      </div>

      {/* Teams List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((team) => (
          <div
            key={team.id}
            className="border rounded-lg p-4 shadow bg-white flex items-center"
          >
            <img
              src={team.logo}
              alt="logo"
              className="w-12 h-12 object-cover rounded mr-4"
            />
            <div>
              <h2 className="font-semibold">{team.name} ({team.tag})</h2>
              <p className="text-sm text-gray-500">
                {team.players.length} Players
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Send to Scoreboard */}
      <div className="mt-6">
        <button
          onClick={() => navigate("/scoreboard")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700"
        >
          🚀 Send Teams to Scoreboard
        </button>
      </div>
    </div>
  );
}
