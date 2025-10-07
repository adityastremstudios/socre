import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";

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
      } else {
        setTeams([]);
        setMatchTime(0);
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
      <link rel="stylesheet" href="/style.css" />
      <header className="rectangle-1-holder">
        <img className="group-2" src="/images/group_2.png" alt="" width="278" height="15" />
      </header>

      <div className="main-content-wrapper">
        {Array.from({ length: 16 }).map((_, i) => {
          const team = teams[i];
          const teamKills = team ? team.players.reduce((s, p) => s + (p.kills || 0), 0) : 0;
          const alivePlayers = team ? team.players.filter((p) => !p.eliminated).length : 0;

          return (
            <div key={i} className="row">
              <div className="l-constrained group">
                {/* slot number */}
                <img className="text" src={`/images/${i + 1}.png`} alt={String(i + 1)} width="8" height="16" />

                {/* team logo */}
                <img
                  className="logo"
                  src={team?.logo || "/images/logo.png"}
                  alt={team?.name || "empty"}
                  width="34"
                  height="33"
                />

                {/* team name */}
                <span className="text-2">{team?.name || "---"}</span>

                {/* total kills */}
                <span className="text-3">{team ? teamKills : 0}</span>

                {/* static rectangles (your base gfx) */}
                <div className="rectangle-2-copy"></div>
                <div className="rectangle-2-copy-2"></div>
                <div className="rectangle-2-copy-3"></div>
                <div className="rectangle-2"></div>

                {/* player status bars */}
                {team && (
                  <div style={{ display: "flex", gap: "3px", marginTop: "4px" }}>
                    {team.players.map((p, idx) => (
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
                )}
              </div>
            </div>
          );
        })}

        {/* your static rectangles / gfx background elements */}
        <div className="rectangle-1-copy-2"></div>
        <div className="rectangle-1-copy-3"></div>
        <div className="rectangle-1-copy-4"></div>
        <div className="rectangle-1-copy-5"></div>
        <div className="rectangle-1-copy-6"></div>
        <div className="rectangle-1-copy-7"></div>
        <div className="rectangle-1-copy-8"></div>
        <div className="rectangle-1-copy-9"></div>
        <div className="rectangle-1-copy-10"></div>
        <div className="rectangle-1-copy-11"></div>
        <div className="rectangle-1-copy-12"></div>
        <div className="rectangle-1-copy-13"></div>
        <div className="rectangle-1-copy-14"></div>
        <div className="rectangle-1-copy-15"></div>
        <div className="rectangle-1-copy-16"></div>
      </div>

      <footer className="footer">
        <p style={{ textAlign: "center", color: "white" }}>Match Time: {formatTime(matchTime)}</p>
      </footer>
    </div>
  );
}
