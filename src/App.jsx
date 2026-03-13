import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { EndorsementProvider } from './store/EndorsementStore'
import EndorsementsDashboard from './pages/EndorsementsDashboard'
import AddEmployee from './pages/AddEmployee'
import QuickAdd from './pages/QuickAdd'
import BulkUpload from './pages/BulkUpload'
import UpdateEmployee from './pages/UpdateEmployee'
import QuickUpdate from './pages/QuickUpdate'
import BulkUpdate from './pages/BulkUpdate'
import AddDependents from './pages/AddDependents'
import LifeEventSpouse from './pages/LifeEventSpouse'
import LifeEventNewborn from './pages/LifeEventNewborn'
import DeleteEmployee from './pages/DeleteEmployee'
import QuickDelete from './pages/QuickDelete'
import BulkDelete from './pages/BulkDelete'
import HRMSSync from './pages/HRMSSync'

export default function App() {
  return (
    <EndorsementProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<EndorsementsDashboard />} />
          <Route path="/add" element={<AddEmployee />} />
          <Route path="/add/quick" element={<QuickAdd />} />
          <Route path="/add/bulk" element={<BulkUpload />} />
          <Route path="/update" element={<UpdateEmployee />} />
          <Route path="/update/quick" element={<QuickUpdate />} />
          <Route path="/update/bulk" element={<BulkUpdate />} />
          <Route path="/update/add-dependents" element={<AddDependents />} />
          <Route path="/update/life-event/spouse" element={<LifeEventSpouse />} />
          <Route path="/update/life-event/newborn" element={<LifeEventNewborn />} />
          <Route path="/delete" element={<DeleteEmployee />} />
          <Route path="/delete/quick" element={<QuickDelete />} />
          <Route path="/delete/bulk" element={<BulkDelete />} />
          <Route path="/hrms-sync" element={<HRMSSync />} />
        </Routes>
      </Layout>
    </EndorsementProvider>
  )
}
