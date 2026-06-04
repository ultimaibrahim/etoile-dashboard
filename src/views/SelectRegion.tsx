import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { REGION_NAME_MAP, SUCURSALES_META_ALL } from '../lib/data';
import { ArrowLeft } from 'lucide-react';

export const SelectRegion: React.FC = () => {
  const { userProfile, isAuthenticated, setActiveRegion, logout } = useApp();
  const navigate = useNavigate();
  const [exitTransition, setExitTransition] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (userProfile && userProfile.rol === 'gerente') {
      navigate('/');
    }
  }, [isAuthenticated, userProfile, navigate]);

  const handleSelect = (regionId: string) => {
    setExitTransition(true);
    setTimeout(() => {
      setActiveRegion(regionId);
      navigate('/');
    }, 400);
  };

  const getRegionDetails = (id: string) => {
    switch (id) {
      case 'GDL':
        return { name: 'Región Guadalajara', desc: 'Sede fundadora LCP. Monitoreo de 8 sucursales activas en Jalisco (incluyendo Andares unificado).' };
      case 'CDMX':
        return { name: 'Región Centro (CDMX)', desc: 'Zona metropolitana y sucursales satélites de la capital y Estado de México.' };
      case 'NORTE':
        return { name: 'Región Norte', desc: 'Sucursales en Monterrey, Tijuana y zonas norteñas del territorio nacional.' };
      case 'BAJIO':
        return { name: 'Región Bajío y Centro-Norte', desc: 'Puntos de venta en León, Querétaro, Aguascalientes y San Luis Potosí.' };
      default:
        return { name: `Región ${id}`, desc: 'Monitoreo consolidado de reseñas y KPIs operativos locales.' };
    }
  };

  if (!isAuthenticated || (userProfile && userProfile.rol === 'gerente')) {
    return null;
  }

  const allowedRegions = userProfile?.regiones_permitidas || Object.keys(REGION_NAME_MAP);

  return (
    <div className={`select-region-screen ${exitTransition ? 'fade-out-exit' : ''}`}>
      <div className="select-region-container">
        <div className="srv-header">
          <div className="srv-logo-container">
            <span className="srv-logo-text">La Crêpe Parisienne</span>
          </div>
          <h2 className="srv-title">Selección de Región Operativa</h2>
          <p className="srv-subtitle">
            Elige una región para ver su dashboard de reseñas, alertas de servicio y KPIs consolidados.
          </p>
        </div>

        <div className="srv-grid">
          {allowedRegions.map((id: string) => {
            const { name, desc } = getRegionDetails(id);
            const count = SUCURSALES_META_ALL.filter(s => s.region === id).length;

            return (
              <div 
                key={id}
                className="srv-card" 
                onClick={() => handleSelect(id)}
              >
                <div className="srv-card-top">
                  <span className="srv-card-code">{id}</span>
                  <span className="srv-card-badge">
                    {count} sucursal{count !== 1 ? 'es' : 'al'}
                  </span>
                </div>
                <div className="srv-card-bottom">
                  <h3 className="srv-card-name">{name}</h3>
                  <p className="srv-card-desc">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="srv-header srv-footer">
          <button className="srv-back-login" onClick={logout}>
            <ArrowLeft size={16} />
            <span>Regresar al Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectRegion;
