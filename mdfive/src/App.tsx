import { Route, Routes } from 'react-router-dom'
import LoadPage from './components/LoadPage'
import Dashboard from './components/Dashboard'
import Process_Reports from './components/Process_Reports';


const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoadPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/processed_reports" element={<Process_Reports />} />
    </Routes>
  )
}

export default App
