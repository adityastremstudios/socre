import React, { createContext, useState, ReactNode } from "react";

export const TeamsContext = createContext<any>(null);

export const TeamsProvider = ({ children }: { children: ReactNode }) => {
  const [teams, setTeams] = useState<any[]>([]);

  return (
    <TeamsContext.Provider value={{ teams, setTeams }}>
      {children}
    </TeamsContext.Provider>
  );
};
