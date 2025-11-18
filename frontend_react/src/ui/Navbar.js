import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../lms.css';

/**
 * PUBLIC_INTERFACE
 * Navbar for primary navigation.
 */
export default function Navbar() {
  const loc = useLocation();
  const isActive = (path) => loc.pathname === path;

  return (
    <nav className="topnav" role="navigation" aria-label="Main">
      <div className="brand"><Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>MicroSkills</Link></div>
      <div className="actions">
        <Link to="/" className={`navlink ${isActive('/') ? 'active' : ''}`}>Home</Link>
        <Link to="/progress" className={`navlink ${isActive('/progress') ? 'active' : ''}`}>Progress</Link>
        <Link to="/create" className={`navlink ${isActive('/create') ? 'active' : ''}`}>Create</Link>
        <Link to="/profile" className={`navlink ${isActive('/profile') ? 'active' : ''}`}>Profile</Link>
        <Link to="/login" className={`btn primary`} aria-label="Login">Login</Link>
      </div>
    </nav>
  );
}
