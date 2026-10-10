import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, authConfig } from '../utils/api';
import '../styles/Features.css';

const LABELS = {
  en: { title: 'Notifications', loading: 'Loading notifications…', empty: 'You have no notifications.', error: 'Could not load notifications.', readAll: 'Mark all as read' },
  ka: { title: 'გაფრთხილებები', loading: 'იტვირთება…', empty: 'გაფრთხილებები არ არის.', error: 'გაფრთხილებების ჩატვირთვა ვერ მოხერხდა.', readAll: 'ყველას წაკითხულად მონიშვნა' },
  ru: { title: 'Уведомления', loading: 'Загрузка…', empty: 'Уведомлений нет.', error: 'Не удалось загрузить уведомления.', readAll: 'Отметить все как прочитанные' },
};

export default function Notifications({ language = 'en' }) {
  const t = LABELS[language] || LABELS.en;
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    axios.get(`${API_BASE}/notifications?limit=50`, authConfig())
      .then(({ data }) => { if (active) { setItems(data.items); setStatus('ready'); } })
      .catch(() => { if (active) { setError(t.error); setStatus('error'); } });
    return () => { active = false; };
  }, [t.error]);

  async function markAllRead() {
    try {
      await axios.patch(`${API_BASE}/notifications/read-all`, {}, authConfig());
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    } catch {
      setError(t.error);
    }
  }

  async function openNotification(item) {
    if (!item.readAt) {
      try {
        await axios.patch(`${API_BASE}/notifications/${item.id}/read`, {}, authConfig());
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry));
      } catch {
        setError(t.error);
      }
    }
  }

  return (
    <main className="feature-page">
      <h1>{t.title}</h1>
      {error && <p role="alert">{error}</p>}
      {status === 'loading' ? <p>{t.loading}</p> : status === 'error' ? null : items.length === 0 ? (
        <p>{t.empty}</p>
      ) : (
        <>
          <button type="button" onClick={markAllRead}>{t.readAll}</button>
          <ul className="feature-list">
            {items.map((item) => (
              <li key={item.id} className={item.readAt ? '' : 'notification-unread'}>
                <Link to={item.resourceType === 'conversation' ? `/messages/${item.resourceId}` : '/dashboard'} onClick={() => openNotification(item)}>
                  {item.message}
                </Link>
                <time>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</time>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
