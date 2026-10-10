import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

export default function ForgotPassword({ language = 'en' }) {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' -> 'code' -> 'password' -> 'success'
  const [email, setEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const translations = {
    en: {
      title: 'Reset Your Password',
      subtitle: 'Enter your recovery code to create a new password',
      emailLabel: 'Email address',
      emailPlaceholder: 'you@example.com',
      emailHint: 'Enter the email address associated with your account',
      next: 'Next',
      codeLabel: 'Recovery code',
      codePlaceholder: 'XXXX-XXXX',
      codeHint: 'Enter one of your recovery codes. Format: XXXX-XXXX',
      passwordLabel: 'New password',
      passwordPlaceholder: 'At least 8 characters',
      passwordHint: 'Create a strong password',
      confirmLabel: 'Confirm password',
      confirmPlaceholder: 'Repeat your password',
      reset: 'Reset Password',
      back: 'Back',
      backToLogin: 'Back to login',
      successTitle: 'Password Reset Successfully',
      successMsg: 'Your password has been changed. You can now log in with your new password.',
      login: 'Go to login',
      errorEmail: 'Please enter a valid email',
      errorCode: 'Please enter your recovery code',
      errorPassword: 'Password must be at least 8 characters',
      errorMatch: 'Passwords do not match',
      errorInvalid: 'Invalid or already-used recovery code',
      errorUser: 'User not found',
      errorGeneric: 'Something went wrong. Please try again.',
      codeUsed: 'This recovery code has already been used',
      loadingEmail: 'Checking email...',
      loadingCode: 'Verifying code...',
      loadingReset: 'Resetting password...',
    },
    ka: {
      title: 'თქვენი პაროლის აღდგენა',
      subtitle: 'შეიყვანეთ აღდგენის კოდი ახალი პაროლის შესაქმნელად',
      emailLabel: 'ელ-ფოსტის მისამართი',
      emailPlaceholder: 'you@example.com',
      emailHint: 'შეიყვანეთ თქვენი ანგარიშის ელ-ფოსტა',
      next: 'შემდეგი',
      codeLabel: 'აღდგენის კოდი',
      codePlaceholder: 'XXXX-XXXX',
      codeHint: 'შეიყვანეთ თქვენი აღდგენის კოდი. ფორმატი: XXXX-XXXX',
      passwordLabel: 'ახალი პაროლი',
      passwordPlaceholder: 'მინიმუმ 8 სიმბოლო',
      passwordHint: 'შექმენით ძლიერი პაროლი',
      confirmLabel: 'პაროლის დადასტურება',
      confirmPlaceholder: 'გაიმეორეთ პაროლი',
      reset: 'პაროლის აღდგენა',
      back: 'უკან',
      backToLogin: 'ავტორიზაციაზე უკან',
      successTitle: 'პაროლი წარმატებით აღდგა',
      successMsg: 'თქვენი პაროლი შეიცვალა. ახლა შეგიძლიათ ავტორიზებული იყოთ ახალი პაროლით.',
      login: 'ავტორიზაციაზე გადასვლა',
      errorEmail: 'გთხოვთ შეიყვანეთ სწორი ელ-ფოსტა',
      errorCode: 'გთხოვთ შეიყვანეთ აღდგენის კოდი',
      errorPassword: 'პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს',
      errorMatch: 'პაროლები არ ემთხვევა',
      errorInvalid: 'მიუღო ან უკვე გამოყენებული აღდგენის კოდი',
      errorUser: 'მომხმარებელი ვერ მოიძებნა',
      errorGeneric: 'რაღაც ხარვეზი. გთხოვთ სცადოთ ხელახლა.',
      codeUsed: 'ეს აღდგენის კოდი უკვე გამოყენებულია',
      loadingEmail: 'ელ-ფოსტის შემოწმება...',
      loadingCode: 'კოდის გადამოწმება...',
      loadingReset: 'პაროლის აღდგენა...',
    },
    ru: {
      title: 'Восстановление пароля',
      subtitle: 'Введите код восстановления для создания нового пароля',
      emailLabel: 'Адрес электронной почты',
      emailPlaceholder: 'you@example.com',
      emailHint: 'Введите адрес электронной почты, связанный с вашей учётной записью',
      next: 'Далее',
      codeLabel: 'Код восстановления',
      codePlaceholder: 'XXXX-XXXX',
      codeHint: 'Введите один из кодов восстановления. Формат: XXXX-XXXX',
      passwordLabel: 'Новый пароль',
      passwordPlaceholder: 'Минимум 8 символов',
      passwordHint: 'Создайте надёжный пароль',
      confirmLabel: 'Подтвердите пароль',
      confirmPlaceholder: 'Повторите пароль',
      reset: 'Восстановить пароль',
      back: 'Назад',
      backToLogin: 'Вернуться на вход',
      successTitle: 'Пароль успешно восстановлен',
      successMsg: 'Ваш пароль был изменён. Теперь вы можете войти с новым паролем.',
      login: 'Перейти на вход',
      errorEmail: 'Пожалуйста, введите корректный адрес электронной почты',
      errorCode: 'Пожалуйста, введите код восстановления',
      errorPassword: 'Пароль должен содержать минимум 8 символов',
      errorMatch: 'Пароли не совпадают',
      errorInvalid: 'Неверный или уже использованный код восстановления',
      errorUser: 'Пользователь не найден',
      errorGeneric: 'Что-то пошло не так. Пожалуйста, повторите попытку.',
      codeUsed: 'Этот код восстановления уже был использован',
      loadingEmail: 'Проверка адреса...',
      loadingCode: 'Проверка кода...',
      loadingReset: 'Восстановление пароля...',
    },
  };

  const t = translations[language] || translations.en;

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(t.errorEmail);
      return;
    }

    setLoading(true);
    try {
      // Just validate that user exists by attempting recovery
      // In real app, you'd send an email, but we're using recovery codes
      // For now, we'll proceed to code entry
      setStep('code');
    } catch (err) {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!recoveryCode) {
      setError(t.errorCode);
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError(t.errorPassword);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.errorMatch);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || '/api'}/recovery/reset-password`,
        {
          email,
          recoveryCode,
          newPassword,
          newPasswordConfirm: confirmPassword,
        }
      );

      setStep('success');
    } catch (err) {
      const errorMsg = err.response?.data?.error || t.errorGeneric;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form">
        {step === 'email' && (
          <>
            <h2>{t.title}</h2>
            <p style={{ color: '#aaa69c', fontSize: '14px', marginBottom: '20px' }}>
              {t.emailHint}
            </p>

            {error && <div className="error">{error}</div>}

            <form onSubmit={handleEmailSubmit}>
              <div>
                <label>{t.emailLabel}</label>
                <input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t.loadingEmail : t.next}
              </button>
            </form>

            <p style={{ marginTop: '20px', textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#d6b66b', textDecoration: 'none' }}>
                {t.backToLogin}
              </Link>
            </p>
          </>
        )}

        {step === 'code' && (
          <>
            <h2>{t.title}</h2>
            <p style={{ color: '#aaa69c', fontSize: '14px', marginBottom: '20px' }}>
              {t.codeHint}
            </p>

            {error && <div className="error">{error}</div>}

            <form onSubmit={handlePasswordReset}>
              <div>
                <label>{t.codeLabel}</label>
                <input
                  type="text"
                  placeholder={t.codePlaceholder}
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  disabled={loading}
                />
              </div>

              <div>
                <label>{t.passwordLabel}</label>
                <input
                  type="password"
                  placeholder={t.passwordPlaceholder}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label>{t.confirmLabel}</label>
                <input
                  type="password"
                  placeholder={t.confirmPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t.loadingReset : t.reset}
              </button>
            </form>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setStep('email');
                setRecoveryCode('');
                setNewPassword('');
                setConfirmPassword('');
                setError('');
              }}
              disabled={loading}
              style={{ marginTop: '10px', width: '100%' }}
            >
              {t.back}
            </button>
          </>
        )}

        {step === 'success' && (
          <>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✓</div>
              <h2>{t.successTitle}</h2>
              <p style={{ color: '#aaa69c', marginTop: '16px', lineHeight: '1.6' }}>
                {t.successMsg}
              </p>
            </div>

            <Link to="/login" className="btn btn-primary" style={{ textAlign: 'center', display: 'block' }}>
              {t.login}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}