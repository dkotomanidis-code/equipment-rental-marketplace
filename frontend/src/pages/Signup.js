import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Signup({ setIsLoggedIn }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/signup`, formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsLoggedIn(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Sign Up</h2>
        {error && <p className="error">{error}</p>}
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
        />
        <button type="submit" className="btn btn-primary">Sign Up</button>
      </form>
    </div>
  );
}

export default Signup;
