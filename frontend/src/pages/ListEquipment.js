import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const apiBaseUrl = process.env.REACT_APP_API_URL || '/api';

function ListEquipment() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    pricePerDay: '',
    location: '',
    imageUrl: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await axios.post(`${apiBaseUrl}/equipment`, formData, {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to create equipment listing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>List Equipment</h2>
        {error && <p className="error">{error}</p>}
        <input name="name" placeholder="Equipment name" value={formData.name} onChange={handleChange} required />
        <input name="category" placeholder="Category" value={formData.category} onChange={handleChange} />
        <input
          name="pricePerDay"
          type="number"
          min="0"
          step="0.01"
          placeholder="Price per day"
          value={formData.pricePerDay}
          onChange={handleChange}
          required
        />
        <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} />
        <input name="imageUrl" placeholder="Image URL" value={formData.imageUrl} onChange={handleChange} />
        <textarea
          name="description"
          placeholder="Describe your equipment"
          value={formData.description}
          onChange={handleChange}
          className="list-equipment-textarea"
        />
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Create Listing'}
        </button>
      </form>
    </div>
  );
}

export default ListEquipment;
