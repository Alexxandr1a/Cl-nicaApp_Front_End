import './App.css'
import {BrowserRouter} from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import AppLayout from './Components/AppLayout'
function App() {

  return (
    <>
      <BrowserRouter>
      <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
          </AppLayout>
      </BrowserRouter>
    </>
  )
}

export default App
