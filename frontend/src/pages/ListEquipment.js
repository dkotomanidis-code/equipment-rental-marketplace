import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE, authConfig } from '../utils/api';
import { cityLabel, cityOptions, findCity } from '../data/georgiaCities';

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'Excavator',
  daily_price: '',
  city: '',
  location: '',
  image_url: '',
};

export default function ListEquipment({ language }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = /^[1-9]\d*$/.test(searchParams.get('edit') || '') ? searchParams.get('edit') : null;
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [originalCity, setOriginalCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const translations = {
    en: {
      listEquipment: 'List Your Equipment',
      name: 'Equipment Name',
      description: 'Description',
      category: 'Category',
      price: 'Daily Price ($)',
      location: 'Area / address details (optional)',
      locationHint: 'e.g. Saburtalo, near the metro',
      city: 'City',
      selectCity: 'Select a city',
      imageUrl: 'Image URL',
      submit: 'List Equipment',
      success: 'Equipment listed successfully!',
      error: 'Error listing equipment',
      loginRequired: 'Please log in to list equipment',
      editTitle: 'Edit Your Equipment',
      save: 'Save changes',
      saved: 'Equipment updated successfully!',
      loadError: 'Could not load this listing',
    },
    ka: {
      listEquipment: 'დაასახელეთ თქვენი აღჭურვილობა',
      name: 'აღჭურვილობის სახელი',
      description: 'აღწერა',
      category: 'კატეგორია',
      price: 'ფასი დღეში ($)',
      location: 'უბანი / მისამართის დეტალები (არასავალდებულო)',
      locationHint: 'მაგ. საბურთალო, მეტროსთან',
      city: 'ქალაქი',
      selectCity: 'აირჩიეთ ქალაქი',
      imageUrl: 'სურათის URL',
      submit: 'აღჭურვილობის დასახელება',
      success: 'აღჭურვილობა წარმატებით დაშედეგი!',
      error: 'აღჭურვილობის დამატების შეცდომა',
      loginRequired: 'აღჭურვილობის დასახელებისთვის გთხოვთ შედიოთ',
      editTitle: 'განცხადების რედაქტირება',
      save: 'ცვლილებების შენახვა',
      saved: 'განცხადება განახლდა!',
      loadError: 'განცხადების ჩატვირთვა ვერ მოხერხდა',
    },
    ru: {
      listEquipment: 'Добавьте ваше оборудование',
      name: 'Название оборудования',
      description: 'Описание',
      category: 'Категория',
      price: 'Цена в день ($)',
      location: 'Район / детали адреса (необязательно)',
      locationHint: 'например, Сабуртало, у метро',
      city: 'Город',
      selectCity: 'Выберите город',
      imageUrl: 'URL изображения',
      submit: 'Добавить оборудование',
      success: 'Оборудование успешно добавлено!',
      error: 'Ошибка при добавлении оборудования',
      loginRequired: 'Пожалуйста, войдите, чтобы добавить оборудование',
      editTitle: 'Редактировать объявление',
      save: 'Сохранить изменения',
      saved: 'Объявление обновлено!',
      loadError: 'Не удалось загрузить объявление',
    },
  };

  const t = translations[language] || translations.en;
  const baseCategories = ['Excavator', 'Bulldozer', 'Crane', 'Forklift', 'Drill', 'Compressor'];
  // Keep an existing listing's category selectable even if it is not in the default list.
  const categories = formData.category && !baseCategories.includes(formData.category)
    ? [...baseCategories, formData.category]
    : baseCategories;
  const loadErrorText = t.loadError;

  useEffect(() => {
    if (!editId) {
      setFormData(EMPTY_FORM);
      setOriginalCity('');
      return undefined;
    }
    let active = true;
    axios.get(`${API_BASE}/equipment/${editId}`).then(({ data }) => {
      if (!active) return;
      const city = findCity(data.city)?.name || '';
      setOriginalCity(city);
      setFormData({
        name: data.name ?? '',
        description: data.description ?? '',
        category: data.category || 'Excavator',
        daily_price: data.pricePerDay == null ? '' : String(data.pricePerDay),
        city,
        location: data.location ?? '',
        image_url: data.imageUrl ?? '',
      });
    }).catch(() => {
      if (active) setError(loadErrorText);
    });
    return () => { active = false; };
  }, [editId, loadErrorText]);

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

    // Send the field names the equipment API expects.
    const payload = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      pricePerDay: formData.daily_price,
      location: formData.location.trim() || null,
      imageUrl: formData.image_url,
    };

    try {
      if (editId) {
        // Only send the city when it changed, so existing coordinates are kept otherwise.
        if (formData.city !== originalCity) payload.city = formData.city || null;
        await axios.put(`${API_BASE}/equipment/${editId}`, payload, authConfig());
        alert(t.saved);
        navigate(`/equipment/${editId}`);
        return;
      }
      await axios.post(`${API_BASE}/equipment`, { ...payload, city: formData.city || null }, authConfig());
      alert(t.success);
      setFormData(EMPTY_FORM);
      navigate('/dashboard');
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>{editId ? t.editTitle : t.listEquipment}</h1>
      
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
          {t.city}:
          <select
            name="city"
            value={formData.city}
            onChange={handleChange}
            required={!editId || Boolean(originalCity)}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">{t.selectCity}</option>
            {cityOptions(language).map((city) => (
              <option key={city.name} value={city.name}>{cityLabel(city, language)}</option>
            ))}
          </select>
        </label>

        <label>
          {t.location}:
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder={t.locationHint}
            maxLength={255}
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
          {loading ? 'Submitting...' : editId ? t.save : t.submit}
        </button>
      </form>
    </main>
  );
}