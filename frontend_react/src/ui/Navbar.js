import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../lms.css';
import { loadSettings, updateSetting } from '../utils/settings';

/**
 * PUBLIC_INTERFACE
 * Navbar for primary navigation.
 */
export default function Navbar() {
  const loc = useLocation();
  const isActive = (path) => loc.pathname === path;

  const [settings, setSettings] = useState(loadSettings());

  useEffect(() => {
    // keep settings in sync if other tabs update
    const onStorage = (e) => {
      if (e.key === 'lms_media_settings_v1') {
        setSettings(loadSettings());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = (key) => {
    const next = updateSetting({ [key]: !settings[key] });
    setSettings(next);
  };

  const experimentsEnabled = (process.env.REACT_APP_EXPERIMENTS_ENABLED || '').toString().toLowerCase() === 'true';

  return (
    <nav className="topnav" role="navigation" aria-label="Main">
      <div className="brand"><Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>MicroSkills</Link></div>
      <div className="actions" role="group" aria-label="Primary Nav and Settings">
        <Link to="/" className={`navlink ${isActive('/') ? 'active' : ''}`}>Home</Link>
        <Link to="/skills" className={`navlink ${isActive('/skills') ? 'active' : ''}`}>Skills</Link>
        <Link to="/progress" className={`navlink ${isActive('/progress') ? 'active' : ''}`}>Progress</Link>
        <Link to="/create" className={`navlink ${isActive('/create') ? 'active' : ''}`}>Create</Link>
        <Link to="/create/generate" className={`navlink ${isActive('/create/generate') ? 'active' : ''}`}>Create (AI)</Link>
        <Link to="/profile" className={`navlink ${isActive('/profile') ? 'active' : ''}`}>Profile</Link>
        {experimentsEnabled && <span className="navlink" style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '4px 8px', color: 'var(--secondary)' }}>Experiments</span>}
        <Link to="/login" className={`btn primary`} aria-label="Login">Login</Link>
        <div style={{ width: 8 }} />
        <button
          className="btn"
          onClick={() => toggle('audioOn')}
          aria-pressed={settings.audioOn}
          aria-label={`Audio ${settings.audioOn ? 'on' : 'off'}`}
          title="Toggle Audio"
        >
          🔊 {settings.audioOn ? 'On' : 'Off'}
        </button>
        <button
          className="btn"
          onClick={() => toggle('captionsOn')}
          aria-pressed={settings.captionsOn}
          aria-label={`Captions ${settings.captionsOn ? 'on' : 'off'}`}
          title="Toggle Captions"
        >
          💬 {settings.captionsOn ? 'On' : 'Off'}
        </button>
        <button
          className="btn"
          onClick={() => toggle('autoplayOn')}
          aria-pressed={settings.autoplayOn}
          aria-label={`Autoplay ${settings.autoplayOn ? 'on' : 'off'}`}
          title="Toggle Autoplay"
        >
          ▶️ {settings.autoplayOn ? 'Auto' : 'Manual'}
        </button>
      </div>
    </nav>
  );
}
