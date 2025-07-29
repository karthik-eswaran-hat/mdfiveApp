import { Route, Routes } from 'react-router-dom'
import LoadPage from './components/LoadPage'
import Dashboard from './components/Dashboard'
import ProcessReports from './components/ProcessReports';
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoadPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/process-reports" element={<ProcessReports />} />
    </Routes>
  )
}

export default App
