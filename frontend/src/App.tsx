import { Outlet, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import Landing from './pages/Landing'
import Predict from './pages/Predict'
import BatchUpload from './pages/BatchUpload'
import Metrics from './pages/Metrics'
import CollateralTracker from './pages/CollateralTracker'

function AppLayout() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <Outlet />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<AppLayout />}>
        <Route path="/predict" element={<Predict />} />
        <Route path="/batch" element={<BatchUpload />} />
        <Route path="/metrics" element={<Metrics />} />
        <Route path="/collateral" element={<CollateralTracker />} />
      </Route>
    </Routes>
  )
}

export default App
