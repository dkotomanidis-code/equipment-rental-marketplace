import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ListEquipment({ language, setLanguage }) {
  const [listingType, setListingType] = useState('rent'); // 'rent' or 'buy'
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    year: new Date().getFullYear(),
    model: '',
    manufacturer: '',
    condition: 'good',
    description: '',
    features: '',
    pricePerDay: '',
    minPricePerDay: '',
    maxPricePerDay: '',
    price: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    imageUrl: '',
    comments: '',
    forSale: false,
  });

  const [myEquipment, setMyEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const translations = {
    en: {
      listEquipment: 'List Your Equipment',
      addNew: 'Add New Equipment',
      success: 'Equipment listed successfully!',
      error: 'Error',
      required: 'Please fill in all required fields',
      equipmentName: 'Equipment Name',
      category: 'Category',
      manufacturer: 'Manufacturer',
      model: 'Model',
      year: 'Year',
      condition: 'Condition',
      description: 'Description',
      features: 'Key Features',
      comments: 'Comments/Notes',
      pricePerDay: 'Price Per Day ($)',
      minPricePerDay: 'Min Price Per Day ($)',
      maxPricePerDay: 'Max Price Per Day ($)',
      price: 'Price ($)',
      minPrice: 'Min Price ($)',
      maxPrice: 'Max Price ($)',
      location: 'Location',
      imageUrl: 'Image URL',
      submit: 'List Equipment',
      listing: 'Listing Equipment...',
      myListings: 'My Listed Equipment',
      noListings: 'No equipment listed yet. Add your first item above!',
      delete: 'Delete',
      confirm: 'Are you sure you want to delete this equipment?',
      deleteSuccess: 'Equipment deleted successfully!',
      deleteFailed: 'Failed to delete equipment',
      rent: 'Rent',
      buy: 'Buy',
      listingType: 'Listing Type',
      rentFor: 'Rent For',
      buyFor: 'Buy For',
      perDay: '/day',
      priceRange: 'Price Range',
    },
    ka: {
      listEquipment: 'თქვენი აღჭურვილობის დამატება',
      addNew: 'ახალი აღჭურვილობის დამატება',
      success: 'აღჭურვილობა წარმატებით დაიმატა!',
      error: 'შეცდომა',
      required: 'გთხოვთ შეავსოთ ყველა აუცილებელი ველი',
      equipmentName: 'აღჭურვილობის სახელი',
      category: 'კატეგორია',
      manufacturer: 'მწარმოებელი',
      model: 'მოდელი',
      year: 'წელი',
      condition: 'მდგომარეობა',
      description: 'აღწერა',
      features: 'მთავარი მახასიათებლები',
      comments: 'კომენტარები/შენიშვნები',
      pricePerDay: 'ფასი თითო დღეში ($)',
      minPricePerDay: 'მინ ფასი თითო დღეში ($)',
      maxPricePerDay: 'მაქს ფასი თითო დღეში ($)',
      price: 'ფასი ($)',
      minPrice: 'მინ ფასი ($)',
      maxPrice: 'მაქს ფასი ($)',
      location: 'ადგილმდებარეობა',
      imageUrl: 'სურათის URL',
      submit: 'აღჭურვილობის დამატება',
      listing: 'აღჭურვილობა ემატება...',
      myListings: 'ჩემი დამატებული აღჭურვილობა',
      noListings: 'აღჭურვილობა ჯერ დამატებული არ არის. დაამატეთ თქვენი პირველი ნივა ზემოთ!',
      delete: 'წაშლა',
      confirm: 'დარწმუნებული ხართ, რომ გსურთ ამ აღჭურვილობის წაშლა?',
      deleteSuccess: 'აღჭურვილობა წარმატებით წაიშალა!',
      deleteFailed: 'აღჭურვილობის წაშლა ვერ მოხერხდა',
      rent: 'ქირაობა',
      buy: 'ყიდვა',
      listingType: 'სია ტიპი',
      rentFor: 'ქირაობა ფასი',
      buyFor: 'ყიდვის ფასი',
      perDay: '/დღე',
      priceRange: 'ფასის დიაპაზონი',
    },
    ru: {
      listEquipment: 'Добавьте ваше оборудование',
      addNew: 'Добавить новое оборудование',
      success: 'Оборудование успешно добавлено!',
      error: 'Ошибка',
      required: 'Пожалуйста, заполните все обязательные поля',
      equipmentName: 'Название оборудования',
      category: 'Категория',
      manufacturer: 'Производитель',
      model: 'Модель',
      year: 'Год',
      condition: 'Состояние',
      description: 'Описание',
      features: 'Ключевые особенности',
      comments: 'Комментарии/Примечания',
      pricePerDay: 'Цена в день ($)',
      minPricePerDay: 'Мин цена в день ($)',
      maxPricePerDay: 'Макс цена в день ($)',
      price: 'Цена ($)',
      minPrice: 'Мин цена ($)',
      maxPrice: 'Макс цена ($)',
      location: 'Местоположение',
      imageUrl: 'URL изображения',
      submit: 'Добавить оборудование',
      listing: 'Добавление оборудования...',
      myListings: 'Мое добавленное оборудование',
      noListings: 'Оборудование еще не добавлено. Добавьте свой первый предмет выше!',
      delete: 'Удалить',
      confirm: 'Вы уверены, что хотите удалить это оборудование?',
      deleteSuccess: 'Оборудование успешно удалено!',
      deleteFailed: 'Не удалось удалить оборудование',
      rent: 'Аренда',
      buy: 'Покупка',
      listingType: 'Тип листинга',
      rentFor: 'Цена аренды',
      buyFor: 'Цена покупки',
      perDay: '/день',
      priceRange: 'Ценовой диапазон',
    },
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signup');
      return;
    }
    fetchMyEquipment();
  }, [navigate]);

  const fetchMyEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/equipment/my-equipment`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyEquipment(response.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.name || !formData.category) {
      setErrorMessage(t.required);
      return;
    }

    if (listingType === 'rent') {
      if (!formData.minPricePerDay || !formData.maxPricePerDay) {
        setErrorMessage(t.required);
        return;
      }
    } else {
      if (!formData.minPrice || !formData.maxPrice) {
        setErrorMessage(t.required);
        return;
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const submitData = {
        ...formData,
        forSale: listingType === 'buy',
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/equipment`,
        submitData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMessage(t.success);
      setFormData({
        name: '',
        category: '',
        year: new Date().getFullYear(),
        model: '',
        manufacturer: '',
        condition: 'good',
        description: '',
        features: '',
        pricePerDay: '',
        minPricePerDay: '',
        maxPricePerDay: '',
        price: '',
        minPrice: '',
        maxPrice: '',
        location: '',
        imageUrl: '',
        comments: '',
        forSale: false,
      });

      fetchMyEquipment();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (equipmentId) => {
    if (!window.confirm(t.confirm)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_URL}/equipment/${equipmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage(t.deleteSuccess);
      fetchMyEquipment();
    } catch (error) {
      setErrorMessage(t.deleteFailed);
    }
  };

  return (
    <div className="list-equipment-page">
      <div className="list-equipment-container">
        <h1>{t.listEquipment}</h1>

        {/* Form Section */}
        <div className="equipment-form-section">
          <h2>{t.addNew}</h2>

          {/* Listing Type Toggle */}
          <div className="listing-type-toggle">
            <button
              className={`toggle-btn ${listingType === 'rent' ? 'active' : ''}`}
              onClick={() => setListingType('rent')}
            >
              📅 {t.rent}
            </button>
            <button
              className={`toggle-btn ${listingType === 'buy' ? 'active' : ''}`}
              onClick={() => setListingType('buy')}
            >
              🛒 {t.buy}
            </button>
          </div>

          {successMessage && <div className="success-message">{successMessage}</div>}
          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <form onSubmit={handleSubmit} className="equipment-form">
            {/* Basic Info */}
            <div className="form-group">
              <label>{t.equipmentName} *</label>
              <input
                type="text"
                name="name"
                placeholder="e.g., Makita Drill"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t.category} *</label>
                <select name="category" value={formData.category} onChange={handleChange} required>
                  <option value="">Select Category</option>
                  <option value="excavators">Excavators</option>
                  <option value="bulldozers">Bulldozers</option>
                  <option value="cranes">Cranes</option>
                  <option value="concrete-mixers">Concrete Mixers</option>
                  <option value="scaffolding">Scaffolding</option>
                  <option value="compressors">Compressors</option>
                  <option value="generators">Generators</option>
                  <option value="forklifts">Forklifts</option>
                  <option value="power-tools">Power Tools</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t.manufacturer}</label>
                <input
                  type="text"
                  name="manufacturer"
                  placeholder="e.g., Makita, DeWalt, etc."
                  value={formData.manufacturer}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t.model}</label>
                <input
                  type="text"
                  name="model"
                  placeholder="e.g., XPH01Z"
                  value={formData.model}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>{t.year}</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="1980"
                  max={new Date().getFullYear()}
                />
              </div>

              <div className="form-group">
                <label>{t.condition} *</label>
                <select name="condition" value={formData.condition} onChange={handleChange} required>
                  <option value="like-new">Like New</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="needs-repair">Needs Repair</option>
                </select>
              </div>
            </div>

            {/* Description & Features */}
            <div className="form-group">
              <label>{t.description} *</label>
              <textarea
                name="description"
                placeholder="Describe your equipment in detail..."
                value={formData.description}
                onChange={handleChange}
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>{t.features}</label>
              <textarea
                name="features"
                placeholder="List key features (e.g., Cordless, 20V, LED light, etc.)"
                value={formData.features}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>{t.comments}</label>
              <textarea
                name="comments"
                placeholder="Add any additional comments or special instructions..."
                value={formData.comments}
                onChange={handleChange}
                rows="3"
              />
            </div>

            {/* Dynamic Price Fields */}
            <div className="price-section">
              <h3>{t.priceRange}</h3>
              {listingType === 'rent' ? (
                <div className="form-row">
                  <div className="form-group">
                    <label>{t.minPricePerDay} *</label>
                    <div className="price-input-wrapper">
                      <input
                        type="number"
                        name="minPricePerDay"
                        placeholder="0.00"
                        value={formData.minPricePerDay}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        required
                      />
                      <span className="price-unit">{t.perDay}</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t.maxPricePerDay} *</label>
                    <div className="price-input-wrapper">
                      <input
                        type="number"
                        name="maxPricePerDay"
                        placeholder="0.00"
                        value={formData.maxPricePerDay}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        required
                      />
                      <span className="price-unit">{t.perDay}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="form-row">
                  <div className="form-group">
                    <label>{t.minPrice} *</label>
                    <div className="price-input-wrapper">
                      <span className="currency">$</span>
                      <input
                        type="number"
                        name="minPrice"
                        placeholder="0.00"
                        value={formData.minPrice}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t.maxPrice} *</label>
                    <div className="price-input-wrapper">
                      <span className="currency">$</span>
                      <input
                        type="number"
                        name="maxPrice"
                        placeholder="0.00"
                        value={formData.maxPrice}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="form-group">
              <label>{t.location}</label>
              <input
                type="text"
                name="location"
                placeholder="e.g., New York, NY"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            {/* Image URL */}
            <div className="form-group">
              <label>{t.imageUrl}</label>
              <input
                type="url"
                name="imageUrl"
                placeholder="https://example.com/image.jpg"
                value={formData.imageUrl}
                onChange={handleChange}
              />
              {formData.imageUrl && (
                <div className="image-preview">
                  <img src={formData.imageUrl} alt="Preview" />
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t.listing : t.submit}
            </button>
          </form>
        </div>

        {/* My Equipment List */}
        <div className="my-equipment-section">
          <h2>{t.myListings} ({myEquipment.length})</h2>

          {myEquipment.length > 0 ? (
            <div className="equipment-list">
              {myEquipment.map((item) => (
                <div key={item.id} className="equipment-item">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="equipment-image" />
                  )}
                  <div className="equipment-details">
                    <div className="item-header">
                      <h3>{item.name}</h3>
                      <span className="listing-badge">
                        {item.forSale ? '🛒 ' + t.buy : '📅 ' + t.rent}
                      </span>
                    </div>
                    <p className="category">{item.category}</p>
                    {item.manufacturer && <p><strong>Manufacturer:</strong> {item.manufacturer}</p>}
                    {item.model && <p><strong>Model:</strong> {item.model}</p>}
                    {item.year && <p><strong>Year:</strong> {item.year}</p>}
                    {item.condition && <p><strong>Condition:</strong> {item.condition}</p>}
                    <p className="description">{item.description}</p>
                    {item.features && <p><strong>Features:</strong> {item.features}</p>}
                    {item.comments && <p><strong>Notes:</strong> {item.comments}</p>}
                    <p className="price">
                      <strong>
                        {item.forSale 
                          ? `$${item.minPrice} - $${item.maxPrice}`
                          : `$${item.minPricePerDay} - $${item.maxPricePerDay}${t.perDay}`
                        }
                      </strong>
                    </p>
                    {item.location && <p className="location">📍 {item.location}</p>}
                  </div>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(item.id)}
                  >
                    {t.delete}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>{t.noListings}</p>
          )}
        </div>
      </div>

      <style jsx>{`
        .list-equipment-page {
          padding: 2rem;
          background-color: #f5f5f5;
          min-height: 100vh;
        }

        .list-equipment-container {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        h1 {
          color: #333;
          margin-bottom: 2rem;
          text-align: center;
        }

        h2 {
          color: #667eea;
          margin-top: 2rem;
          margin-bottom: 1rem;
          border-bottom: 2px solid #667eea;
          padding-bottom: 0.5rem;
        }

        h3 {
          color: #333;
          margin-bottom: 1rem;
        }

        .equipment-form-section {
          margin-bottom: 3rem;
        }

        .listing-type-toggle {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          background: #f9f9f9;
          padding: 0.5rem;
          border-radius: 6px;
        }

        .toggle-btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 2px solid #ddd;
          background: white;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .toggle-btn.active {
          background-color: #667eea;
          color: white;
          border-color: #667eea;
        }

        .toggle-btn:hover {
          border-color: #667eea;
        }

        .success-message {
          background-color: #d4edda;
          color: #155724;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          border: 1px solid #c3e6cb;
        }

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          border: 1px solid #f5c6cb;
        }

        .equipment-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #333;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .price-section {
          background-color: #f9f9f9;
          padding: 1.5rem;
          border-radius: 6px;
          border: 1px solid #eee;
          margin-bottom: 1rem;
        }

        .price-input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .price-input-wrapper input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .price-input-wrapper input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .price-unit,
        .currency {
          color: #666;
          font-weight: 600;
          min-width: 40px;
        }

        .image-preview {
          margin-top: 1rem;
          max-width: 200px;
          overflow: hidden;
          border-radius: 4px;
        }

        .image-preview img {
          width: 100%;
          height: auto;
          object-fit: cover;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background-color: #667eea;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #5568d3;
          transform: translateY(-2px);
        }

        .btn-primary:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background-color: #c82333;
        }

        .my-equipment-section {
          margin-top: 3rem;
        }

        .equipment-list {
          display: grid;
          gap: 1rem;
        }

        .equipment-item {
          display: grid;
          grid-template-columns: 200px 1fr auto;
          gap: 1.5rem;
          padding: 1.5rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #fafafa;
          align-items: start;
        }

        .equipment-image {
          width: 200px;
          height: 150px;
          object-fit: cover;
          border-radius: 4px;
        }

        .item-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .equipment-details h3 {
          margin: 0;
          color: #333;
        }

        .listing-badge {
          display: inline-block;
          background-color: #667eea;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .equipment-details p {
          margin: 0.25rem 0;
          color: #666;
          font-size: 0.95rem;
        }

        .category {
          display: inline-block;
          background-color: #e8eeff;
          color: #667eea;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        .price {
          font-size: 1.25rem;
          color: #667eea;
          font-weight: bold;
          margin-top: 0.5rem;
        }

        .location {
          color: #999;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .listing-type-toggle {
            flex-direction: column;
          }

          .equipment-item {
            grid-template-columns: 1fr;
          }

          .equipment-image {
            width: 100%;
            height: auto;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .item-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

export default ListEquipment;