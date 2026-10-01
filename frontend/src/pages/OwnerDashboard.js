import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function OwnerDashboard({ language }) {
  const [summary, setSummary] = useState(null);
  const [activeRentals, setActiveRentals] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const translations = {
    en: {
      ownerDashboard: 'Owner Dashboard',
      overview: 'Overview',
      activeRentals: 'Active Rentals',
      upcomingBookings: 'Upcoming Bookings',
      earnings: 'Earnings',
      thisMonth: 'This Month',
      thisYear: 'This Year',
      totalListings: 'Total Listings',
      completedRentals: 'Completed Rentals',
      rating: 'Rating',
      reviews: 'Reviews',
      equipmentName: 'Equipment Name',
      renterName: 'Renter Name',
      startDate: 'Start Date',
      endDate: 'End Date',
      status: 'Status',
      dailyRate: 'Daily Rate',
      daysRemaining: 'Days Remaining',
      totalCost: 'Total Cost',
      estimatedRevenue: 'Estimated Revenue',
      pendingPayouts: 'Pending Payouts',
      noActiveRentals: 'No active rentals',
      noUpcomingBookings: 'No upcoming bookings',
      confirmed: 'Confirmed',
      pending: 'Pending',
      active: 'Active',
      loading: 'Loading...',
    },
    ka: {
      ownerDashboard: 'მესაკუთრის დაფა',
      overview: 'მიმოხილვა',
      activeRentals: 'აქტიური ქირავნობა',
      upcomingBookings: 'მოახლოებული დაკვეთები',
      earnings: 'შემოსავალი',
      thisMonth: 'ამ თვეს',
      thisYear: 'ამ წელს',
      totalListings: 'სულ სიები',
      completedRentals: 'დასრულებული ქირავნობა',
      rating: 'რეიტინგი',
      reviews: 'გამოხილვები',
      equipmentName: 'აღჭურვილობის სახელი',
      renterName: 'ქირავნობის სახელი',
      startDate: 'დაწყების თარიხი',
      endDate: 'დასრულების თარიხი',
      status: 'სტატუსი',
      dailyRate: 'დღიური ტარიფი',
      daysRemaining: 'დარჩენილი დღეები',
      totalCost: 'სულ ღირებულება',
      estimatedRevenue: 'სავარაუდო შემოსავალი',
      pendingPayouts: 'დაშვებული გადახდები',
      noActiveRentals: 'აქტიური ქირავნობა არ არის',
      noUpcomingBookings: 'მოახლოებული დაკვეთები არ არის',
      confirmed: 'დადასტურებული',
      pending: 'ნელი',
      active: 'აქტიური',
      loading: 'იტვირთება...',
    },
    ru: {
      ownerDashboard: 'Панель владельца',
      overview: 'Обзор',
      activeRentals: 'Активные аренды',
      upcomingBookings: 'Предстоящие бронирования',
      earnings: 'Прибыль',
      thisMonth: 'В этом месяце',
      thisYear: 'В этом году',
      totalListings: 'Всего объявлений',
      completedRentals: 'Завершенные аренды',
      rating: 'Рейтинг',
      reviews: 'Отзывы',
      equipmentName: 'Название оборудования',
      renterName: 'Имя арендатора',
      startDate: 'Дата начала',
      endDate: 'Дата окончания',
      status: 'Статус',
      dailyRate: 'Дневная ставка',
      daysRemaining: 'Осталось дней',
      totalCost: 'Общая стоимость',
      estimatedRevenue: 'Предполагаемый доход',
      pendingPayouts: 'Ожидающие платежи',
      noActiveRentals: 'Нет активных аренд',
      noUpcomingBookings: 'Нет предстоящих бронирований',
      confirmed: 'Подтвержденный',
      pending: 'В ожидании',
      active: 'Активный',
      loading: 'Загрузка...',
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

      const [summaryRes, activeRes, upcomingRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/dashboard-stats/owner/summary`, { headers }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/dashboard-stats/owner/active-rentals`, { headers }),
        axios.get(`${process.env.REACT_APP_API_URL}/api/dashboard-stats/owner/upcoming-bookings`, { headers }),
      ]);

      setSummary(summaryRes.data);
      setActiveRentals(activeRes.data);
      setUpcomingBookings(upcomingRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `$${amount.toFixed(2)}`;
  const formatDate = (date) => new Date(date).toLocaleDateString();

  if (loading) {
    return <div className="dashboard-loading">{t.loading}</div>;
  }

  return (
    <div className="owner-dashboard">
      <div className="dashboard-header">
        <h1>{t.ownerDashboard}</h1>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          {t.overview}
        </button>
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          {t.activeRentals}
        </button>
        <button
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          {t.upcomingBookings}
        </button>
      </div>

      {activeTab === 'overview' && summary && (
        <div className="overview-section">
          <div className="stats-grid">
            <div className="stat-card earnings-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <p className="stat-label">{t.earnings}</p>
                <p className="stat-value">{formatCurrency(summary.totalEarnings)}</p>
              </div>
            </div>

            <div className="stat-card month-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <p className="stat-label">{t.thisMonth}</p>
                <p className="stat-value">{formatCurrency(summary.thisMonth)}</p>
              </div>
            </div>

            <div className="stat-card year-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <p className="stat-label">{t.thisYear}</p>
                <p className="stat-value">{formatCurrency(summary.thisYear)}</p>
              </div>
            </div>

            <div className="stat-card listings-card">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <p className="stat-label">{t.totalListings}</p>
                <p className="stat-value">{summary.totalListings}</p>
              </div>
            </div>

            <div className="stat-card rentals-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <p className="stat-label">{t.completedRentals}</p>
                <p className="stat-value">{summary.completedRentals}</p>
              </div>
            </div>

            <div className="stat-card rating-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <p className="stat-label">{t.rating}</p>
                <p className="stat-value">{summary.averageRating} ({summary.totalReviews} {t.reviews})</p>
              </div>
            </div>
          </div>

          <div className="quick-stats">
            <div className="quick-stat">
              <span className="quick-label">{t.activeRentals}:</span>
              <span className="quick-value">{summary.activeRentals}</span>
            </div>
            <div className="quick-stat">
              <span className="quick-label">{t.upcomingBookings}:</span>
              <span className="quick-value">{summary.upcomingBookings}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'active' && (
        <div className="rentals-section">
          {activeRentals.length > 0 ? (
            <div className="rentals-grid">
              {activeRentals.map((rental) => (
                <div key={rental.id} className="rental-card">
                  <div className="rental-header">
                    <h3>{rental.equipmentName}</h3>
                    <span className="status-badge active">{t.active}</span>
                  </div>
                  <div className="rental-details">
                    <div className="detail-row">
                      <span className="detail-label">{t.renterName}:</span>
                      <span className="detail-value">{rental.renterName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t.startDate}:</span>
                      <span className="detail-value">{formatDate(rental.startDate)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t.endDate}:</span>
                      <span className="detail-value">{formatDate(rental.endDate)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t.daysRemaining}:</span>
                      <span className="detail-value highlight">{rental.daysRemaining} days</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t.dailyRate}:</span>
                      <span className="detail-value">{formatCurrency(rental.dailyRate)}</span>
                    </div>
                    <div className="detail-row total">
                      <span className="detail-label">{t.totalCost}:</span>
                      <span className="detail-value">{formatCurrency(rental.totalCost)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">{t.noActiveRentals}</p>
          )}
        </div>
      )}

      {activeTab === 'upcoming' && (
        <div className="bookings-section">
          {upcomingBookings.length > 0 ? (
            <div className="bookings-grid">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <h3>{booking.equipmentName}</h3>
                    <span className={`status-badge ${booking.status}`}>{booking.status === 'confirmed' ? t.confirmed : t.pending}</span>
                  </div>
                  <div className="booking-details">
                    <div className="detail-row">
                      <span className="detail-label">{t.renterName}:</span>
                      <span className="detail-value">{booking.renterName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t.startDate}:</span>
                      <span className="detail-value">{formatDate(booking.startDate)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t.endDate}:</span>
                      <span className="detail-value">{formatDate(booking.endDate)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">{t.dailyRate}:</span>
                      <span className="detail-value">{formatCurrency(booking.dailyRate)}</span>
                    </div>
                    <div className="detail-row total">
                      <span className="detail-label">{t.estimatedRevenue}:</span>
                      <span className="detail-value">{formatCurrency(booking.estimatedRevenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">{t.noUpcomingBookings}</p>
          )}
        </div>
      )}

      <style jsx>{`
        .owner-dashboard {
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

        .overview-section {
          animation: fadeIn 0.3s ease;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
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

        .earnings-card {
          border-left: 4px solid #4caf50;
        }

        .month-card {
          border-left: 4px solid #2196f3;
        }

        .year-card {
          border-left: 4px solid #ff9800;
        }

        .listings-card {
          border-left: 4px solid #9c27b0;
        }

        .rentals-card {
          border-left: 4px solid #00bcd4;
        }

        .rating-card {
          border-left: 4px solid #f44336;
        }

        .quick-stats {
          display: flex;
          gap: 2rem;
          padding: 1.5rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .quick-stat {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .quick-label {
          color: #666;
          font-weight: 500;
        }

        .quick-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #667eea;
        }

        .rentals-section,
        .bookings-section {
          animation: fadeIn 0.3s ease;
        }

        .rentals-grid,
        .bookings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .rental-card,
        .booking-card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .rental-card:hover,
        .booking-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .rental-header,
        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #eee;
        }

        .rental-header h3,
        .booking-header h3 {
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

        .status-badge.active {
          background: #4caf50;
        }

        .status-badge.confirmed {
          background: #2196f3;
        }

        .status-badge.pending {
          background: #ff9800;
        }

        .rental-details,
        .booking-details {
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

        .detail-value.highlight {
          color: #4caf50;
          font-weight: bold;
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
          .owner-dashboard {
            padding: 1rem;
          }

          .dashboard-header h1 {
            font-size: 1.8rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .quick-stats {
            flex-direction: column;
          }

          .rentals-grid,
          .bookings-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}