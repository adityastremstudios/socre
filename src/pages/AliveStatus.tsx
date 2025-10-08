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
      <div className="heading-background-holder">
        <img className="fix-heading" src="/images/fix_heading.png" alt="" width="278" height="15" />
      </div>

      {Array.from({ length: 16 }).map((_, i) => {
        const team = teams[i];
        const totalKills = team ? team.players.reduce((s, p) => s + (p.kills || 0), 0) : 0;

        return (
          <div key={i} className="group-3">
            <div className="l-constrained group">
              <img className="ranking" src="/images/ranking.png" alt="1" width="8" height="16" />
              <img className="team-logo" src={team?.logo || "/images/team_logo.png"} alt="" width="34" height="33" />
              <img
                className="text"
                src="/images/team_name.png"
                alt={team?.name || "TEAM"}
                width="59"
                height="13"
                title={team?.name || "TEAM"}
              />
              <img
                className="team-kill"
                src="/images/team_kill.png"
                alt={String(totalKills)}
                width="20"
                height="13"
                title={String(totalKills)}
              />

              {/* Alive status bars */}
              <div className="alive-bars-container" style={{ display: "flex", gap: "3px", marginTop: "4px" }}>
                {team?.players?.map((p, idx) => (
                  <div
                    key={idx}
                    className={`alive-bar ${p.eliminated ? "dead" : "alive"}`}
                    style={{
                      width: "20px",
                      height: "6px",
                      borderRadius: "2px",
                      backgroundColor: p.eliminated ? "red" : "limegreen",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
