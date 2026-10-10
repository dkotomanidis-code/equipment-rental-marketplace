import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ListEquipment({ language }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Excavator',
    daily_price: '',
    location: '',
    image_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const translations = {
    en: {
      listEquipment: 'List Your Equipment',
      name: 'Equipment Name',
      description: 'Description',
      category: 'Category',
      price: 'Daily Price ($)',
      location: 'Location',
      imageUrl: 'Image URL',
      submit: 'List Equipment',
      success: 'Equipment listed successfully!',
      error: 'Error listing equipment',
      loginRequired: 'Please log in to list equipment',
    },
    ka: {
      listEquipment: 'დაასახელეთ თქვენი აღჭურვილობა',
      name: 'აღჭურვილობის სახელი',
      description: 'აღწერა',
      category: 'კატეგორია',
      price: 'ფასი დღეში ($)',
      location: 'ადგილმდებარეობა',
      imageUrl: 'სურათის URL',
      submit: 'აღჭურვილობის დასახელება',
      success: 'აღჭურვილობა წარმატებით დაშედეგი!',
      error: 'აღჭურვილობის დამატების შეცდომა',
      loginRequired: 'აღჭურვილობის დასახელებისთვის გთხოვთ შედიოთ',
    },
    ru: {
      listEquipment: 'Добавьте ваше оборудование',
      name: 'Название оборудования',
      description: 'Описание',
      category: 'Категория',
      price: 'Цена в день ($)',
      location: 'Местоположение',
      imageUrl: 'URL изображения',
      submit: 'Добавить оборудование',
      success: 'Оборудование успешно добавлено!',
      error: 'Ошибка при добавлении оборудования',
      loginRequired: 'Пожалуйста, войдите, чтобы добавить оборудование',
    },
  };

  const t = translations[language];
  const categories = ['Excavator', 'Bulldozer', 'Crane', 'Forklift', 'Drill', 'Compressor'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!localStorage.getItem('token')) {
      alert(t.loginRequired);
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post('/api/equipment', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert(t.success);
      setFormData({ name: '', description: '', category: 'Excavator', daily_price: '', location: '', image_url: '' });
      navigate('/dashboard');
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>{t.listEquipment}</h1>
      
      {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label>
          {t.name}:
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </label>

        <label>
          {t.description}:
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '100px' }}
          />
        </label>

        <label>
          {t.category}:
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </label>

        <label>
          {t.price}:
          <input
            type="number"
            name="daily_price"
            value={formData.daily_price}
            onChange={handleChange}
            required
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </label>

        <label>
          {t.location}:
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </label>

        <label>
          {t.imageUrl}:
          <input
            type="url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            required
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
          }}
        >
          {loading ? 'Submitting...' : t.submit}
        </button>
      </form>
    </main>
  );
}