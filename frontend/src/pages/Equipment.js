import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Equipment({ language }) {
  const [equipment, setEquipment] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [listingType, setListingType] = useState('rent'); // 'rent' or 'buy'
  const navigate = useNavigate();

  const translations = {
    en: {
      searchPlaceholder: 'Search by name, model, features...',
      advancedFilters: 'Advanced Filters',
      hideFilters: 'Hide Filters',
      category: 'Category',
      manufacturer: 'Manufacturer',
      manufacturerPlaceholder: 'e.g., Makita, DeWalt...',
      condition: 'Condition',
      minPrice: 'Min Price per Day ($)',
      maxPrice: 'Max Price per Day ($)',
      minPriceSale: 'Min Price ($)',
      maxPriceSale: 'Max Price ($)',
      resetFilters: 'Reset Filters',
      found: 'Found',
      equipment: 'equipment',
      allCategories: 'All Categories',
      allConditions: 'All Conditions',
      brand: 'Brand',
      model: 'Model',
      year: 'Year',
      features: 'Features',
      bookNow: 'Book Now',
      buyNow: 'Buy Now',
      viewDetails: 'View Details',
      noEquipment: 'No equipment found matching your search.',
      loading: 'Loading...',
      excavators: 'Excavators',
      bulldozers: 'Bulldozers',
      cranes: 'Cranes',
      concreteMixers: 'Concrete Mixers',
      scaffolding: 'Scaffolding',
      compressors: 'Compressors',
      generators: 'Generators',
      forklifts: 'Forklifts',
      powerTools: 'Power Tools',
      other: 'Other',
      likeNew: 'Like New',
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      needsRepair: 'Needs Repair',
      rent: 'Rent',
      buy: 'Buy',
    },
    ka: {
      searchPlaceholder: 'ძებნა სახელი, მოდელი, ფიჩარებით...',
      advancedFilters: 'დამატებითი ფილტრები',
      hideFilters: 'ფილტრების დამალვა',
      category: 'კატეგორია',
      manufacturer: 'მწარმოებელი',
      manufacturerPlaceholder: 'მაგალითად, Makita, DeWalt...',
      condition: 'მდგომარეობა',
      minPrice: 'მინ ფასი დღეში ($)',
      maxPrice: 'მაქს ფასი დღეში ($)',
      minPriceSale: 'მინ ფასი ($)',
      maxPriceSale: 'მაქს ფასი ($)',
      resetFilters: 'ფილტრების გადატვირთვა',
      found: 'ნაპოვნია',
      equipment: 'აღჭურვილობა',
      allCategories: 'ყველა კატეგორია',
      allConditions: 'ყველა მდგომარეობა',
      brand: 'ბრენდი',
      model: 'მოდელი',
      year: 'წელი',
      features: 'ფიჩარები',
      bookNow: 'დაჯავშვა',
      buyNow: 'ხელახლა ყიდვა',
      viewDetails: 'დეტალების ნახვა',
      noEquipment: 'აღჭურვილობა ნაპოვნი არ არის თქვენი ძებნის მიხედვით.',
      loading: 'იტვირთება...',
      excavators: 'ექსკავატორები',
      bulldozers: 'ბულდოზერები',
      cranes: 'წამწამები',
      concreteMixers: 'ბეტონის მიქსერები',
      scaffolding: 'შელფი',
      compressors: 'კომპრესორები',
      generators: 'გენერატორები',
      forklifts: 'ამწეები',
      powerTools: 'ელექტრული ხელსაწყოები',
      other: 'სხვა',
      likeNew: 'ახალივით',
      excellent: 'შესანიშნავი',
      good: 'კარგი',
      fair: 'ზომიერი',
      needsRepair: 'გარემონტება სჭირდება',
      rent: 'ქირაობა',
      buy: 'ყიდვა',
    },
    ru: {
      searchPlaceholder: 'Поиск по названию, модели, характеристикам...',
      advancedFilters: 'Дополнительные фильтры',
      hideFilters: 'Скрыть фильтры',
      category: 'Категория',
      manufacturer: 'Производитель',
      manufacturerPlaceholder: 'например, Makita, DeWalt...',
      condition: 'Состояние',
      minPrice: 'Мин цена в день ($)',
      maxPrice: 'Макс цена в день ($)',
      minPriceSale: 'Мин цена ($)',
      maxPriceSale: 'Макс цена ($)',
      resetFilters: 'Сбросить фильтры',
      found: 'Найдено',
      equipment: 'оборудование',
      allCategories: 'Все категории',
      allConditions: 'Все состояния',
      brand: 'Бренд',
      model: 'Модель',
      year: 'Год',
      features: 'Характеристики',
      bookNow: 'Забронировать',
      buyNow: 'Купить',
      viewDetails: 'Просмотр деталей',
      noEquipment: 'Оборудование, соответствующее вашему поиску, не найдено.',
      loading: 'Загрузка...',
      excavators: 'Экскаваторы',
      bulldozers: 'Бульдозеры',
      cranes: 'Краны',
      concreteMixers: 'Бетономешалки',
      scaffolding: 'Леса',
      compressors: 'Компрессоры',
      generators: 'Генераторы',
      forklifts: 'Погрузчики',
      powerTools: 'Электроинструменты',
      other: 'Другое',
      likeNew: 'Как новое',
      excellent: 'Отлично',
      good: 'Хорошо',
      fair: 'Среднее',
      needsRepair: 'Нужен ремонт',
      rent: 'Аренда',
      buy: 'Покупка',
    },
  };

  const t = translations[language] || translations['en'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signup');
      return;
    }
    fetchEquipment();
  }, [searchTerm, category, condition, minPrice, maxPrice, manufacturer, listingType, navigate]);

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (category) params.category = category;
      if (listingType === 'buy') params.forSale = true;

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/equipment`, { 
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      let filtered = response.data;

      if (condition) {
        filtered = filtered.filter(item => item.condition === condition);
      }

      if (minPrice) {
        if (listingType === 'rent') {
          filtered = filtered.filter(item => item.pricePerDay >= parseFloat(minPrice));
        } else {
          filtered = filtered.filter(item => item.price >= parseFloat(minPrice));
        }
      }

      if (maxPrice) {
        if (listingType === 'rent') {
          filtered = filtered.filter(item => item.pricePerDay <= parseFloat(maxPrice));
        } else {
          filtered = filtered.filter(item => item.price <= parseFloat(maxPrice));
        }
      }

      if (manufacturer) {
        filtered = filtered.filter(item => 
          item.manufacturer.toLowerCase().includes(manufacturer.toLowerCase())
        );
      }

      setEquipment(filtered);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCategory('');
    setCondition('');
    setMinPrice('');
    setMaxPrice('');
    setManufacturer('');
  };

  return (
    <div className="equipment-page">
      <div className="filters-section">
        {/* Rent / Buy Toggle */}
        <div className="listing-type-toggle">
          <button
            className={`toggle-btn ${listingType === 'rent' ? 'active' : ''}`}
            onClick={() => {
              setListingType('rent');
              resetFilters();
            }}
          >
            📅 {t.rent}
          </button>
          <button
            className={`toggle-btn ${listingType === 'buy' ? 'active' : ''}`}
            onClick={() => {
              setListingType('buy');
              resetFilters();
            }}
          >
            🛒 {t.buy}
          </button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-main"
          />
          <button 
            className="toggle-filters-btn"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? `▼ ${t.hideFilters}` : `▶ ${t.advancedFilters}`}
          </button>
        </div>

        {showAdvancedFilters && (
          <div className="advanced-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>{t.category}</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="filter-select">
                  <option value="">{t.allCategories}</option>
                  <option value="excavators">{t.excavators}</option>
                  <option value="bulldozers">{t.bulldozers}</option>
                  <option value="cranes">{t.cranes}</option>
                  <option value="concrete-mixers">{t.concreteMixers}</option>
                  <option value="scaffolding">{t.scaffolding}</option>
                  <option value="compressors">{t.compressors}</option>
                  <option value="generators">{t.generators}</option>
                  <option value="forklifts">{t.forklifts}</option>
                  <option value="power-tools">{t.powerTools}</option>
                  <option value="other">{t.other}</option>
                </select>
              </div>

              <div className="filter-group">
                <label>{t.manufacturer}</label>
                <input
                  type="text"
                  placeholder={t.manufacturerPlaceholder}
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-group">
                <label>{t.condition}</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)} className="filter-select">
                  <option value="">{t.allConditions}</option>
                  <option value="like-new">{t.likeNew}</option>
                  <option value="excellent">{t.excellent}</option>
                  <option value="good">{t.good}</option>
                  <option value="fair">{t.fair}</option>
                  <option value="needs-repair">{t.needsRepair}</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label>{listingType === 'rent' ? t.minPrice : t.minPriceSale}</label>
                <input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="filter-input"
                  min="0"
                />
              </div>

              <div className="filter-group">
                <label>{listingType === 'rent' ? t.maxPrice : t.maxPriceSale}</label>
                <input
                  type="number"
                  placeholder={listingType === 'rent' ? '5000' : '100000'}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="filter-input"
                  min="0"
                />
              </div>

              <div className="filter-group reset-group">
                <button onClick={resetFilters} className="reset-btn">{t.resetFilters}</button>
              </div>
            </div>
          </div>
        )}

        <div className="results-count">
          {t.found} <strong>{equipment.length}</strong> {t.equipment}
        </div>
      </div>

      <div className="equipment-grid">
        {loading ? (
          <p className="loading-text">{t.loading}</p>
        ) : equipment.length > 0 ? (
          equipment.map((item) => (
            <div key={item.id} className="equipment-card-advanced">
              <div className="card-image-container">
                <img src={item.imageUrl || 'https://via.placeholder.com/300'} alt={item.name} />
                <span className="category-badge">{item.category}</span>
                <span className="listing-type-badge">{listingType === 'rent' ? '📅' : '🛒'}</span>
              </div>
              
              <div className="card-content">
                <h3>{item.name}</h3>
                
                <div className="equipment-specs">
                  {item.manufacturer && <p><strong>{t.brand}:</strong> {item.manufacturer}</p>}
                  {item.model && <p><strong>{t.model}:</strong> {item.model}</p>}
                  {item.year && <p><strong>{t.year}:</strong> {item.year}</p>}
                  {item.condition && (
                    <p><strong>{t.condition}:</strong> <span className={`condition-badge ${item.condition}`}>{item.condition}</span></p>
                  )}
                </div>

                <p className="description-text">{item.description}</p>

                {item.features && (
                  <div className="features-list">
                    <strong>{t.features}:</strong> {item.features}
                  </div>
                )}

                {item.location && <p className="location-text">📍 {item.location}</p>}
              </div>

              <div className="card-footer">
                <div className="price-section">
                  <span className="price-amount">
                    ${listingType === 'rent' ? item.pricePerDay : item.price}
                  </span>
                  <span className="price-unit">{listingType === 'rent' ? '/day' : ''}</span>
                </div>
              </div>

              <div className="card-footer-buttons">
                <Link to={`/equipment/${item.id}`} className="view-details-btn">{t.viewDetails}</Link>
                {listingType === 'rent' ? (
                  <Link to={`/booking/${item.id}`} className="book-btn">{t.bookNow}</Link>
                ) : (
                  <Link to={`/equipment/${item.id}`} className="book-btn">{t.buyNow}</Link>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>{t.noEquipment}</p>
            <button onClick={resetFilters} className="reset-btn">{t.resetFilters}</button>
          </div>
        )}
      </div>

      <style jsx>{`
        .equipment-page {
          padding: 2rem;
          background-color: #f5f5f5;
          min-height: 100vh;
        }

        .filters-section {
          max-width: 1200px;
          margin: 0 auto 2rem;
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

        .search-bar {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .search-input-main {
          padding: 0.75rem 1rem;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .search-input-main:focus {
          outline: none;
          border-color: #667eea;
        }

        .toggle-filters-btn {
          padding: 0.75rem 1.5rem;
          background-color: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.3s ease;
        }

        .toggle-filters-btn:hover {
          background-color: #5568d3;
        }

        .advanced-filters {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background-color: #f9f9f9;
          border-radius: 6px;
          border: 1px solid #eee;
        }

        .filter-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
        }

        .filter-group label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #333;
          font-size: 0.9rem;
        }

        .filter-input,
        .filter-select {
          padding: 0.65rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.95rem;
          transition: border-color 0.3s ease;
        }

        .filter-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: #667eea;
        }

        .reset-group {
          display: flex;
          align-items: flex-end;
        }

        .reset-btn {
          padding: 0.65rem 1rem;
          background-color: #999;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.3s ease;
          width: 100%;
        }

        .reset-btn:hover {
          background-color: #777;
        }

        .results-count {
          font-size: 0.95rem;
          color: #666;
          margin-top: 1rem;
        }

        .equipment-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
        }

        .equipment-card-advanced {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .equipment-card-advanced:hover {
          transform: translateY(-8px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .card-image-container {
          position: relative;
          overflow: hidden;
          height: 220px;
        }

        .card-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .equipment-card-advanced:hover .card-image-container img {
          transform: scale(1.05);
        }

        .category-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background-color: #667eea;
          color: white;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .listing-type-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background-color: rgba(0, 0, 0, 0.5);
          color: white;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 1rem;
        }

        .card-content {
          padding: 1.5rem;
          flex-grow: 1;
        }

        .card-content h3 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1.2rem;
        }

        .equipment-specs {
          margin-bottom: 1rem;
          border-bottom: 1px solid #eee;
          padding-bottom: 1rem;
        }

        .equipment-specs p {
          margin: 0.4rem 0;
          color: #666;
          font-size: 0.9rem;
        }

        .condition-badge {
          display: inline-block;
          padding: 0.2rem 0.6rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-left: 0.5rem;
        }

        .condition-badge.like-new,
        .condition-badge.excellent {
          background-color: #d4edda;
          color: #155724;
        }

        .condition-badge.good {
          background-color: #cce5ff;
          color: #004085;
        }

        .condition-badge.fair {
          background-color: #fff3cd;
          color: #856404;
        }

        .condition-badge.needs-repair {
          background-color: #f8d7da;
          color: #721c24;
        }

        .description-text {
          color: #666;
          font-size: 0.95rem;
          line-height: 1.4;
          margin-bottom: 0.8rem;
        }

        .features-list {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0.8rem;
          font-style: italic;
        }

        .location-text {
          color: #999;
          font-size: 0.9rem;
          margin: 0;
        }

        .card-footer {
          padding: 1.5rem;
          background-color: #f9f9f9;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price-section {
          display: flex;
          align-items: baseline;
          gap: 0.3rem;
        }

        .price-amount {
          font-size: 1.8rem;
          font-weight: bold;
          color: #667eea;
        }

        .price-unit {
          color: #999;
          font-size: 0.9rem;
        }

        .card-footer-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.8rem;
          padding: 0 1.5rem 1.5rem 1.5rem;
        }

        .view-details-btn,
        .book-btn {
          padding: 0.7rem 1rem;
          border-radius: 4px;
          text-decoration: none;
          font-weight: 600;
          transition: background-color 0.3s ease;
          text-align: center;
          border: none;
          cursor: pointer;
          display: inline-block;
        }

        .view-details-btn {
          background-color: #999;
          color: white;
        }

        .view-details-btn:hover {
          background-color: #777;
        }

        .book-btn {
          background-color: #667eea;
          color: white;
        }

        .book-btn:hover {
          background-color: #5568d3;
        }

        .no-results {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .loading-text {
          grid-column: 1 / -1;
          text-align: center;
          padding: 2rem;
          font-size: 1.1rem;
        }

        @media (max-width: 768px) {
          .listing-type-toggle {
            flex-direction: column;
          }

          .search-bar {
            grid-template-columns: 1fr;
          }

          .filter-row {
            grid-template-columns: 1fr;
          }

          .equipment-grid {
            grid-template-columns: 1fr;
          }

          .card-footer {
            flex-direction: column;
            gap: 1rem;
          }

          .card-footer-buttons {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Equipment;