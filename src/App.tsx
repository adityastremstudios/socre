import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TeamsPage from "./pages/TeamsPage";
import Scoreboard from "./pages/Scoreboard";
import AliveStatus from "./pages/AliveStatus";
import { TeamsProvider } from "./context/TeamsContext";

function App() {
  return (
    <TeamsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<TeamsPage />} />
          <Route path="/scoreboard" element={<Scoreboard />} />
          <Route path="/alive-status" element={<AliveStatus />} />
        </Routes>
      </Router>
    </TeamsProvider>
  );
}

export default App;


