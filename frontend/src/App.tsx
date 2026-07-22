import { Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import Predict from './pages/Predict'
import BatchUpload from './pages/BatchUpload'
import Metrics from './pages/Metrics'
import CollateralTracker from './pages/CollateralTracker'

function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <Routes>
        <Route path="/" element={<Predict />} />
        <Route path="/batch" element={<BatchUpload />} />
        <Route path="/metrics" element={<Metrics />} />
        <Route path="/collateral" element={<CollateralTracker />} />
      </Routes>
    </div>
  )
}

export default App
