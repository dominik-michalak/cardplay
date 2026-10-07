// App.tsx
// Główny komponent aplikacji. Zawiera: AuthProvider, SocketProvider
// oraz routing React Router. Wszystkie strony aplikacji rejestrowane są tutaj.
// Właściciel: Osoba A — dodaje trasy login, register, lobby i gier.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import DiagnosticsPage from './pages/DiagnosticsPage';

// Osoba A dodaje tu pozostałe strony:
// import LoginPage     from './pages/LoginPage';
// import RegisterPage  from './pages/RegisterPage';
// import LobbyPage     from './pages/LobbyPage';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/diagnostics" element={<DiagnosticsPage />} />

            {/* Osoba A implementuje poniższe trasy: */}
            {/* <Route path="/login"    element={<LoginPage />} /> */}
            {/* <Route path="/register" element={<RegisterPage />} /> */}
            {/* <Route path="/lobby"    element={<LobbyPage />} /> */}

            {/* Tymczasowe przekierowanie z / do /diagnostics */}
            <Route path="/" element={<Navigate to="/diagnostics" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
