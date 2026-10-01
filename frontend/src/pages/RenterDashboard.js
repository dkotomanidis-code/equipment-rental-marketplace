import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function RenterDashboard({ language }) {
  const [summary, setSummary] = useState(null);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const translations = {
    en: {
      renterDashboard: 'Renter Dashboard',
      overview: 'Overview',
      rentalHistory: 'Rental History',
      favorites: 'Favorites',
      totalSpent: 'Total Spent',
      thisMonth: 'This Month',
      activeRentals: 'Active Rentals',
      completedRentals: 'Completed Rentals',
      totalFavorites: 'Total Favorites',
      upcomingRentals: 'Upcoming Rentals',
      equipmentName: 'Equipment Name',
      ownerName: 'Owner Name',
      rentalDate: 'Rental Date',
      returnDate: 'Return Date',
      status: 'Status',
      totalCost: 'Total Cost',
      dailyRate: 'Daily Rate',
      daysRented: 'Days Rented',
      rating: 'Rating',
      review: 'Review',
      noHistory: 'No rental history',
      noFavorites: 'No favorite equipment yet',
      completed: 'Completed',
      active: 'Active',
      location: 'Location',
      reviews: 'Reviews',
      availableFrom: 'Available From',
      removeFavorite: 'Remove',
      bookNow: 'Book Now',
      daysRemaining: 'Days Remaining',
      loading: 'Loading...',
      averageRating: 'Your Average Rating',
    },
    ka: {
      renterDashboard: 'მოიჯაროს დაფა',
      overview: 'მიმოხილვა',
      rentalHistory: 'ქირავნობის ისტორია',
      favorites: 'ფავორიტები',
      totalSpent: 'სულ დახარჯული',
      thisMonth: 'ამ თვეს',
      activeRentals: 'აქტიური ქირავნობა',
      completedRentals: 'დასრულებული ქირავნობა',
      totalFavorites: 'სულ ფავორიტები',
      upcomingRentals: 'მოახლოებული ქირავნობა',
      equipmentName: 'აღჭურვილობის სახელი',
      ownerName: 'მესაკუთრის სახელი',
      rentalDate: 'ქირავნობის თარიხი',
      returnDate: 'დაბრუნების თარიხი',
      status: 'სტატუსი',
      totalCost: 'სულ ღირებულება',
      dailyRate: 'დღიური ტარიფი',
      daysRented: 'ქირავნობული დღეები',
      rating: 'რეიტინგი',
      review: 'გამოხილვა',
      noHistory: 'ქირავნობის ისტორია არ არის',
      noFavorites: 'ფავორიტი აღჭურვილობა ჯერ არ არის',
      completed: 'დასრულებული',
      active: 'აქტიური',
      location: 'მდებარეობა',
      reviews: 'გამოხილვები',
      availableFrom: 'ხელმისაწვდომი თუ',
      removeFavorite: 'წაშლა',
      bookNow: 'რეზერვი',
      daysRemaining: 'დარჩენილი დღეები',
      loading: 'იტვირთება...',
      averageRating: 'თქვენი საშუალო რეიტინგი',
    },
    ru: {
      renterDashboard: 'Панель арендатора',
      overview: 'Обзор',
      rentalHistory: 'История аренды',
      favorites: 'Избранное',
      totalSpent: 'Всего потрачено',
      thisMonth: 'В этом месяце',
      activeRentals: 'Активные аренды',
      completedRentals: 'Завершенные аренды',
      totalFavorites: 'Всего избранного',
      upcomingRentals: 'Предстоящие аренды',
      equipmentName: 'Название оборудования',
      ownerName: 'Имя владельца',
      rentalDate: 'Дата аренды',
      returnDate: 'Дата возврата',
      status: 'Статус',
      totalCost: 'Общая стоимость',
      dailyRate: 'Дневная ставка',
      daysRented: 'Дни в аренде',
      rating: 'Рейтинг',
      review: 'Отзыв',
      noHistory: 'Нет истории аренды',
      noFavorites: 'Нет избранного оборудования',
      completed: 'Завершенный',
      active: 'Активный',
      location: 'Местоположение',
      reviews: 'Отзывы',
      availableFrom: 'Доступно с',
      removeFavorite: 'Удалить',
      bookNow: 'Зарезервировать',
      daysRemaining: 'Осталось дней',
      loading: 'Загрузка...',
      averageRating: 'Ваш средний рейтинг',
    },
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [summaryRes, historyRes, favoritesRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/dashboard-stats/renter/summary`, { headers }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/dashboard-stats/renter/rental-history`, { headers }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/dashboard-stats/renter/favorites`, { headers }),
      ]);

      setSummary(summaryRes.data);
      setRentalHistory(historyRes.data);
      setFavorites(favoritesRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (equipmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/dashboard-stats/renter/favorites/${equipmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFavorites(favorites.filter(fav => fav.id !== equipmentId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const formatCurrency = (amount) => `$${amount.toFixed(2)}`;
  const formatDate = (date) => new Date(date).toLocaleDateString();

  if (loading) {
    return <div className="dashboard-loading">{t.loading}</div>;
  }

  return (
    <div className="renter-dashboard">
      <div className="dashboard-header">
        <h1>{t.renterDashboard}</h1>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          {t.overview}
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          {t.rentalHistory}
        </button>
        <button
          className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          {t.favorites}
        </button>
      </div>

      {activeTab === 'overview' && summary && (
        <div className="overview-section">
          <div className="stats-grid">
            <div className="stat-card spent-card">
              <div className="stat-icon">💵</div>
              <div className="stat-content">
                <p className="stat-label">{t.totalSpent}</p>
                <p className="stat-value">{formatCurrency(summary.totalSpent)}</p>
              </div>
            </div>

            <div className="stat-card month-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <p className="stat-label">{t.thisMonth}</p>
                <p className="stat-value">{formatCurrency(summary.thisMonth)}</p>
              </div>
            </div>

            <div className="stat-card active-card">
              <div className="stat-icon">🔴</div>
              <div className="stat-content">
                <p className="stat-label">{t.activeRentals}</p>
                <p className="stat-value">{summary.activeRentals}</p>
              </div>
            </div>

            <div className="stat-card completed-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <p className="stat-label">{t.completedRentals}</p>
                <p className="stat-value">{summary.completedRentals}</p>
              </div>
            </div>

            <div className="stat-card favorites-card">
              <div className="stat-icon">❤️</div>
              <div className="stat-content">
                <p className="stat-label">{t.totalFavorites}</p>
                <p className="stat-value">{summary.totalFavorites}</p>
              </div>
            </div>

            <div className="stat-card rating-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <p className="stat-label">{t.averageRating}</p>
                <p className="stat-value">{summary.averageRating}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-section">
          {rentalHistory.length > 0 ? (
            <div className="history-grid">
              {rentalHistory.map((rental) => (
                <div key={rental.id} className="history-card">
                  <div className="history-header">
                    <h3>{rental.equipmentName}</h3>
                    <span className={`status-badge ${rental.status}`}>
                      {rental.status === 'completed' ? t.completed : t.active}
                    </span>
                  </div>

                  <div className="history-details">
                    <div className="detail-row">
                      <span className="detail-label">{t.ownerName}:</span>
                      <span className="detail-value">{rental.ownerName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t.rentalDate}:</span>
                      <span className="detail-value">{formatDate(rental.rentalDate)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t.returnDate}:</span>
                      <span className="detail-value">{formatDate(rental.returnDate)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t.daysRented}:</span>
                      <span className="detail-value">{rental.daysRented}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t.dailyRate}:</span>
                      <span className="detail-value">{formatCurrency(rental.dailyRate)}</span>
                    </div>
                    <div className="detail-row total">
                      <span className="detail-label">{t.totalCost}:</span>
                      <span className="detail-value">{formatCurrency(rental.totalCost)}</span>
                    </div>

                    {rental.status === 'completed' && (
                      <div className="review-section">
                        <div className="review-rating">
                          <span className="rating-label">{t.rating}:</span>
                          <div className="stars">
                            {'⭐'.repeat(rental.rating)}
                          </div>
                        </div>
                        {rental.review && (
                          <div className="review-text">
                            <span className="review-label">{t.review}:</span>
                            <p>{rental.review}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {rental.status === 'active' && (
                      <div className="active-rental-info">
                        <span className="daysRemaining">{t.daysRemaining}: {rental.daysRemaining}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">{t.noHistory}</p>
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="favorites-section">
          {favorites.length > 0 ? (
            <div className="favorites-grid">
              {favorites.map((equipment) => (
                <div key={equipment.id} className="favorite-card">
                  <div className="favorite-image-placeholder">📦</div>

                  <div className="favorite-content">
                    <h3>{equipment.name}</h3>
                    <p className="owner-name">{equipment.owner}</p>

                    <div className="rating-row">
                      <span className="stars">{'⭐'.repeat(Math.floor(equipment.rating))}</span>
                      <span className="review-count">({equipment.reviews} {t.reviews})</span>
                    </div>

                    <div className="location-row">
                      <span className="location-icon">📍</span>
                      <span className="location">{equipment.location}</span>
                    </div>

                    <div className="price-row">
                      <span className="daily-rate">{formatCurrency(equipment.dailyRate)}/day</span>
                    </div>

                    <div className="availability">
                      <span className="available-label">{t.availableFrom}:</span>
                      <span className="available-date">{formatDate(equipment.availableFrom)}</span>
                    </div>

                    <div className="favorite-actions">
                      <button className="btn-book">{t.bookNow}</button>
                      <button
                        className="btn-remove"
                        onClick={() => handleRemoveFavorite(equipment.id)}
                      >
                        ❌ {t.removeFavorite}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">{t.noFavorites}</p>
          )}
        </div>
      )}

      <style jsx>{`
        .renter-dashboard {
          padding: 2rem;
          background: #f5f5f5;
          min-height: 100vh;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          font-size: 2.5rem;
          color: #333;
          margin: 0;
        }

        .dashboard-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid #ddd;
        }

        .tab-btn {
          padding: 1rem 1.5rem;
          border: none;
          background: transparent;
          color: #666;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
        }

        .tab-btn:hover {
          color: #667eea;
        }

        .tab-btn.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .overview-section,
        .history-section,
        .favorites-section {
          animation: fadeIn 0.3s ease;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          background: white;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          font-size: 2.5rem;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          color: #999;
          font-size: 0.9rem;
          margin: 0 0 0.5rem 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: bold;
          color: #333;
          margin: 0;
        }

        .spent-card {
          border-left: 4px solid #2196f3;
        }

        .month-card {
          border-left: 4px solid #ff9800;
        }

        .active-card {
          border-left: 4px solid #f44336;
        }

        .completed-card {
          border-left: 4px solid #4caf50;
        }

        .favorites-card {
          border-left: 4px solid #e91e63;
        }

        .rating-card {
          border-left: 4px solid #ffc107;
        }

        .history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .history-card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .history-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #eee;
        }

        .history-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.2rem;
        }

        .status-badge {
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: bold;
          text-transform: uppercase;
          color: white;
        }

        .status-badge.completed {
          background: #4caf50;
        }

        .status-badge.active {
          background: #f44336;
        }

        .history-details {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }

        .detail-row.total {
          padding-top: 1rem;
          border-top: 2px solid #eee;
          font-weight: bold;
          color: #667eea;
        }

        .detail-label {
          color: #999;
          font-size: 0.9rem;
        }

        .detail-value {
          color: #333;
          font-weight: 500;
        }

        .review-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 2px solid #eee;
        }

        .review-rating {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .rating-label {
          color: #999;
          font-size: 0.9rem;
        }

        .stars {
          font-size: 1rem;
        }

        .review-text {
          margin-top: 0.5rem;
        }

        .review-label {
          color: #999;
          font-size: 0.9rem;
        }

        .review-text p {
          margin: 0.5rem 0 0 0;
          color: #666;
          font-style: italic;
        }

        .active-rental-info {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 2px solid #eee;
          text-align: center;
        }

        .daysRemaining {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: #fff3cd;
          border-radius: 4px;
          color: #856404;
          font-weight: bold;
        }

        .favorites-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .favorite-card {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .favorite-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .favorite-image-placeholder {
          width: 100%;
          height: 200px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
        }

        .favorite-content {
          padding: 1.5rem;
        }

        .favorite-content h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.2rem;
          color: #333;
        }

        .owner-name {
          margin: 0 0 1rem 0;
          color: #999;
          font-size: 0.9rem;
        }

        .rating-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.8rem;
        }

        .review-count {
          color: #999;
          font-size: 0.9rem;
        }

        .location-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.8rem;
          color: #666;
        }

        .location-icon {
          font-size: 1rem;
        }

        .location {
          font-size: 0.9rem;
        }

        .price-row {
          margin-bottom: 0.8rem;
        }

        .daily-rate {
          font-size: 1.3rem;
          font-weight: bold;
          color: #667eea;
        }

        .availability {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding: 0.8rem;
          background: #f5f5f5;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .available-label {
          color: #999;
        }

        .available-date {
          color: #333;
          font-weight: 500;
        }

        .favorite-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-book,
        .btn-remove {
          flex: 1;
          padding: 0.75rem;
          border: none;
          border-radius: 4px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-book {
          background: #667eea;
          color: white;
        }

        .btn-book:hover {
          background: #5568d3;
        }

        .btn-remove {
          background: #f5f5f5;
          color: #666;
        }

        .btn-remove:hover {
          background: #e0e0e0;
        }

        .no-data {
          text-align: center;
          color: #999;
          padding: 3rem;
          font-size: 1.1rem;
          background: white;
          border-radius: 8px;
        }

        .dashboard-loading {
          text-align: center;
          padding: 3rem;
          font-size: 1.2rem;
          color: #666;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .renter-dashboard {
            padding: 1rem;
          }

          .dashboard-header h1 {
            font-size: 1.8rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .history-grid,
          .favorites-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}