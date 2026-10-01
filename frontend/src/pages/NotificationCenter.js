import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function NotificationCenter({ language }) {
  const [allNotifications, setAllNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  const translations = {
    en: {
      notifications: 'Notifications',
      markAllRead: 'Mark All as Read',
      noNotifications: 'No notifications yet',
      loading: 'Loading...',
      error: 'Error loading notifications',
      unread: 'Unread',
      read: 'Read',
      all: 'All',
    },
    ka: {
      notifications: 'შეტყობინებები',
      markAllRead: 'ყველაფრის წაკითხულად მონიშვნა',
      noNotifications: 'ჯერ შეტყობინება არ არის',
      loading: 'იტვირთება...',
      error: 'შეცდომა შეტყობინებების ჩატვირთვისას',
      unread: 'წაუკითხელი',
      read: 'წაკითხული',
      all: 'ყველა',
    },
    ru: {
      notifications: 'Уведомления',
      markAllRead: 'Отметить все как прочитанные',
      noNotifications: 'Уведомлений еще нет',
      loading: 'Загрузка...',
      error: 'Ошибка загрузки уведомлений',
      unread: 'Непрочитанные',
      read: 'Прочитанные',
      all: 'Все',
    },
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllNotifications(res.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL}/notifications/${id}/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL}/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_URL}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getFilteredNotifications = () => {
    if (filter === 'unread') return allNotifications.filter((n) => !n.isRead);
    if (filter === 'read') return allNotifications.filter((n) => n.isRead);
    return allNotifications;
  };

  const filteredNotifications = getFilteredNotifications();

  if (loading) {
    return <div className="notification-center"><p>{t.loading}</p></div>;
  }

  return (
    <div className="notification-center">
      <div className="notification-header">
        <h1>🔔 {t.notifications}</h1>
        <div className="notification-info">
          <span className="unread-badge">{unreadCount}</span>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn-mark-all">
              {t.markAllRead}
            </button>
          )}
        </div>
      </div>

      <div className="notification-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          {t.all}
        </button>
        <button
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          {t.unread} ({unreadCount})
        </button>
        <button
          className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
          onClick={() => setFilter('read')}
        >
          {t.read}
        </button>
      </div>

      <div className="notifications-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
            >
              <div className="notification-content">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <small>{new Date(notification.createdAt).toLocaleString()}</small>
              </div>
              <div className="notification-actions">
                {!notification.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="btn-read"
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notification.id)}
                  className="btn-delete"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-notifications">{t.noNotifications}</p>
        )}
      </div>

      <style jsx>{`
        .notification-center {
          padding: 2rem;
          max-width: 900px;
          margin: 0 auto;
          background: #f5f5f5;
          min-height: 100vh;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .notification-header h1 {
          color: #333;
          margin: 0;
        }

        .notification-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .unread-badge {
          background: #ff5252;
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: 999px;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .btn-mark-all {
          padding: 0.5rem 1rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.3s ease;
        }

        .btn-mark-all:hover {
          background: #5568d3;
        }

        .notification-filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          background: transparent;
          border: none;
          color: #666;
          cursor: pointer;
          font-weight: 500;
          border-bottom: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .filter-btn.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .filter-btn:hover {
          color: #667eea;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .notification-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: white;
          border-left: 4px solid #ddd;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .notification-item.unread {
          background: #f0f4ff;
          border-left-color: #667eea;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
        }

        .notification-item.read {
          opacity: 0.8;
        }

        .notification-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .notification-content {
          flex: 1;
        }

        .notification-content h3 {
          color: #333;
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
        }

        .notification-content p {
          color: #666;
          margin: 0 0 0.5rem 0;
          font-size: 0.95rem;
        }

        .notification-content small {
          color: #999;
          font-size: 0.85rem;
        }

        .notification-actions {
          display: flex;
          gap: 0.5rem;
          margin-left: 1rem;
        }

        .btn-read,
        .btn-delete {
          padding: 0.5rem;
          background: transparent;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .btn-read:hover {
          background: #e8f5e9;
          border-color: #4caf50;
        }

        .btn-delete:hover {
          background: #ffebee;
          border-color: #f44336;
        }

        .no-notifications {
          text-align: center;
          color: #999;
          padding: 3rem 2rem;
          background: white;
          border-radius: 8px;
          font-size: 1.1rem;
        }

        @media (max-width: 768px) {
          .notification-center {
            padding: 1rem;
          }

          .notification-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .notification-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .notification-actions {
            margin-top: 1rem;
            margin-left: 0;
            width: 100%;
          }

          .notification-filters {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}