import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from 'react-router-dom';

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
import ForgotPassword from './pages/ForgotPassword';
import Wishlist from './pages/Wishlist';
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import ActivityBadges from './components/ActivityBadges';

import './App.css';

const TRANSLATIONS = {
  en: {
    home: 'Home',
    browse: 'Browse',
    listEquipment: 'List Equipment',
    dashboard: 'Dashboard',
    wishlist: 'Wishlist',
    logout: 'Logout',
    login: 'Login',
    signup: 'Sign Up',
    navigation: 'Main navigation',
    languageSelector: 'Choose language',
    notFound: 'Page not found',
    notFoundDescription: 'The page you requested does not exist.',
    backHome: 'Back to Home',
  },
  ka: {
    home: 'მთავარი',
    browse: 'ტექნიკის დათვალიერება',
    listEquipment: 'ტექნიკის დამატება',
    dashboard: 'მართვის პანელი',
    wishlist: 'სურვილების სია',
    logout: 'გამოსვლა',
    login: 'შესვლა',
    signup: 'რეგისტრაცია',
    navigation: 'მთავარი ნავიგაცია',
    languageSelector: 'ენის არჩევა',
    notFound: 'გვერდი ვერ მოიძებნა',
    notFoundDescription: 'მოთხოვნილი გვერდი არ არსებობს.',
    backHome: 'მთავარ გვერდზე დაბრუნება',
  },
  ru: {
    home: 'Главная',
    browse: 'Каталог техники',
    listEquipment: 'Добавить технику',
    dashboard: 'Панель управления',
    wishlist: 'Избранное',
    logout: 'Выход',
    login: 'Вход',
    signup: 'Регистрация',
    navigation: 'Основная навигация',
    languageSelector: 'Выбор языка',
    notFound: 'Страница не найдена',
    notFoundDescription: 'Запрошенная страница не существует.',
    backHome: 'На главную',
  },
};

function readSavedUser() {
  try {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem('token'))
  );

  const [user, setUser] = useState(readSavedUser);

  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');

    return Object.prototype.hasOwnProperty.call(
      TRANSLATIONS,
      savedLanguage
    )
      ? savedLanguage
      : 'en';
  });

  const t = TRANSLATIONS[language];

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  // Keep login state synchronized when another browser tab logs out.
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (
        event.key === 'token' ||
        event.key === 'user' ||
        event.key === null
      ) {
        setIsLoggedIn(Boolean(localStorage.getItem('token')));
        setUser(readSavedUser());
      }

      if (event.key === 'language' || event.key === null) {
        const savedLanguage = localStorage.getItem('language');

        setLanguage(
          Object.prototype.hasOwnProperty.call(
            TRANSLATIONS,
            savedLanguage
          )
            ? savedLanguage
            : 'en'
        );
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser(null);
    setIsLoggedIn(false);
  };

  const handleLanguageChange = (nextLanguage) => {
    if (
      Object.prototype.hasOwnProperty.call(
        TRANSLATIONS,
        nextLanguage
      )
    ) {
      setLanguage(nextLanguage);
    }
  };

  // Compatibility with Login/Signup pages that call setUser(response.data).
  // A successful login response should contain { token, user }.
  const handleAuthenticatedUser = (data) => {
    if (!data) {
      handleLogout();
      return;
    }

    if (typeof data.token === 'string' && data.token) {
      localStorage.setItem('token', data.token);
    }

    const account = data.user || data;
    setUser(account);
    localStorage.setItem('user', JSON.stringify(account));

    setIsLoggedIn(Boolean(localStorage.getItem('token')));
  };

  const pageProps = {
    language,
    setLanguage: handleLanguageChange,
  };

  const authProps = {
    ...pageProps,
    setIsLoggedIn,
    setUser: handleAuthenticatedUser,
  };

  return (
    <Router>
      <div className="App">
        <nav
          className="navbar-modern"
          aria-label={t.navigation}
        >
          <div className="nav-center">
            <div className="nav-logo-section">
              <Link
                to="/"
                className="nav-logo"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <span aria-hidden="true">🏗️</span>{' '}
                Equipment Rental &amp; Buy
              </Link>
            </div>

            <ul className="nav-menu-modern">
              <li className="nav-item">
                <Link to="/" className="nav-link">
                  {t.home}
                </Link>
              </li>

              <li className="nav-item">
                <Link to="/equipment" className="nav-link">
                  {t.browse}
                </Link>
              </li>

              {isLoggedIn ? (
                <>
                  <li className="nav-item">
                    <Link
                      to="/list-equipment"
                      className="nav-link"
                    >
                      {t.listEquipment}
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      to="/dashboard"
                      className="nav-link"
                    >
                      {t.dashboard}
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link to="/wishlist" className="nav-link">{t.wishlist}</Link>
                  </li>

                  <ActivityBadges language={language} isLoggedIn={isLoggedIn} />

                  <li className="nav-item">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="nav-link"
                    >
                      {t.logout}
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link to="/login" className="nav-link">
                      {t.login}
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link to="/signup" className="nav-link">
                      {t.signup}
                    </Link>
                  </li>
                </>
              )}
            </ul>

            <div
              className="language-selector-top"
              role="group"
              aria-label={t.languageSelector}
            >
              {[
                { code: 'en', label: 'EN', name: 'English' },
                { code: 'ka', label: 'GE', name: 'ქართული' },
                { code: 'ru', label: 'RU', name: 'Русский' },
              ].map((option) => (
                <button
                  key={option.code}
                  type="button"
                  className={`lang-btn-simple ${
                    language === option.code ? 'active' : ''
                  }`}
                  onClick={() => handleLanguageChange(option.code)}
                  aria-label={option.name}
                  aria-pressed={language === option.code}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <Routes>
          <Route
            path="/"
            element={<Home {...pageProps} />}
          />

          <Route
            path="/equipment"
            element={<Equipment {...pageProps} />}
          />

          <Route
            path="/equipment/:id"
            element={<EquipmentDetail {...pageProps} />}
          />

          <Route
            path="/profile/:userId"
            element={<UserProfile {...pageProps} />}
          />

          <Route
            path="/login"
            element={<Login {...authProps} />}
          />

          <Route
            path="/signup"
            element={<Signup {...authProps} />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword {...pageProps} />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard {...pageProps} user={user} />}
          />

          <Route path="/wishlist" element={<Wishlist {...pageProps} />} />
          <Route path="/messages/:conversationId?" element={<Chat {...pageProps} isLoggedIn={isLoggedIn} />} />
          <Route path="/notifications" element={<Notifications {...pageProps} />} />

          <Route
            path="/booking/:equipmentId"
            element={<Booking {...pageProps} />}
          />

          <Route
            path="/payment-confirmation"
            element={<PaymentConfirmation {...pageProps} />}
          />

          <Route
            path="/list-equipment"
            element={<ListEquipment {...pageProps} user={user} />}
          />

          <Route
            path="*"
            element={
              <main
                style={{
                  padding: '60px 20px',
                  textAlign: 'center',
                }}
              >
                <h1>{t.notFound}</h1>
                <p>{t.notFoundDescription}</p>
                <Link
                  to="/"
                  style={{ color: '#d6b66b' }}
                >
                  {t.backHome}
                </Link>
              </main>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;