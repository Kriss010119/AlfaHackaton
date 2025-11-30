import './App.css'
import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Header } from './components/header/Header'
import HomePage from './pages/homePage/HomePage'
import MetricsPage from './pages/metricsPage/MetricsPage'
import ClientsPage from './pages/clientsPage/ClientsPage'

function App() {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('theme') === 'light';
    } catch {
      return false;
    }
  })
  const toggleTheme = useCallback(() => {
    setDark(prev => !prev);
  }, []);

   useEffect(() => {
    const theme = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Ignore write errors
    }
  }, [dark]);

  return (
    <Router>
      <Header dark={dark} setDark={toggleTheme} />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/metrics" element={<MetricsPage />} /> 
          <Route path="/client" element={<ClientsPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App