import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

function EditEquipment() {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    pricePerDay: '',
    location: '',
    imageUrl: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const rawUser = JSON.parse(localStorage.getItem('user') || 'null');
  const user = rawUser && typeof rawUser.id === 'number' ? rawUser : null;

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    const fetchEquipment = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/equipment/${id}`);
        const item = response.data;
        if (item.ownerId !== user.id) {
          navigate('/dashboard');
          return;
        }
        setFormData({
          name: item.name || '',
          description: item.description || '',
          category: item.category || '',
          pricePerDay: item.pricePerDay || '',
          location: item.location || '',
          imageUrl: item.imageUrl || '',
        });
      } catch (err) {
        setError('Equipment not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Equipment name is required.');
      return;
    }
    if (!formData.pricePerDay || parseFloat(formData.pricePerDay) <= 0) {
      setError('Please enter a valid daily rental price.');
      return;
    }
    if (!formData.category) {
      setError('Please select a category.');
      return;
    }

    setSaving(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/equipment/${id}`,
        formData,
        { headers: { Authorization: 'Bearer ' + token } }
      );
      setSuccess('Equipment updated successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update listing.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="auth-page"><p>Loading...</p></div>;

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form equipment-form">
        <h2>Edit Equipment</h2>
        {error && <p className="error">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <label>Equipment Name *</label>
        <input
          type="text"
          name="name"
          placeholder="e.g. Power Drill, Camping Tent"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <label>Description</label>
        <textarea
          name="description"
          placeholder="Describe your equipment, its condition, and usage instructions..."
          value={formData.description}
          onChange={handleChange}
          rows={4}
        />

        <label>Category *</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select a category</option>
          <option value="tools">Tools</option>
          <option value="electronics">Electronics</option>
          <option value="sports">Sports</option>
          <option value="furniture">Furniture</option>
          <option value="other">Other</option>
        </select>

        <label>Daily Rental Price ($) *</label>
        <input
          type="number"
          name="pricePerDay"
          placeholder="e.g. 25"
          value={formData.pricePerDay}
          onChange={handleChange}
          min="0.01"
          step="0.01"
          required
        />

        <label>Location</label>
        <input
          type="text"
          name="location"
          placeholder="e.g. Atlanta, Georgia"
          value={formData.location}
          onChange={handleChange}
        />

        <label>Image URL</label>
        <input
          type="url"
          name="imageUrl"
          placeholder="https://example.com/image.jpg"
          value={formData.imageUrl}
          onChange={handleChange}
        />

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/dashboard')}
          style={{ marginTop: '0.5rem' }}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

export default EditEquipment;
