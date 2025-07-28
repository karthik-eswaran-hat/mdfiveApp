import { Route, Routes } from 'react-router-dom'
import LoadPage from './components/LoadPage'
import Dashboard from './components/Dashboard'

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoadPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}

export default App
