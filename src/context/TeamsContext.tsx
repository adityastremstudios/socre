import React, { createContext, useState, ReactNode, useEffect } from "react";

export const TeamsContext = createContext<any>(null);

export const TeamsProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useState<any[]>(() => {
    const saved = localStorage.getItem("teams");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("teams", JSON.stringify(teams));
  }, [teams]);

  return (
    <TeamsContext.Provider value={{ teams, setTeams }}>
      {children}
    </TeamsContext.Provider>
  );
};

