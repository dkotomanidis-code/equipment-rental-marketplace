import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

export default function Login({ language = 'en', setUser }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const translations = {
    en: {
      title: 'Login to Your Account',
      username: 'Username or Email',
      password: 'Password',
      login: 'Login',
      noAccount: "Don't have an account?",
      signup: 'Sign up here',
      forgotPassword: 'Forgot your password?',
      reset: 'Reset it here',
      errorUsername: 'Please enter your username or email',
      errorPassword: 'Please enter your password',
      errorInvalid: 'Invalid username or password',
      errorGeneric: 'Something went wrong. Please try again.',
      loading: 'Logging in...',
    },
    ka: {
      title: 'თქვენი ანგარიშში შესვლა',
      username: 'მომხმარებლის სახელი ან ელ-ფოსტა',
      password: 'პაროლი',
      login: 'შესვლა',
      noAccount: 'არ გაქვთ ანგარიში?',
      signup: 'დაკიდეთ აქ',
      forgotPassword: 'დაგავიწყდათ პაროლი?',
      reset: 'აღდეგით აქ',
      errorUsername: 'გთხოვთ შეიყვანეთ მომხმარებლის სახელი ან ელ-ფოსტა',
      errorPassword: 'გთხოვთ შეიყვანეთ პაროლი',
      errorInvalid: 'არასწორი მომხმარებლის სახელი ან პაროლი',
      errorGeneric: 'რაღაც არ გამოდგა. გთხოვთ სცადოთ ხელახლა.',
      loading: 'შესვლა...',
    },
    ru: {
      title: 'Вход в вашу учетную запись',
      username: 'Имя пользователя или адрес электронной почты',
      password: 'Пароль',
      login: 'Вход',
      noAccount: 'У вас нет учетной записи?',
      signup: 'Зарегистрируйтесь здесь',
      forgotPassword: 'Забыли пароль?',
      reset: 'Восстановите его здесь',
      errorUsername: 'Пожалуйста, введите имя пользователя или адрес электронной почты',
      errorPassword: 'Пожалуйста, введите пароль',
      errorInvalid: 'Неверное имя пользователя или пароль',
      errorGeneric: 'Что-то пошло не так. Пожалуйста, повторите попытку.',
      loading: 'Вход...',
    },
  };

  const t = translations[language] || translations.en;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username) {
      setError(t.errorUsername);
      return;
    }

    if (!password) {
      setError(t.errorPassword);
      return;
    }

    setLoading(true);
    try {
      const apiBase = (process.env.REACT_APP_API_URL || '/api').replace(/\/+$/, '');
      const response = await axios.post(`${apiBase}/auth/login`, {
        username,
        password,
      });

      const { token, user } = response.data;

      if (token) {
        localStorage.setItem('token', token);
      }

      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      if (typeof setUser === 'function') {
        setUser(user);
      }

      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.error || t.errorInvalid;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form">
        <h2>{t.title}</h2>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div>
            <label>{t.username}</label>
            <input
              type="text"
              placeholder={t.username}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label>{t.password}</label>
            <input
              type="password"
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t.loading : t.login}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#aaa69c' }}>
          {t.noAccount}{' '}
          <Link to="/signup" style={{ color: '#d6b66b', textDecoration: 'none' }}>
            {t.signup}
          </Link>
        </p>

        <p style={{ marginTop: '10px', textAlign: 'center', fontSize: '14px', color: '#aaa69c' }}>
          {t.forgotPassword}{' '}
          <Link to="/forgot-password" style={{ color: '#d6b66b', textDecoration: 'none' }}>
            {t.reset}
          </Link>
        </p>
      </div>
    </div>
  );
}