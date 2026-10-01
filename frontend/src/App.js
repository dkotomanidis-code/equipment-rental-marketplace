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
import Messages from './pages/Messages';
import RentalAgreement from './pages/RentalAgreement';
import AgreementConfirmation from './pages/AgreementConfirmation';
import AgreementHistory from './pages/AgreementHistory';
import NotificationCenter from './pages/NotificationCenter';
import AISupportChat from './pages/AISupportChat';
import OwnerDashboard from './pages/OwnerDashboard';
import RenterDashboard from './pages/RenterDashboard';
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
      ownerDashboard: 'My Stats (Owner)',
      renterDashboard: 'My Stats (Renter)',
      messages: 'Messages',
      notifications: 'Notifications',
      aiSupport: 'AI Support',
      logout: 'Logout',
      login: 'Login',
      signup: 'Sign Up',
    },
    ka: {
      home: 'მთავარი',
      browse: 'ნახვა',
      listEquipment: 'აღჭურვილობის დამატება',
      dashboard: 'დაფა',
      ownerDashboard: 'ჩემი სტატისტიკა (მესაკუთრე)',
      renterDashboard: 'ჩემი სტატისტიკა (მოიჯარე)',
      messages: 'შეტყობინებები',
      notifications: 'შეტყობინებები',
      aiSupport: 'AI დახმარება',
      logout: 'გამოსვლა',
      login: 'შესვლა',
      signup: 'რეგისტრაცია',
    },
    ru: {
      home: 'Главная',
      browse: 'Обзор',
      listEquipment: 'Добавить оборудование',
      dashboard: 'Панель',
      ownerDashboard: 'Мои статистика (Владелец)',
      renterDashboard: 'Мои статистика (Арендатор)',
      messages: 'Сообщения',
      notifications: 'Уведомления',
      aiSupport: 'AI Поддержка',
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
                  <li className="nav-item dropdown">
                    <span className="nav-link dropdown-toggle">📊 Stats</span>
                    <div className="dropdown-menu">
                      <Link to="/owner-dashboard" className="dropdown-item">{t.ownerDashboard}</Link>
                      <Link to="/renter-dashboard" className="dropdown-item">{t.renterDashboard}</Link>
                    </div>
                  </li>
                  <li className="nav-item">
                    <Link to="/messages" className="nav-link">💬 {t.messages}</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/notifications" className="nav-link">🔔 {t.notifications}</Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/ai-support" className="nav-link">🤖 {t.aiSupport}</Link>
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
          <Route path="/messages" element={<Messages language={language} setLanguage={handleLanguageChange} />} />
          <Route path="/messages/:conversationId" element={<Messages language={language} setLanguage={handleLanguageChange} />} />
          <Route path="/rental-agreement/:bookingId" element={<RentalAgreement language={language} setLanguage={handleLanguageChange} />} />
          <Route path="/agreement-confirmation" element={<AgreementConfirmation language={language} />} />
          <Route path="/agreement-history" element={<AgreementHistory language={language} />} />
          <Route path="/notifications" element={<NotificationCenter language={language} />} />
          <Route path="/ai-support" element={<AISupportChat language={language} />} />
          <Route path="/owner-dashboard" element={<OwnerDashboard language={language} />} />
          <Route path="/renter-dashboard" element={<RenterDashboard language={language} />} />
        </Routes>
      </div>

      <style jsx>{`
        .nav-item.dropdown {
          position: relative;
        }

        .dropdown-toggle {
          cursor: pointer;
        }

        .dropdown-menu {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          min-width: 200px;
          z-index: 1000;
        }

        .nav-item.dropdown:hover .dropdown-menu {
          display: block;
        }

        .dropdown-item {
          display: block;
          padding: 0.75rem 1rem;
          color: #666;
          text-decoration: none;
          transition: all 0.3s ease;
          border: none;
          background: transparent;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }

        .dropdown-item:hover {
          background: #f5f5f5;
          color: #667eea;
          padding-left: 1.5rem;
        }
      `}</style>
    </Router>
  );
}

export default App;