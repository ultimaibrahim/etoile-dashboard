import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Icon from './Icon';
import { REGION_NAME_MAP } from '../lib/data';

interface TopbarProps {
  showBack?: boolean;
  branchName?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ showBack = false, branchName = '' }) => {
  const {
    userProfile,
    activeRegion,
    setActiveRegion,
    darkMode,
    toggleDarkMode,
    logout,
    isAuthenticated,
    sucursalesMeta
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  const isHome = currentPath === '/' || currentPath === '/home';
  const isDash = currentPath === '/dashboards';
  const isAbout = currentPath === '/acerca';

  const showDashboards = sucursalesMeta.length > 1;

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveRegion(e.target.value);
    navigate('/');
  };

  const navLinks = (
    <>
      <Link to="/" className={`topbar-link ${isHome ? 'active' : ''}`} title="Inicio">
        <Icon name="home" /> <span>Inicio</span>
      </Link>
      {showDashboards && (
        <Link to="/dashboards" className={`topbar-link ${isDash ? 'active' : ''}`} title="Gráficas">
          <Icon name="barChart" /> <span>Dashboards</span>
        </Link>
      )}
      <Link to="/acerca" className={`topbar-link ${isAbout ? 'active' : ''}`} title="Acerca de">
        <Icon name="info" /> <span>Acerca de</span>
      </Link>
    </>
  );

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          {showBack ? (
            <button className="topbar-back" onClick={() => navigate(-1)}>
              <Icon name="arrow" />
              <span>Atrás</span>
            </button>
          ) : null}
          {showBack ? (
            <span className="topbar-brand">
              <span className="accent">{branchName}</span>
            </span>
          ) : (
            <Link to="/" className="topbar-brand">
              <span className="accent">étoile</span>
            </Link>
          )}
        </div>
        
        <div className="topbar-right">
          <div className="topbar-nav topbar-nav--desktop" id="mainNavDesktop">
            {navLinks}
          </div>
          
          <div className="topbar-actions">
            {isAuthenticated && userProfile && (userProfile.rol === 'admin' || userProfile.rol === 'regional' || userProfile.rol === 'zonal') ? (
              <select 
                className="topbar-region-select" 
                value={activeRegion}
                onChange={handleRegionChange} 
                aria-label="Cambiar región"
              >
                {Object.entries(REGION_NAME_MAP).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            ) : null}

            <button className="dark-toggle" onClick={toggleDarkMode} aria-label="Cambiar tema">
              <Icon name={darkMode ? 'sun' : 'moon'} />
            </button>

            {isAuthenticated ? (
              <button className="topbar-logout" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión">
                <Icon name="logout" />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Nav de móviles */}
      <nav className="topbar-nav" id="mainNav">
        {navLinks}
      </nav>
    </>
  );
};

export default Topbar;
