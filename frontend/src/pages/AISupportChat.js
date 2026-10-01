import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function AISupportChat({ language }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [showTickets, setShowTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const messagesEndRef = useRef(null);

  const translations = {
    en: {
      aiSupport: '🤖 AI Support 24/7',
      typeMessage: 'Type your question or issue...',
      send: 'Send',
      myTickets: 'My Tickets',
      supportChat: 'Support Chat',
      noMessages: 'No messages yet. Start a conversation!',
      codeIssueDetected: '⚠️ Code Issue Detected!',
      fixSuggested: 'Fix Suggested',
      applyFix: 'Apply Fix',
      dismiss: 'Dismiss',
      loading: 'AI is thinking...',
      errorSending: 'Error sending message',
      ticketId: 'Ticket ID',
      status: 'Status',
      created: 'Created',
      language: 'Language',
      noTickets: 'No support tickets yet',
      backToChat: '← Back to Chat',
    },
    ka: {
      aiSupport: '🤖 AI დახმარება 24/7',
      typeMessage: 'დაწერეთ თქვენი კითხვა ან პრობლემა...',
      send: 'გაგზავნა',
      myTickets: 'ჩემი ბილეთები',
      supportChat: 'დახმარების ჩატი',
      noMessages: 'ჯერ არ არის შეტყობინებები. დაიწყეთ საუბარი!',
      codeIssueDetected: '⚠️ კოდის პრობლემა აღმოჩენილია!',
      fixSuggested: 'ფიქსი შემოთავაზებული',
      applyFix: 'ფიქსის გამოყენება',
      dismiss: 'დახურვა',
      loading: 'AI აფიქრდება...',
      errorSending: 'შეცდომა შეტყობინების გაგზავნისას',
      ticketId: 'ბილეთის ID',
      status: 'სტატუსი',
      created: 'შეიქმნა',
      language: 'ენა',
      noTickets: 'ჯერ დახმარების ბილეთი არ არის',
      backToChat: '← დაბრუნება ჩატში',
    },
    ru: {
      aiSupport: '🤖 AI Поддержка 24/7',
      typeMessage: 'Напишите свой вопрос или проблему...',
      send: 'Отправить',
      myTickets: 'Мои билеты',
      supportChat: 'Чат поддержки',
      noMessages: 'Нет сообщений. Начните беседу!',
      codeIssueDetected: '⚠️ Обнаружена проблема в коде!',
      fixSuggested: 'Предложено исправление',
      applyFix: 'Применить исправление',
      dismiss: 'Отклонить',
      loading: 'AI размышляет...',
      errorSending: 'Ошибка отправки сообщения',
      ticketId: 'ID билета',
      status: 'Статус',
      created: 'Создано',
      language: 'Язык',
      noTickets: 'Нет билетов поддержки',
      backToChat: '← Вернуться в чат',
    },
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchTickets();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/ai-support/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(res.data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    // Add user message to chat
    setMessages([...messages, {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }]);

    setInputMessage('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ai-support/chat`,
        { message: inputMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add AI response
      setMessages(prev => [...prev, {
        type: 'ai',
        content: res.data.aiResponse,
        hasCodeIssue: res.data.hasCodeIssue,
        codeFixResult: res.data.codeFixResult,
        ticketId: res.data.ticketId,
        timestamp: new Date()
      }]);

      // Refresh tickets
      fetchTickets();
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'error',
        content: t.errorSending,
        timestamp: new Date()
      }]);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showTickets && !selectedTicket) {
    return (
      <div className="ai-support-container">
        <div className="support-header">
          <h1>{t.myTickets}</h1>
          <button onClick={() => setShowTickets(false)} className="btn-back">
            {t.backToChat}
          </button>
        </div>

        <div className="tickets-list">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`ticket-card status-${ticket.status}`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="ticket-header">
                  <strong>#{ticket.id}</strong>
                  <span className={`status-badge ${ticket.status}`}>{ticket.status}</span>
                </div>
                <p className="ticket-message">{ticket.userMessage.substring(0, 100)}...</p>
                <div className="ticket-meta">
                  <span>🌐 {ticket.language.toUpperCase()}</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="no-tickets">{t.noTickets}</p>
          )}
        </div>

        <style jsx>{`
          .ai-support-container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 2rem;
            background: #f5f5f5;
            min-height: 100vh;
          }

          .support-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .btn-back {
            padding: 0.5rem 1rem;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
          }

          .btn-back:hover {
            background: #5568d3;
          }

          .tickets-list {
            display: grid;
            gap: 1rem;
          }

          .ticket-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            border-left: 4px solid #ddd;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .ticket-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .ticket-card.status-resolved {
            border-left-color: #4caf50;
          }

          .ticket-card.status-needs_review {
            border-left-color: #ff9800;
          }

          .ticket-card.status-fix_applied {
            border-left-color: #2196f3;
          }

          .ticket-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
          }

          .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 999px;
            font-size: 0.8rem;
            font-weight: bold;
            color: white;
          }

          .status-badge.resolved {
            background: #4caf50;
          }

          .status-badge.needs_review {
            background: #ff9800;
          }

          .status-badge.fix_applied {
            background: #2196f3;
          }

          .ticket-message {
            color: #666;
            margin: 0.5rem 0;
            font-size: 0.95rem;
          }

          .ticket-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.85rem;
            color: #999;
          }

          .no-tickets {
            text-align: center;
            color: #999;
            padding: 2rem;
            background: white;
            border-radius: 8px;
          }
        `}</style>
      </div>
    );
  }

  if (selectedTicket) {
    return (
      <div className="ai-support-container">
        <div className="support-header">
          <button onClick={() => setSelectedTicket(null)} className="btn-back">
            {t.backToChat}
          </button>
          <h2>Ticket #{selectedTicket.id}</h2>
        </div>

        <div className="ticket-details">
          <div className="detail-section">
            <h3>{t.status}</h3>
            <p className={`status-text status-${selectedTicket.status}`}>{selectedTicket.status}</p>
          </div>

          <div className="detail-section">
            <h3>{t.language}</h3>
            <p>{selectedTicket.language.toUpperCase()}</p>
          </div>

          <div className="detail-section">
            <h3>{t.created}</h3>
            <p>{new Date(selectedTicket.createdAt).toLocaleString()}</p>
          </div>

          <div className="detail-section">
            <h3>User Message</h3>
            <p className="message-box">{selectedTicket.userMessage}</p>
          </div>

          <div className="detail-section">
            <h3>AI Response</h3>
            <p className="message-box">{selectedTicket.aiResponse}</p>
          </div>

          {selectedTicket.hasCodeIssue && selectedTicket.codeFixResult && (
            <div className="detail-section code-issue">
              <h3>{t.codeIssueDetected}</h3>
              <p><strong>Issue Type:</strong> {selectedTicket.codeFixResult.issueType}</p>
              <p><strong>Explanation:</strong> {selectedTicket.codeFixResult.explanation}</p>
              {selectedTicket.codeFixResult.fixedCode && (
                <div className="code-block">
                  <pre>{selectedTicket.codeFixResult.fixedCode}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        <style jsx>{`
          .ticket-details {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            max-width: 900px;
            margin: 0 auto;
          }

          .detail-section {
            margin-bottom: 1.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid #eee;
          }

          .detail-section:last-child {
            border-bottom: none;
          }

          .detail-section h3 {
            color: #667eea;
            margin-bottom: 0.5rem;
          }

          .detail-section p {
            color: #666;
            margin: 0;
            line-height: 1.6;
          }

          .message-box {
            background: #f9f9f9;
            padding: 1rem;
            border-radius: 4px;
            border-left: 4px solid #667eea;
          }

          .status-text {
            font-weight: bold;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            display: inline-block;
            color: white;
          }

          .status-text.status-resolved {
            background: #4caf50;
          }

          .status-text.status-needs_review {
            background: #ff9800;
          }

          .status-text.status-fix_applied {
            background: #2196f3;
          }

          .code-issue {
            background: #fff3cd;
            padding: 1rem;
            border-radius: 4px;
            border-left: 4px solid #ff9800;
          }

          .code-block {
            background: #f4f4f4;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
            margin-top: 0.5rem;
          }

          .code-block pre {
            margin: 0;
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
            line-height: 1.4;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="ai-support-container">
      <div className="chat-window">
        <div className="chat-header">
          <h1>{t.aiSupport}</h1>
          <button onClick={() => setShowTickets(true)} className="btn-tickets">
            {t.myTickets} ({tickets.length})
          </button>
        </div>

        <div className="messages-container">
          {messages.length === 0 ? (
            <p className="no-messages">{t.noMessages}</p>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`message message-${msg.type}`}>
                <div className="message-content">
                  <p>{msg.content}</p>

                  {msg.hasCodeIssue && msg.codeFixResult && (
                    <div className="code-fix-alert">
                      <strong>{t.codeIssueDetected}</strong>
                      <p>{msg.codeFixResult.explanation}</p>
                      {msg.codeFixResult.fixedCode && (
                        <div className="code-snippet">
                          <pre>{msg.codeFixResult.fixedCode.substring(0, 200)}...</pre>
                        </div>
                      )}
                      <button className="btn-apply-fix">{t.applyFix}</button>
                    </div>
                  )}

                  <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="message message-ai loading">
              <div className="message-content">
                <p>{t.loading}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={t.typeMessage}
            disabled={loading}
            className="message-input"
          />
          <button type="submit" disabled={loading} className="btn-send">
            {t.send}
          </button>
        </form>
      </div>

      <style jsx>{`
        .ai-support-container {
          display: flex;
          height: 100vh;
          background: #f5f5f5;
        }

        .chat-window {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-bottom: 2px solid #667eea;
        }

        .chat-header h1 {
          margin: 0;
          font-size: 1.5rem;
        }

        .btn-tickets {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid white;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .btn-tickets:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .no-messages {
          text-align: center;
          color: #999;
          margin: auto;
          font-size: 1.1rem;
        }

        .message {
          display: flex;
          margin-bottom: 1rem;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-user {
          justify-content: flex-end;
        }

        .message-ai,
        .message-error {
          justify-content: flex-start;
        }

        .message-content {
          max-width: 70%;
          padding: 1rem;
          border-radius: 8px;
          word-wrap: break-word;
        }

        .message-user .message-content {
          background: #667eea;
          color: white;
        }

        .message-ai .message-content {
          background: #f0f0f0;
          color: #333;
        }

        .message-error .message-content {
          background: #ffebee;
          color: #c62828;
        }

        .message-content p {
          margin: 0 0 0.5rem 0;
        }

        .message-content small {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .code-fix-alert {
          background: #fff3cd;
          padding: 1rem;
          border-radius: 4px;
          margin-top: 0.5rem;
          border-left: 4px solid #ff9800;
        }

        .code-fix-alert strong {
          display: block;
          margin-bottom: 0.5rem;
          color: #856404;
        }

        .code-fix-alert p {
          margin: 0.5rem 0;
          font-size: 0.9rem;
          color: #856404;
        }

        .code-snippet {
          background: #f4f4f4;
          padding: 0.5rem;
          border-radius: 4px;
          margin: 0.5rem 0;
          overflow-x: auto;
        }

        .code-snippet pre {
          margin: 0;
          font-family: 'Courier New', monospace;
          font-size: 0.8rem;
          line-height: 1.3;
        }

        .btn-apply-fix {
          padding: 0.5rem 1rem;
          background: #ff9800;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          margin-top: 0.5rem;
          transition: all 0.3s ease;
        }

        .btn-apply-fix:hover {
          background: #e68900;
        }

        .loading .message-content {
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .message-form {
          display: flex;
          gap: 0.5rem;
          padding: 1.5rem;
          background: #f9f9f9;
          border-top: 1px solid #ddd;
        }

        .message-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          font-family: inherit;
        }

        .message-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .message-input:disabled {
          background: #eee;
          cursor: not-allowed;
        }

        .btn-send {
          padding: 0.75rem 1.5rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .btn-send:hover:not(:disabled) {
          background: #5568d3;
        }

        .btn-send:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .chat-window {
            max-width: 100%;
            height: 100%;
            border-radius: 0;
          }

          .message-content {
            max-width: 90%;
          }

          .chat-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}