import { HashRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider, useStore } from './data/store'
import { Login, Onboarding, Splash } from './pages/Auth'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import FamilyDetail from './pages/FamilyDetail'
import StudentDetail from './pages/StudentDetail'
import Classes from './pages/Classes'
import Grading from './pages/Grading'
import Retention from './pages/Retention'
import Pipeline from './pages/Pipeline'
import Inbox from './pages/Inbox'
import Billing from './pages/Billing'
import Settings from './pages/Settings'
import Kiosk from './pages/Kiosk'
import Content from './pages/Content'
import Campaigns from './pages/Campaigns'
import Growth from './pages/Growth'
import Receptionist from './pages/Receptionist'

// In live mode, gate the app behind auth + school onboarding.
function Gate({ children }) {
  const { mode, live, db } = useStore()
  if (mode === 'demo') return children
  if (live.stage === 'checking') return <Splash text="Checking session…" />
  if (live.stage === 'signed_out') return <Login />
  if (live.stage === 'no_school') return <Onboarding />
  if (live.stage === 'error') return <Splash error={live.loadError} onSignOut={live.signOut} />
  if (!db) return <Splash />
  return children
}

export default function App() {
  return (
    <StoreProvider>
      <Gate>
      <HashRouter>
        <Routes>
          <Route path="/kiosk" element={<Kiosk />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/family/:familyId" element={<FamilyDetail />} />
            <Route path="/members/student/:studentId" element={<StudentDetail />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/grading" element={<Grading />} />
            <Route path="/retention" element={<Retention />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/content" element={<Content />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/growth" element={<Growth />} />
            <Route path="/receptionist" element={<Receptionist />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
      </Gate>
    </StoreProvider>
  )
}
