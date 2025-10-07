import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";
import "./AliveStatus.css";

type Player = { name: string; eliminated: boolean; kills: number };
type Team = { id: number; name: string; logo?: string; eliminated: boolean; players: Player[] };

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
    <div>
      <header className="rectangle-1-holder">
        <img className="group-2" src="/images/group_2.png" alt="" width="278" height="15" />
      </header>

      <div className="main-content-wrapper">
        {Array.from({ length: 16 }).map((_, i) => {
          const team = teams[i];
          const totalKills = team ? team.players.reduce((s, p) => s + (p.kills || 0), 0) : 0;
          return (
            <div key={i} className="row">
              <div className="l-constrained group">
                <img className="text" src={`/images/${i + 1}.png`} alt={String(i + 1)} width="8" height="16" />
                <img className="logo" src={team?.logo || "/images/logo.png"} alt="" width="34" height="33" />
                <img
                  className="text-2"
                  src={`/images/team_${i + 1}.png`}
                  alt={team?.name || "TEAM"}
                  width="59"
                  height="13"
                />
                <span className="text-3">{totalKills}</span>

                {/* Player status bars */}
                <div style={{ display: "flex", gap: "3px", marginTop: "4px" }}>
                  {team?.players?.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: "20px",
                        height: "6px",
                        borderRadius: "2px",
                        backgroundColor: p.eliminated ? "red" : "limegreen",
                        opacity: p.eliminated ? 0.6 : 1,
                        transition: "0.3s",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="footer">
        <p style={{ textAlign: "center", color: "white" }}>Match Time: {formatTime(matchTime)}</p>
      </footer>
    </div>
  );
}
