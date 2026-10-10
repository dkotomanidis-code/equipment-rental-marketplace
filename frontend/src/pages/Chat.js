import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, authConfig } from '../utils/api';

const LABELS = {
  en: { title: 'Messages', loading: 'Loading messages…', empty: 'No conversations yet.', removed: 'Listing no longer available', message: 'Message', send: 'Send', error: 'Could not load messages.', required: 'Write a message first.' },
  ka: { title: 'შეტყობინებები', loading: 'იტვირთება…', empty: 'საუბრები ჯერ არ არის.', removed: 'განცხადება აღარ არის ხელმისაწვდომი', message: 'შეტყობინება', send: 'გაგზავნა', error: 'შეტყობინებების ჩატვირთვა ვერ მოხერხდა.', required: 'ჯერ დაწერეთ შეტყობინება.' },
  ru: { title: 'Сообщения', loading: 'Загрузка…', empty: 'Пока нет переписок.', removed: 'Объявление больше недоступно', message: 'Сообщение', send: 'Отправить', error: 'Не удалось загрузить сообщения.', required: 'Сначала напишите сообщение.' },
};

export default function Chat({ language = 'en', isLoggedIn }) {
  const { conversationId } = useParams();
  const t = LABELS[language] || LABELS.en;
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [inbox, history] = await Promise.all([
        axios.get(`${API_BASE}/chat/conversations?limit=50`, authConfig()),
        conversationId
          ? axios.get(`${API_BASE}/chat/conversations/${conversationId}/messages?limit=50`, authConfig())
          : Promise.resolve({ data: { items: [] } }),
      ]);
      setConversations(inbox.data.items);
      setMessages(history.data.items);
      if (conversationId) {
        await axios.patch(`${API_BASE}/chat/conversations/${conversationId}/read`, {}, authConfig());
      }
      setError('');
    } catch (err) {
      setError(err.response?.status === 404 ? t.error : t.error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, t.error]);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      setMessages([]);
      setConversations([]);
      return undefined;
    }
    let active = true;
    const update = async () => { if (active) await refresh(); };
    update();
    const timer = conversationId ? window.setInterval(update, 5000) : null;
    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [refresh, conversationId, isLoggedIn]);

  async function send(e) {
    e.preventDefault();
    if (!body.trim()) {
      setError(t.required);
      return;
    }
    try {
      const { data: message } = await axios.post(
        `${API_BASE}/chat/conversations/${conversationId}/messages`,
        { body },
        authConfig()
      );
      setMessages((current) => [...current, message]);
      setBody('');
      setError('');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || t.error);
    }
  }

  let currentUserId;
  try {
    currentUserId = JSON.parse(localStorage.getItem('user') || 'null')?.id;
  } catch {
    currentUserId = null;
  }

  return (
    <main className="feature-page">
      <h1>{t.title}</h1>
      {error && <p role="alert">{error}</p>}
      {loading ? <p>{t.loading}</p> : !isLoggedIn ? (
        <p><Link to="/login">{t.title}</Link></p>
      ) : !conversationId ? (
        conversations.length ? (
          <ul className="feature-list">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <Link to={`/messages/${conversation.id}`}>
                  {conversation.otherUsername} · {conversation.equipmentName || t.removed}
                  {conversation.unreadCount > 0 ? ` (${conversation.unreadCount})` : ''}
                </Link>
                <p>{conversation.lastMessage || ''}</p>
              </li>
            ))}
          </ul>
        ) : <p>{t.empty}</p>
      ) : (
        <section aria-label={t.title}>
          <ol className="message-list">
            {messages.map((message) => (
              <li key={message.id} className={message.senderId === Number(currentUserId) ? 'message-own' : ''}>
                <strong>{message.senderUsername || ''}</strong>
                <p>{message.body}</p>
                <time>{message.createdAt ? new Date(message.createdAt).toLocaleString() : ''}</time>
              </li>
            ))}
          </ol>
          <form onSubmit={send}>
            <label htmlFor="chat-message">{t.message}</label>
            <textarea id="chat-message" value={body} maxLength={2000} onChange={(event) => setBody(event.target.value)} required />
            <button type="submit">{t.send}</button>
          </form>
        </section>
      )}
    </main>
  );
}
