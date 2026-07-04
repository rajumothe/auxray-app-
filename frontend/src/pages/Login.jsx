import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Lock, Zap, Globe, Gauge, Database } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  // 🌟 REPLACED EMAIL WITH STRUCTURAL empId STATES
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const cleanEmpId = empId.trim().toUpperCase();

      // Regex validation client gate match verification rule before hitting network
      const corporateEmpIdRegex = /^[A-Z]-2\d{5}$/;
      if (!corporateEmpIdRegex.test(cleanEmpId)) {
        alert('Format Error: Employee ID sequence mismatch pattern layout rules. (Example: A-200000)');
        setLoading(false);
        return;
      }

      // 1. Send cleanly refactored request payload data to your Express backend auth route
      const response = await api.post('/auth/login', { empId: cleanEmpId, password });
      
      // 2. Save the dynamic token and metadata user objects to browser local storage parameters
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // 3. Smooth transition to home layout desk portal context
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid validation credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      
      {/* LEFT PANEL: Auxray Branding */}
      <div className="login-branding">
        <div className="brand-header">
          <div className="brand-logo-container">
            <div className="logo-icon">
              <Zap size={28} />
            </div>
            <div>
              <div className="brand-title">Auxray Energy</div>
              <div className="brand-subtitle">Enterprise CRM Platform</div>
            </div>
          </div>
        </div>

        <div className="brand-content">
          <h1 className="brand-hero-text">
            Powering<br/>The Grid.
          </h1>
          
          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon"><Globe size={20} /></div>
              <span>Statewide Route Management</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Gauge size={20} /></div>
              <span>Real-time Field Analytics</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Database size={20} /></div>
              <span>Centralized Master Data</span>
            </div>
          </div>
        </div>

        <div className="brand-footer">
          <span style={{color: '#64748b', fontSize: '0.875rem'}}>System Status: Optimal</span>
        </div>
      </div>

      {/* RIGHT PANEL: Secure Form */}
      <div className="login-form-wrapper">
        <div className="form-header">
          <h2>Welcome Back</h2>
          <p>Sign in to the backoffice terminal</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            {/* 🌟 UPDATED FORM FIELD LABEL AND TEXT INPUT SETTINGS */}
            <label>Corporate Employee ID</label>
            <div className="input-wrapper">
              <Hash size={20} className="input-icon" style={{ color: '#64748b' }} />
              <input 
                type="text"  // ⚡ CRITICAL FIX: Changed from 'email' to 'text' to clear native HTML5 blocks immediately
                className="custom-input" 
                placeholder="e.g. A-200000"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                required
                style={{ textTransform: 'uppercase' }} // Automatically formats text layout to uppercase
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input 
                type="password" 
                className="custom-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Secure Sign In'}
          </button>
        </form>

        <div className="form-footer">
          Forgot your terminal password? <a href="#">Contact IT Support</a>
        </div>
      </div>

    </div>
  );
};

export default Login;