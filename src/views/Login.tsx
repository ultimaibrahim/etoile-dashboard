import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AlertCircle, Mail, Lock, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, userProfile } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const ok = await login(email, password);
      if (ok) {
        // Redirigir según el rol del usuario cargado en el perfil
        // Si es rol de liderazgo, mandarlo a seleccionar región, si no, a inicio
        setTimeout(() => {
          navigate('/');
        }, 100);
      } else {
        setErrorMsg('Correo o contraseña incorrectos.');
        setSubmitting(false);
      }
    } catch (err) {
      setErrorMsg('Error de conexión con el servidor.');
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-container">
            <span className="login-logo-text">La Crêpe Parisienne</span>
          </div>
          <p className="login-subtitle">
            Ingresa tus credenciales para acceder al monitoreo regional de reseñas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {errorMsg && (
            <div className="login-error">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="login-email">Correo Electrónico</label>
            <div className="input-container">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                id="login-email"
                required
                placeholder="correo@lacrepeparisienne.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="login-password">Contraseña</label>
            <div className="input-container">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                id="login-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="login-btn" id="login-submit-btn" disabled={submitting}>
            <span>{submitting ? 'Verificando...' : 'Iniciar Sesión'}</span>
            {!submitting && (
              <ArrowRight size={18} />
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2026 Grupo MYT · Corporativo Alancar</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
