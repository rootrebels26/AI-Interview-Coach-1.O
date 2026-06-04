// Application router that connects URLs to page-level screens.
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import './styles/index.css'
import Home from "./pages/Home"
import SubjectSelection from "./pages/SubjectSelection"
import Interview from "./pages/Interview"
import History from "./pages/History"
import Resume from "./pages/Resume"
import Progress from "./pages/Progress"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Admin from "./pages/Admin"
import Feedback from "./pages/Feedback"
import AboutUs from "./pages/aboutus"
import Navbar from "./components/Navbar"
import ProtectedRoute from "./components/ProtectedRoute"

function AppRoutes() {
  const { pathname } = useLocation()
  const isHome = pathname === "/"

  return (
    <main className="min-h-screen transition-colors duration-300 bg-gradient-mesh">
      <div className={isHome ? "w-full pt-8" : "container mx-auto px-4 py-8"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route element={<ProtectedRoute userOnly />}>
            <Route path="/subject-selection" element={<SubjectSelection />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/history" element={<History />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/progress" element={<Progress />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/feedback/:id" element={<Feedback />} />
          </Route>

          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </div>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
