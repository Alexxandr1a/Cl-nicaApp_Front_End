import './App.css'
import {BrowserRouter} from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import AppLayout from './Components/AppLayout'
import Patient from './pages/Patient'
import Doctors from './pages/Doctors'
import Schedule from "../src/pages/Schedule"
import MedicalRecords from './pages/MedicalRecords'
import { Toaster } from "sonner";
function App() {

  return (
    <>
      <BrowserRouter>
      <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pacientes" element={<Patient/>} />
            <Route path="/medicos" element={<Doctors/>} />
            <Route path="/agendamentos" element={<Schedule/>} />
            <Route path="/prontuarios" element={<MedicalRecords/>} />
          </Routes>
          <Toaster richColors position="top-right" />
          </AppLayout>
      </BrowserRouter>
    </>
  )
}

export default App
