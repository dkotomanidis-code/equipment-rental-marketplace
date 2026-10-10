import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, authConfig } from '../utils/api';

const LABELS = {
  en: { messages: 'Messages', notifications: 'Notifications' },
  ka: { messages: 'შეტყობინებები', notifications: 'გაფრთხილებები' },
  ru: { messages: 'Сообщения', notifications: 'Уведомления' },
};

export default function ActivityBadges({ language, isLoggedIn }) {
  const [unread, setUnread] = useState({ messages: 0, notifications: 0 });
  useEffect(() => {
    let active = true;
    let timer;
    async function refresh() {
      if (!isLoggedIn) {
        setUnread({ messages: 0, notifications: 0 });
        return;
      }
      try {
        const [messages, notifications] = await Promise.all([
          axios.get(`${API_BASE}/chat/unread-count`, authConfig()),
          axios.get(`${API_BASE}/notifications/unread-count`, authConfig()),
        ]);
        if (active) {
          setUnread({
            messages: messages.data.unreadCount || 0,
            notifications: notifications.data.unreadCount || 0,
          });
        }
      } catch {
        if (active) setUnread({ messages: 0, notifications: 0 });
      }
    }
    refresh();
    if (isLoggedIn) timer = window.setInterval(refresh, 30000);
    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;
  const t = LABELS[language] || LABELS.en;
  return (
    <>
      <li className="nav-item">
        <Link to="/messages" className="nav-link">
          {t.messages}{unread.messages > 0 ? ` (${unread.messages})` : ''}
        </Link>
      </li>
      <li className="nav-item">
        <Link to="/notifications" className="nav-link" aria-label={`${t.notifications}: ${unread.notifications}`}>
          {t.notifications}{unread.notifications > 0 ? ` (${unread.notifications})` : ''}
        </Link>
      </li>
    </>
  );
}
