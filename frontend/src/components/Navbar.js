import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import translations from '../translations';

function Navbar({ isLoggedIn, handleLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const navigate = useNavigate();
  const t = translations[language];

  useEffect(() => {
    localStorage.setItem('language', language);
    window.dispatchEvent(new Event('languageChange'));
  }, [language]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/equipment?search=${searchTerm}`);
      setSearchTerm('');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <div className="georgia-flag">
          <svg width="28" height="28" viewBox="0 0 36 36" style={{borderRadius: '2px'}}>
            {/* White background */}
            <rect width="36" height="36" fill="white"/>
            
            {/* Big central cross */}
            <rect x="15" y="0" width="6" height="36" fill="#CE1126"/>
            <rect x="0" y="15" width="36" height="6" fill="#CE1126"/>
            
            {/* Top-left small cross */}
            <rect x="3" y="3" width="2" height="8" fill="#CE1126"/>
            <rect x="0" y="6" width="8" height="2" fill="#CE1126"/>
            
            {/* Top-right small cross */}
            <rect x="31" y="3" width="2" height="8" fill="#CE1126"/>
            <rect x="28" y="6" width="8" height="2" fill="#CE1126"/>
            
            {/* Bottom-left small cross */}
            <rect x="3" y="25" width="2" height="8" fill="#CE1126"/>
            <rect x="0" y="28" width="8" height="2" fill="#CE1126"/>
            
            {/* Bottom-right small cross */}
            <rect x="31" y="25" width="2" height="8" fill="#CE1126"/>
            <rect x="28" y="28" width="8" height="2" fill="#CE1126"/>
          </svg>
          <span className="georgia-text">Georgia</span>
        </div>
        <div className="flag-selector">
          <button 
            className={`flag-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
            title="English"
          >
            🇺🇸
          </button>
          <button 
            className={`flag-btn ${language === 'ka' ? 'active' : ''}`}
            onClick={() => setLanguage('ka')}
            title="Georgian"
          >
            🇬🇪
          </button>
          <button 
            className={`flag-btn ${language === 'ru' ? 'active' : ''}`}
            onClick={() => setLanguage('ru')}
            title="Russian"
          >
            🇷🇺
          </button>
        </div>
      </div>

      <div className="nav-container">
        <Link to="/" className="nav-logo">
          🏗️ Construction Rent
        </Link>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="nav-search"
          />
          <button type="submit" className="search-btn">{t.searchBtn}</button>
        </form>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">{t.home}</Link>
          </li>
          <li className="nav-item">
            <Link to="/equipment" className="nav-link">{t.browse}</Link>
          </li>
          {isLoggedIn ? (
            <>
              <li className="nav-item">
                <Link to="/dashboard" className="nav-link">{t.dashboard}</Link>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-link">{t.logout}</button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link">{t.login}</Link>
              </li>
              <li className="nav-item">
                <Link to="/signup" className="nav-link">{t.signup}</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;