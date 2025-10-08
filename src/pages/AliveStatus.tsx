import "./AliveStatus.css";
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";

type Player = { name: string; eliminated: boolean; kills: number };
type Team = { id: number; name: string; logo?: string; eliminated: boolean; players: Player[] };

export default function AliveStatus() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const matchRef = ref(db, "matchData");
    onValue(matchRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.teams) setTeams(data.teams);
    });
  }, []);

  return (
    <div>
      {/* Header background */}
      <div className="heading-background-holder">
        <img className="fix-heading" src="/images/fix_heading.png" alt="heading" />
      </div>

      {Array.from({ length: 16 }).map((_, i) => {
        const team = teams[i];
        const totalKills = team ? team.players.reduce((s, p) => s + (p.kills || 0), 0) : 0;

        return (
          <div key={i} className="group-3">
            <div className="l-constrained group">
              {/* 🏅 Ranking as text */}
              <span className="ranking-text">{i + 1}</span>

              {/* 🖼️ Dynamic team logo */}
              <img
                className="team-logo"
                src={team?.logo || "/images/team_logo.png"}
                alt={team?.name || "Team Logo"}
              />

              {/* 🧾 Team name as text */}
              <span className="team-name-text">{team?.name || "TEAM NAME"}</span>

              {/* 🔫 Total kills as text */}
              <span className="team-kill-text">{totalKills}</span>

              {/* 🟩 Alive bars */}
              <div className="alive-bars-container">
                {team?.players?.map((p, idx) => (
                  <div
                    key={idx}
                    className={`alive-bar ${p.eliminated ? "dead" : "alive"}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
