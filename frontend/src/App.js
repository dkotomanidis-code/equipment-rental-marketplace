import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Equipment from './pages/Equipment';
import EquipmentDetail from './pages/EquipmentDetail';
import UserProfile from './pages/UserProfile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Booking from './pages/Booking';
import PaymentConfirmation from './pages/PaymentConfirmation';
import ListEquipment from './pages/ListEquipment';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const translations = {
    en: {
      home: 'Home',
      browse: 'Browse',
      listEquipment: 'List Equipment',
      dashboard: 'Dashboard',
      logout: 'Logout',
      login: 'Login',
      signup: 'Sign Up',
    },
    ka: {
      home: 'მთავარი',
      browse: 'ნახვა',
      listEquipment: 'აღჭურვილობის დამატება',
      dashboard: 'დაფა',
      logout: 'გამოსვლა',
      login: 'შესვლა',
      signup: 'რეგისტრაცია',
    },
    ru: {
      home: 'Главная',
      browse: 'Обзор',
      listEquipment: 'Добавить оборудование',
      dashboard: 'Панель',
      logout: 'Выход',
      login: 'Вход',
      signup: 'Регистрация',
    },
  };

  const t = translations[language];

  return (
    <Router>
      <div className="App">
        <nav className="navbar-modern">
          <div className="nav-center">
            <div className="nav-logo-section">
              <span className="nav-logo">🏗️ Equipment Rental & Buy</span>
            </div>
            <ul className="nav-menu-modern">
              <li className="nav-item">
                <Link to="/" className="nav-link">{t.home}</Link>
              </li>
              <li className="nav-item">
                <Link to="/equipment" className="nav-link">{t.browse}</Link>
              </li>
              {isLoggedIn ? (
                <>
                  <li className="nav-item">
                    <Link to="/list-equipment" className="nav-link">{t.listEquipment}</Link>
                  </li>
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

            <div className="language-selector-top">
              <button 
                className={`lang-btn-simple ${language === 'en' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('en')}
              >
                EN
              </button>
              <button 
                className={`lang-btn-simple ${language === 'ka' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('ka')}
              >
                GE
              </button>
              <button 
                className={`lang-btn-simple ${language === 'ru' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('ru')}
              >
                RU
              </button>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home language={language} setLanguage={handleLanguageChange} />} />
          <Route path="/equipment" element={<Equipment language={language} setLanguage={handleLanguageChange} />} />
          <Route path="/equipment/:id" element={<EquipmentDetail language={language} setLanguage={handleLanguageChange} />} />
          <Route path="/profile/:userId" element={<UserProfile language={language} setLanguage={handleLanguageChange} />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} language={language} setLanguage={handleLanguageChange} />} />
          <Route path="/signup" element={<Signup setIsLoggedIn={setIsLoggedIn} language={language} setLanguage={handleLanguageChange} />} />
          <Route path="/dashboard" element={<Dashboard language={language} setLanguage={handleLanguageChange} />} />
          <Route path="/booking/:equipmentId" element={<Booking language={language} setLanguage={handleLanguageChange} />} />
          <Route path="/payment-confirmation" element={<PaymentConfirmation language={language} setLanguage={handleLanguageChange} />} />
          <Route path="/list-equipment" element={<ListEquipment language={language} setLanguage={handleLanguageChange} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
