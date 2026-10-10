import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ListEquipment() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', category: 'tools', pricePerDay: '', location: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  if (!localStorage.getItem('token')) return <p>Please <Link to="/login">log in</Link> to list equipment.</p>;
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/equipment`, form, {
        headers: { Authorization: ['Bearer', localStorage.getItem('token')].join(' ') },
      });
      navigate(`/equipment/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not list equipment.');
    } finally { setLoading(false); }
  };
  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={submit}>
        <h2>List Equipment</h2>
        {Object.keys(form).map((key) => (
          <label key={key}>
            {key === 'pricePerDay' ? 'Daily Price' : key}
            <input name={key} value={form[key]} required={key === 'name' || key === 'pricePerDay'}
              type={key === 'pricePerDay' ? 'number' : 'text'} min={key === 'pricePerDay' ? '0.01' : undefined}
              step={key === 'pricePerDay' ? '0.01' : undefined}
              onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
          </label>
        ))}
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={loading}>List Equipment</button>
      </form>
    </div>
  );
}
