import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard/Dashboard'
import CareerInsights from './pages/Dashboard/CareerInsights'
import Overview from './pages/Dashboard/Overview'
import History from './pages/Dashboard/History'
import CareerAssessment from './pages/Dashboard/CareerAssessment'
import CareerSkills from './pages/Dashboard/MySkills'
import CareerRoadmap from './pages/Dashboard/CareerRoadmap'
import CareerPath from './pages/Dashboard/CareerPath'
import LessonOverview from './pages/Dashboard/LessonOverview'
import CourseContent from './pages/Dashboard/CourseContent'
import Profile from './pages/Dashboard/Profile'
import CareerPassport from './pages/Dashboard/CareerPassport'
import SettingsPage from './pages/Dashboard/Settings'
import CreateCareerPathPage from './pages/Dashboard/CreateCareerPath'
import { DashboardProvider } from './context/DashboardContext'
import { UserProvider } from './context/UserContext'

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Landing Pages */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Authentication Flow */}
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Onboarding Flow (Post SignUp) */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Protected Dashboard Views */}
          <Route path="/dashboard" element={<DashboardProvider><Dashboard /></DashboardProvider>}>
            <Route index element={<Navigate to="insights" replace />} />
            <Route path="insights" element={<CareerInsights />} />
            <Route path="overview" element={<Overview />} />
            <Route path="history" element={<History />} />
            <Route path="assessment" element={<CareerAssessment />} />
            <Route path="skills" element={<CareerSkills />} />
            <Route path="path" element={<CareerPath />} />
            <Route path="career-paths/new font-sans" element={<CreateCareerPathPage />} />
            <Route path="career-paths/new" element={<CreateCareerPathPage />} />
            <Route path="roadmap" element={<CareerRoadmap />} />
            <Route path="roadmap/overview" element={<LessonOverview />} />
            <Route path="roadmap/learn" element={<CourseContent />} />
            <Route path="profile" element={<Profile />} />
            <Route path="passport" element={<CareerPassport />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  )
}

export default App
