import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

function Signup({ setIsLoggedIn }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    firstName: '',
    lastName: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupResult, setSignupResult] = useState(null);
  const [codesSaved, setCodesSaved] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const finishSignup = (result) => {
    localStorage.setItem('token', result.token);

    if (result.user) {
      localStorage.setItem('user', JSON.stringify(result.user));
    }

    if (typeof setIsLoggedIn === 'function') {
      setIsLoggedIn(true);
    }

    navigate('/dashboard');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (loading) return;

    if (!formData.username.trim() || !formData.email.trim()) {
      setError('Please enter your username and email.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const apiBase = (
        process.env.REACT_APP_API_URL || '/api'
      ).replace(/\/+$/, '');

      const response = await axios.post(
        `${apiBase}/auth/signup`,
        {
          ...formData,
          username: formData.username.trim(),
          email: formData.email.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
        }
      );

      const result = response.data;

      if (
        typeof result.token !== 'string' ||
        !result.token
      ) {
        setError(
          'The server did not return a login token. Please try logging in.'
        );
        return;
      }

      // Clear passwords after successful account creation.
      setFormData((previous) => ({
        ...previous,
        password: '',
        passwordConfirm: '',
      }));

      if (
        Array.isArray(result.recoveryCodes) &&
        result.recoveryCodes.length > 0
      ) {
        // Keep recovery codes in component memory, not localStorage.
        setSignupResult(result);
      } else {
        finishSignup(result);
      }
    } catch (err) {
      const serverError = err.response?.data?.error;

      setError(
        typeof serverError === 'string'
          ? serverError
          : 'Signup failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (signupResult) {
    return (
      <div className="auth-page">
        <div className="auth-form">
          <h2>Save Your Recovery Codes</h2>

          <p>
            Write these codes down or store them somewhere safe.
            Never share them. Each code is intended to reset your
            password once.
          </p>

          <p>
            Do not close or refresh this page until you have saved
            them.
          </p>

          <ul
            style={{
              paddingLeft: '24px',
              lineHeight: '2',
              fontFamily: 'monospace',
              color: '#d6b66b',
            }}
          >
            {signupResult.recoveryCodes.map((code, index) => (
              <li key={`${index}-${code}`}>{code}</li>
            ))}
          </ul>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              margin: '20px 0',
            }}
          >
            <input
              type="checkbox"
              checked={codesSaved}
              onChange={(event) => {
                setCodesSaved(event.target.checked);
              }}
              style={{ width: 'auto' }}
            />
            I have saved my recovery codes.
          </label>

          <button
            type="button"
            className="btn btn-primary"
            disabled={!codesSaved}
            onClick={() => finishSignup(signupResult)}
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-form">
        <h2>Sign Up</h2>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="signup-username">Username</label>
            <input
              id="signup-username"
              type="text"
              name="username"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="signup-confirm">
              Confirm Password
            </label>
            <input
              id="signup-confirm"
              type="password"
              name="passwordConfirm"
              autoComplete="new-password"
              minLength={8}
              value={formData.passwordConfirm}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="signup-first-name">
              First Name (optional)
            </label>
            <input
              id="signup-first-name"
              type="text"
              name="firstName"
              autoComplete="given-name"
              value={formData.firstName}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="signup-last-name">
              Last Name (optional)
            </label>
            <input
              id="signup-last-name"
              type="text"
              name="lastName"
              autoComplete="family-name"
              value={formData.lastName}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Signup;