import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Dashboard({ language, setLanguage }) {
  const [userListings, setUserListings] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const translations = {
    en: {
      dashboard: 'Dashboard',
      myListings: 'My Listings',
      myBookings: 'My Bookings',
      recentNotifications: 'Recent Notifications',
      noListings: 'You have no listings yet',
      noBookings: 'You have no bookings yet',
      noNotifications: 'No new notifications',
      loading: 'Loading...',
      error: 'Error loading data',
      viewAll: 'View All',
      markAsRead: 'Mark as Read',
    },
    ka: {
      dashboard: 'დაფა',
      myListings: 'ჩემი სია',
      myBookings: 'ჩემი დაკვეთები',
      recentNotifications: 'ახალი შეტყობინებები',
      noListings: 'თქვენ ჯერ აღჭურვილობა არ დაამატე',
      noBookings: 'თქვენ ჯერ დაკვეთა არ აქვთ',
      noNotifications: 'ახალი შეტყობინება არ არის',
      loading: 'იტვირთება...',
      error: 'შეცდომა მონაცემების ჩატვირთვისას',
      viewAll: 'ყველას ნახვა',
      markAsRead: 'წაკითხულად მონიშვნა',
    },
    ru: {
      dashboard: 'Панель',
      myListings: 'Мои объявления',
      myBookings: 'Мои бронирования',
      recentNotifications: 'Недавние уведомления',
      noListings: 'У вас еще нет объявлений',
      noBookings: 'У вас еще нет бронирований',
      noNotifications: 'Нет новых уведомлений',
      loading: 'Загрузка...',
      error: 'Ошибка загрузки данных',
      viewAll: 'Просмотреть все',
      markAsRead: 'Отметить как прочитанное',
    },
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch user listings
      const listingsRes = await axios.get(`${process.env.REACT_APP_API_URL}/equipment/user-listings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserListings(listingsRes.data || []);

      // Fetch user bookings
      const bookingsRes = await axios.get(`${process.env.REACT_APP_API_URL}/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserBookings(bookingsRes.data || []);

      // Fetch recent notifications
      const notificationsRes = await axios.get(`${process.env.REACT_APP_API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allNotifications = notificationsRes.data || [];
      setRecentNotifications(allNotifications.slice(0, 5));
      setUnreadCount(allNotifications.filter((n) => !n.isRead).length);

      setError(null);
    } catch (err) {
      setError(t.error);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL}/notifications/${id}/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUserData();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) return <div className="dashboard-container"><p>{t.loading}</p></div>;

  return (
    <>
      <div className="dashboard-container">
        <h1>👋 {t.dashboard}</h1>

        {/* NOTIFICATIONS WIDGET */}
        <section className="dashboard-section notifications-widget">
          <div className="section-header">
            <h2>🔔 {t.recentNotifications}</h2>
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            <Link to="/notifications" className="view-all-link">{t.viewAll} →</Link>
          </div>

          {recentNotifications.length > 0 ? (
            <div className="notifications-preview">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-preview-item ${notification.isRead ? 'read' : 'unread'}`}
                >
                  <div className="notification-preview-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <small>{new Date(notification.createdAt).toLocaleDateString()}</small>
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="btn-mark-read"
                    >
                      ✓
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">{t.noNotifications}</p>
          )}
        </section>

        {/* LISTINGS SECTION */}
        <section className="dashboard-section">
          <h2>{t.myListings}</h2>
          {userListings.length > 0 ? (
            <div className="listings-grid">
              {userListings.map((listing) => (
                <div key={listing.id} className="listing-card">
                  <h3>{listing.name}</h3>
                  <p>{listing.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>{t.noListings}</p>
          )}
        </section>

        {/* BOOKINGS SECTION */}
        <section className="dashboard-section">
          <h2>{t.myBookings}</h2>
          {userBookings.length > 0 ? (
            <div className="bookings-grid">
              {userBookings.map((booking) => (
                <div key={booking.id} className="booking-card">
                  <h3>Booking #{booking.id}</h3>
                  <p><strong>Status:</strong> {booking.status}</p>
                  <p><strong>From:</strong> {booking.startDate}</p>
                  <p><strong>To:</strong> {booking.endDate}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>{t.noBookings}</p>
          )}
        </section>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 2rem;
          background-color: #f5f5f5;
          min-height: 100vh;
        }

        .dashboard-container h1 {
          color: #333;
          margin-bottom: 2rem;
          text-align: center;
        }

        .dashboard-section {
          background: white;
          padding: 2rem;
          margin-bottom: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          max-width: 1000px;
          margin-left: auto;
          margin-right: auto;
        }

        .dashboard-section h2 {
          color: #667eea;
          margin-bottom: 1rem;
          border-bottom: 2px solid #667eea;
          padding-bottom: 0.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h2 {
          margin: 0;
          flex: 1;
          border: none;
          padding: 0;
        }

        .badge {
          background: #ff5252;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: bold;
          margin-left: 0.5rem;
        }

        .view-all-link {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
          white-space: nowrap;
        }

        .view-all-link:hover {
          text-decoration: underline;
        }

        .notifications-widget {
          border-left: 4px solid #667eea;
        }

        .notifications-preview {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .notification-preview-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f9f9f9;
          border-radius: 4px;
          border-left: 4px solid #ddd;
        }

        .notification-preview-item.unread {
          background: #f0f4ff;
          border-left-color: #667eea;
        }

        .notification-preview-content h4 {
          color: #333;
          margin: 0 0 0.25rem 0;
          font-size: 0.95rem;
        }

        .notification-preview-content p {
          color: #666;
          margin: 0;
          font-size: 0.9rem;
        }

        .notification-preview-content small {
          color: #999;
          display: block;
          margin-top: 0.25rem;
        }

        .btn-mark-read {
          padding: 0.5rem;
          background: #e8f5e9;
          border: 1px solid #4caf50;
          color: #4caf50;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .btn-mark-read:hover {
          background: #4caf50;
          color: white;
        }

        .empty-state {
          text-align: center;
          color: #999;
          padding: 1rem;
        }

        .listings-grid,
        .bookings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .listing-card,
        .booking-card {
          background: #f9f9f9;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #ddd;
          transition: all 0.3s ease;
        }

        .listing-card:hover,
        .booking-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .listing-card h3,
        .booking-card h3 {
          color: #333;
          margin-bottom: 0.5rem;
        }

        .listing-card p,
        .booking-card p {
          color: #666;
          font-size: 0.95rem;
          margin: 0.25rem 0;
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
          }

          .dashboard-section {
            padding: 1.5rem;
          }

          .listings-grid,
          .bookings-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .view-all-link {
            margin-left: auto;
          }
        }
      `}</style>
    </>
  );
}