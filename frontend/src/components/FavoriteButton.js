import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, authConfig } from '../utils/api';

const LABELS = {
  en: { add: 'Add to wishlist', remove: 'Remove from wishlist', login: 'Sign in to save', error: 'Could not update wishlist' },
  ka: { add: 'სურვილების სიაში დამატება', remove: 'სურვილების სიიდან ამოშლა', login: 'შედით შესანახად', error: 'სურვილების სიის განახლება ვერ მოხერხდა' },
  ru: { add: 'Добавить в избранное', remove: 'Удалить из избранного', login: 'Войдите, чтобы сохранить', error: 'Не удалось обновить избранное' },
};

export default function FavoriteButton({ equipmentId, language = 'en' }) {
  const navigate = useNavigate();
  const [favorited, setFavorited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const t = LABELS[language] || LABELS.en;
  const token = localStorage.getItem('token');

  useEffect(() => {
    let active = true;
    if (token) {
      axios.get(`${API_BASE}/favorites/${equipmentId}`, authConfig())
        .then(({ data }) => { if (active) setFavorited(data.favorited); })
        .catch(() => { if (active) setError(t.error); });
    } else {
      setFavorited(false);
    }
    return () => { active = false; };
  }, [equipmentId, token, t.error]);

  async function toggle() {
    if (!token) {
      navigate('/login');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (favorited) {
        await axios.delete(`${API_BASE}/favorites/${equipmentId}`, authConfig());
        setFavorited(false);
      } else {
        await axios.post(`${API_BASE}/favorites/${equipmentId}`, {}, authConfig());
        setFavorited(true);
      }
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span>
      <button type="button" onClick={toggle} disabled={busy} aria-pressed={favorited}>
        {favorited ? '♥' : '♡'} {token ? (favorited ? t.remove : t.add) : t.login}
      </button>
      {error && <span role="alert"> {error}</span>}
    </span>
  );
}
