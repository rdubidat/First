import { HashRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider } from './data/store'
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

export default function App() {
  return (
    <StoreProvider>
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
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
