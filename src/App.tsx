import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TeamsProvider } from "./context/TeamsContext";
import TeamsPage from "./pages/TeamsPage";
import Scoreboard from "./pages/Scoreboard";

function App() {
  return (
    <TeamsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<TeamsPage />} />
          <Route path="/scoreboard" element={<Scoreboard />} />
        </Routes>
      </Router>
    </TeamsProvider>
  );
}

export default App;

