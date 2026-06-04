import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Home from './views/Home';
import Login from './views/Login';
import SelectRegion from './views/SelectRegion';
import Branch from './views/Branch';
import Dashboards from './views/Dashboards';
import Quarter from './views/Quarter';
import About from './views/About';

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loadingAuth } = useApp();

  if (loadingAuth) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '20px', backgroundColor: 'var(--bg)' }}>
        <div className="custom-select-arrow" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--verde)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '12px' }}>Autenticando usuario...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AdminGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useApp();

  if (!userProfile) return null;

  const isLeadership = ['admin', 'analista', 'regional', 'zonal'].includes(userProfile.rol);

  if (!isLeadership) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rutas Protegidas */}
        <Route 
          path="/" 
          element={
            <AuthGate>
              <Home />
            </AuthGate>
          } 
        />
        
        <Route 
          path="/select-region" 
          element={
            <AuthGate>
              <AdminGate>
                <SelectRegion />
              </AdminGate>
            </AuthGate>
          } 
        />

        <Route 
          path="/sucursal/:id" 
          element={
            <AuthGate>
              <Branch />
            </AuthGate>
          } 
        />

        <Route 
          path="/dashboards" 
          element={
            <AuthGate>
              <AdminGate>
                <Dashboards />
              </AdminGate>
            </AuthGate>
          } 
        />

        <Route 
          path="/trimestre/:q" 
          element={
            <AuthGate>
              <Quarter />
            </AuthGate>
          } 
        />

        <Route 
          path="/acerca" 
          element={
            <AuthGate>
              <About />
            </AuthGate>
          } 
        />

        {/* Fallback de redirección */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
