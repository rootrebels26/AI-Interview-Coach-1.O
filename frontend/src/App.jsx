import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Setup from './pages/Setup';
import Resume from './pages/Resume';
import Interview from './pages/Interview';
import Report from './pages/Report';
import PasswordGate from './components/PasswordGate';
import { InterviewProvider } from './context/InterviewContext';

export default function App() {
  return (
    <InterviewProvider>
      <PasswordGate>
        <Router>
          <div className="min-h-screen bg-[#f5f9ff] text-[#0b1220] dark:bg-[#07111f] dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/setup" element={<Setup />} />
                <Route path="/resume" element={<Resume />} />
                <Route path="/interview" element={<Interview />} />
                <Route path="/report" element={<Report />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </PasswordGate>
    </InterviewProvider>
  );
}
