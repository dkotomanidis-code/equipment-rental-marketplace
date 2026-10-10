import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, authConfig } from '../utils/api';
import '../styles/Features.css';

const LABELS = {
  en: { title: 'Your wishlist', loading: 'Loading wishlist…', empty: 'Your wishlist is empty.', browse: 'Browse equipment', remove: 'Remove', previous: 'Previous', next: 'Next', error: 'Could not load your wishlist.' },
  ka: { title: 'თქვენი სურვილების სია', loading: 'იტვირთება…', empty: 'სურვილების სია ცარიელია.', browse: 'ტექნიკის დათვალიერება', remove: 'ამოშლა', previous: 'წინა', next: 'შემდეგი', error: 'სურვილების სიის ჩატვირთვა ვერ მოხერხდა.' },
  ru: { title: 'Избранное', loading: 'Загрузка…', empty: 'Список избранного пуст.', browse: 'Каталог техники', remove: 'Удалить', previous: 'Назад', next: 'Далее', error: 'Не удалось загрузить избранное.' },
};

export default function Wishlist({ language = 'en' }) {
  const t = LABELS[language] || LABELS.en;
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setStatus('loading');
    axios.get(`${API_BASE}/favorites?page=${page}&limit=20`, authConfig())
      .then(({ data: result }) => {
        if (active) {
          setData(result);
          setStatus('ready');
        }
      })
      .catch(() => { if (active) { setError(t.error); setStatus('error'); } });
    return () => { active = false; };
  }, [page, t.error]);

  async function remove(equipmentId) {
    try {
      await axios.delete(`${API_BASE}/favorites/${equipmentId}`, authConfig());
      setData((current) => ({
        ...current,
        items: current.items.filter((item) => item.id !== equipmentId),
        total: Math.max(0, current.total - 1),
      }));
    } catch {
      setError(t.error);
    }
  }

  if (status === 'loading') return <main className="feature-page"><p>{t.loading}</p></main>;
  return (
    <main className="feature-page">
      <h1>{t.title}</h1>
      {error && <p role="alert">{error}</p>}
      {status === 'error' ? null : data.items.length === 0 ? (
        <p>{t.empty} <Link to="/equipment">{t.browse}</Link></p>
      ) : (
        <>
          <ul className="feature-list">
            {data.items.map((item) => (
              <li key={item.id}>
                <Link to={`/equipment/${item.id}`}>{item.name}</Link>
                <span> · {item.location || ''} · {item.pricePerDay == null ? '' : `$${item.pricePerDay}/day`}</span>
                <button type="button" onClick={() => remove(item.id)}>{t.remove}</button>
              </li>
            ))}
          </ul>
          <nav className="feature-pagination" aria-label={t.title}>
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{t.previous}</button>
            <span>{page} / {Math.max(1, Math.ceil(data.total / 20))}</span>
            <button type="button" disabled={page * 20 >= data.total} onClick={() => setPage((value) => value + 1)}>{t.next}</button>
          </nav>
        </>
      )}
    </main>
  );
}
