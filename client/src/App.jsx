import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HypercubeBackground from './components/HypercubeBackground';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import GamePage from './pages/GamePage';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';
import RequestGame from './pages/RequestGame';

export default function App() {
  return (
    <div className="app">
      <HypercubeBackground />
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<Catalog />} />
          <Route path="/game/:slug" element={<GamePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/leaderboard/:slug" element={<Leaderboard />} />
          <Route path="/request" element={<RequestGame />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>Hyp3rCub3.0n3 &copy; 2026 &mdash; play anywhere</p>
      </footer>
    </div>
  );
}
