import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Signup({ setIsLoggedIn, language }) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const navigate = useNavigate();

  const translations = {
    en: {
      signup: 'Sign Up',
      email: 'Email',
      firstName: 'First Name',
      lastName: 'Last Name',
      phone: 'Phone Number',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      signupBtn: 'Sign Up',
      creatingAccount: 'Creating Account...',
      login: 'Login',
      haveAccount: 'Already have an account?',
      passwordsNotMatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
      signupFailed: 'Signup failed',
      errorCreating: 'Error creating account:',
      verificationSent: 'Verification code sent to your email!',
      verificationCode: 'Enter Verification Code',
      verify: 'Verify Email',
      verifying: 'Verifying...',
      verificationFailed: 'Verification failed',
    },
    ka: {
      signup: 'რეგისტრაცია',
      email: 'ელფოსტა',
      firstName: 'სახელი',
      lastName: 'გვარი',
      phone: 'ტელეფონის ნომერი',
      password: 'პაროლი',
      confirmPassword: 'პაროლის დადასტურება',
      signupBtn: 'რეგისტრაცია',
      creatingAccount: 'ანგარიშის შექმნა...',
      login: 'შესვლა',
      haveAccount: 'უკვე გაქვთ ანგარიში?',
      passwordsNotMatch: 'პაროლები არ ემთხვევა',
      passwordTooShort: 'პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო',
      signupFailed: 'რეგისტრაცია ვერ მოხერხდა',
      errorCreating: 'ანგარიშის შექმნაში შეცდომა:',
      verificationSent: 'დადასტურების კოდი გაიგზავნა თქვენი ელფოსტაზე!',
      verificationCode: 'შეიყვანეთ დადასტურების კოდი',
      verify: 'ელფოსტის დადასტურება',
      verifying: 'დადასტურება მიმდინარეობს...',
      verificationFailed: 'დადასტურება ვერ მოხერხდა',
    },
    ru: {
      signup: 'Регистрация',
      email: 'Email',
      firstName: 'Имя',
      lastName: 'Фамилия',
      phone: 'Номер телефона',
      password: 'Пароль',
      confirmPassword: 'Подтвердите пароль',
      signupBtn: 'Регистрация',
      creatingAccount: 'Создание аккаунта...',
      login: 'Вход',
      haveAccount: 'У вас уже есть аккаунт?',
      passwordsNotMatch: 'Пароли не совпадают',
      passwordTooShort: 'Пароль должен быть не менее 6 символов',
      signupFailed: 'Регистрация не удалась',
      errorCreating: 'Ошибка при создании аккаунта:',
      verificationSent: 'Код подтверждения отправлен на вашу почту!',
      verificationCode: 'Введите код подтверждения',
      verify: 'Подтвердить Email',
      verifying: 'Проверка...',
      verificationFailed: 'Проверка не удалась',
    },
  };

  const t = translations[language] || translations.en;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t.passwordsNotMatch);
      return;
    }

    if (formData.password.length < 6) {
      setError(t.passwordTooShort);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/signup', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        password: formData.password,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      setVerificationSent(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || t.errorCreating + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setVerifyLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/verify-email', {
        email: formData.email,
        code: verificationCode,
      });

      setIsLoggedIn(true);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t.verificationFailed);
    } finally {
      setVerifyLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="auth-page">
        <div className="auth-form">
          <h2>{t.signup}</h2>
          <div className="success-message">{t.verificationSent}</div>
          <form onSubmit={handleVerify}>
            <input
              type="text"
              placeholder={t.verificationCode}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={verifyLoading}>
              {verifyLoading ? t.verifying : t.verify}
            </button>
          </form>
          {error && <div className="error">{error}</div>}
        </div>

        <style jsx>{`
          .auth-page {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          .auth-form {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            width: 100%;
            max-width: 400px;
          }

          h2 {
            color: #333;
            margin-bottom: 1.5rem;
            text-align: center;
          }

          form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          input {
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
          }

          input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }

          .btn {
            padding: 0.75rem;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
          }

          .btn-primary {
            background-color: #667eea;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background-color: #5568d3;
          }

          .btn-primary:disabled {
            background-color: #ccc;
            cursor: not-allowed;
          }

          .error {
            background-color: #f8d7da;
            color: #721c24;
            padding: 1rem;
            border-radius: 4px;
            margin-top: 1rem;
            border: 1px solid #f5c6cb;
          }

          .success-message {
            background-color: #d4edda;
            color: #155724;
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1rem;
            border: 1px solid #c3e6cb;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-form">
        <h2>{t.signup}</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="firstName"
            placeholder={t.firstName}
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder={t.lastName}
            value={formData.lastName}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder={t.email}
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder={t.phone}
            value={formData.phone}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder={t.password}
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder={t.confirmPassword}
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t.creatingAccount : t.signupBtn}
          </button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center', color: '#6b7280' }}>
          {t.haveAccount} <Link to="/login">{t.login}</Link>
        </p>
      </div>

      <style jsx>{`
        .auth-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .auth-form {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 400px;
        }

        h2 {
          color: #333;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        input {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .btn {
          padding: 0.75rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-primary {
          background-color: #667eea;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #5568d3;
        }

        .btn-primary:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .error {
          background-color: #f8d7da;
          color: #721c24;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          border: 1px solid #f5c6cb;
        }

        p a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }

        p a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}