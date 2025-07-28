import { Route, Routes } from 'react-router-dom'
import LoadPage from './components/LoadPage'

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoadPage />} />
    </Routes>
  )
}

export default App
