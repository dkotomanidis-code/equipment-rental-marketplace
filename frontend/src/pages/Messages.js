import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Messages({ language, setLanguage }) {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const messagesEndRef = useRef(null);

  const translations = {
    en: {
      messages: 'Messages',
      noConversations: 'No conversations yet',
      startConversation: 'Start a new conversation',
      newConversation: 'New Message',
      typeMessage: 'Type a message...',
      send: 'Send',
      search: 'Search conversations...',
      searchUsers: 'Search users by name or email...',
      loading: 'Loading...',
      error: 'Error loading messages',
      deleteConversation: 'Delete',
      confirm: 'Are you sure?',
      noMessages: 'No messages yet. Start the conversation!',
      selectUser: 'Select a user to start chatting',
      noUsersFound: 'No users found',
      startChat: 'Start Chat',
      close: 'Close',
    },
    ka: {
      messages: 'შეტყობინებები',
      noConversations: 'კონვერსაცია ჯერ არ არის',
      startConversation: 'ახალი კონვერსაციის დაწყება',
      newConversation: 'ახალი შეტყობინება',
      typeMessage: 'შეტყობინების ტიპი...',
      send: 'გაგზავნა',
      search: 'კონვერსაციის ძებნა...',
      searchUsers: 'ძებნა მომხმარებლებში სახელი ან ელფოსტის მიხედვით...',
      loading: 'იტვირთება...',
      error: 'შეცდომა შეტყობინებების ჩატვირთვისას',
      deleteConversation: 'წაშლა',
      confirm: 'დარწმუნებული ხართ?',
      noMessages: 'შეტყობინება ჯერ არ არის. დაიწყეთ კონვერსაცია!',
      selectUser: 'აირჩიეთ მომხმარებელი ჩატის დაწყებისთვის',
      noUsersFound: 'მომხმარებელი ნაპოვნი არ არის',
      startChat: 'ჩატის დაწყება',
      close: 'დახურვა',
    },
    ru: {
      messages: 'Сообщения',
      noConversations: 'Нет разговоров',
      startConversation: 'Начать новый разговор',
      newConversation: 'Новое сообщение',
      typeMessage: 'Введите сообщение...',
      send: 'Отправить',
      search: 'Поиск разговоров...',
      searchUsers: 'Поиск пользователей по имени или email...',
      loading: 'Загрузка...',
      error: 'Ошибка при загрузке сообщений',
      deleteConversation: 'Удалить',
      confirm: 'Вы уверены?',
      noMessages: 'Нет сообщений. Начните разговор!',
      selectUser: 'Выберите пользователя для начала чата',
      noUsersFound: 'Пользователей не найдено',
      startChat: 'Начать чат',
      close: 'Закрыть',
    },
  };

  const t = translations[language] || translations.en;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      const conversation = conversations.find(c => c.id === conversationId);
      setSelectedConversation(conversation);
      if (conversation) {
        fetchMessages(conversationId);
      }
    }
  }, [conversationId, conversations]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(response.data || []);
      setError('');
    } catch (err) {
      setError(t.error);
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/messages/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data?.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const searchUsersHandler = async (query) => {
    setSearchUsers(query);
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/users/search?q=${query}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(response.data || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setUsers([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleStartConversation = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/messages/conversations/start',
        { recipientId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowNewConversationModal(false);
      setSearchUsers('');
      setUsers([]);
      navigate(`/messages/${response.data.conversationId}`);
      fetchConversations();
    } catch (err) {
      console.error('Error starting conversation:', err);
      alert(t.error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/messages/conversations/${selectedConversation.id}/messages`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage('');
      fetchMessages(selectedConversation.id);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleDeleteConversation = async (convId) => {
    if (!window.confirm(t.confirm)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/messages/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchConversations();
      setSelectedConversation(null);
      setMessages([]);
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="messages-page">{t.loading}</div>;
  }

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* Conversations List */}
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <h2>{t.messages}</h2>
            <button 
              className="new-conversation-btn"
              onClick={() => setShowNewConversationModal(true)}
              title={t.newConversation}
            >
              ✏️ {t.newConversation}
            </button>
          </div>

          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />

          <div className="conversations-list">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedConversation(conv);
                    fetchMessages(conv.id);
                    navigate(`/messages/${conv.id}`);
                  }}
                >
                  <div className="conv-avatar">
                    {conv.otherUser?.firstName?.charAt(0)}{conv.otherUser?.lastName?.charAt(0)}
                  </div>
                  <div className="conv-info">
                    <div className="conv-name">{conv.otherUser?.firstName} {conv.otherUser?.lastName}</div>
                    <div className="conv-preview">{conv.lastMessage?.substring(0, 30)}...</div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <p className="no-conversations">{t.noConversations}</p>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-user-info">
                  <div className="chat-avatar">
                    {selectedConversation.otherUser?.firstName?.charAt(0)}
                    {selectedConversation.otherUser?.lastName?.charAt(0)}
                  </div>
                  <div>
                    <h3>{selectedConversation.otherUser?.firstName} {selectedConversation.otherUser?.lastName}</h3>
                    <p>{selectedConversation.otherUser?.email}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-list">
                {messages.length > 0 ? (
                  messages.map((msg) => (
                    <div key={msg.id} className={`message ${msg.isOwn ? 'own' : 'other'}`}>
                      <div className="message-content">{msg.content}</div>
                      <div className="message-time">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-messages">{t.noMessages}</p>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="message-form">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t.typeMessage}
                  className="message-input"
                />
                <button type="submit" className="send-btn">{t.send}</button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>{t.startConversation}</p>
            </div>
          )}
        </div>

        {/* New Conversation Modal */}
        {showNewConversationModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{t.newConversation}</h3>
                <button 
                  className="close-modal-btn"
                  onClick={() => {
                    setShowNewConversationModal(false);
                    setSearchUsers('');
                    setUsers([]);
                  }}
                >
                  ✕
                </button>
              </div>

              <input
                type="text"
                placeholder={t.searchUsers}
                value={searchUsers}
                onChange={(e) => searchUsersHandler(e.target.value)}
                className="modal-search-input"
                autoFocus
              />

              <div className="users-list">
                {searchingUsers ? (
                  <p className="loading-text">{t.loading}</p>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <div key={user.id} className="user-item">
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="user-name">{user.firstName} {user.lastName}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>
                      <button
                        className="start-chat-btn"
                        onClick={() => handleStartConversation(user.id)}
                      >
                        {t.startChat}
                      </button>
                    </div>
                  ))
                ) : searchUsers ? (
                  <p className="no-results">{t.noUsersFound}</p>
                ) : (
                  <p className="placeholder-text">{t.selectUser}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .messages-page {
          height: calc(100vh - 80px);
          background-color: #f5f5f5;
          overflow: hidden;
        }

        .messages-container {
          display: grid;
          grid-template-columns: 300px 1fr;
          height: 100%;
          gap: 0;
        }

        .conversations-sidebar {
          background: white;
          border-right: 1px solid #eee;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sidebar-header {
          padding: 1rem;
          border-bottom: 2px solid #667eea;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
        }

        .sidebar-header h2 {
          margin: 0;
          color: #333;
          font-size: 1.1rem;
        }

        .new-conversation-btn {
          padding: 0.5rem 0.75rem;
          background-color: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
          white-space: nowrap;
        }

        .new-conversation-btn:hover {
          background-color: #5568d3;
        }

        .search-input {
          padding: 0.75rem 1rem;
          border: none;
          border-bottom: 1px solid #eee;
          font-size: 0.9rem;
        }

        .search-input:focus {
          outline: none;
          background-color: #f9f9f9;
        }

        .conversations-list {
          flex: 1;
          overflow-y: auto;
        }

        .conversation-item {
          padding: 1rem;
          border-bottom: 1px solid #eee;
          cursor: pointer;
          display: grid;
          grid-template-columns: 50px 1fr 30px;
          gap: 0.75rem;
          align-items: center;
          transition: background-color 0.3s;
        }

        .conversation-item:hover {
          background-color: #f9f9f9;
        }

        .conversation-item.active {
          background-color: #e8eeff;
          border-left: 4px solid #667eea;
        }

        .conv-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .conv-info {
          min-width: 0;
        }

        .conv-name {
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
          margin-bottom: 0.25rem;
        }

        .conv-preview {
          color: #999;
          font-size: 0.85rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .delete-btn {
          background: none;
          border: none;
          color: #ccc;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.3s;
        }

        .delete-btn:hover {
          color: #dc3545;
        }

        .no-conversations {
          padding: 2rem 1rem;
          text-align: center;
          color: #999;
        }

        .chat-area {
          background: white;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chat-header {
          padding: 1rem;
          border-bottom: 1px solid #eee;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .chat-user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .chat-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
        }

        .chat-user-info h3 {
          margin: 0;
          color: #333;
          font-size: 1rem;
        }

        .chat-user-info p {
          margin: 0.25rem 0 0 0;
          color: #999;
          font-size: 0.85rem;
        }

        .messages-list {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message {
          display: flex;
          flex-direction: column;
          max-width: 70%;
        }

        .message.own {
          align-self: flex-end;
          align-items: flex-end;
        }

        .message.other {
          align-self: flex-start;
          align-items: flex-start;
        }

        .message-content {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          word-wrap: break-word;
          line-height: 1.4;
        }

        .message.own .message-content {
          background-color: #667eea;
          color: white;
          border-radius: 12px 4px 12px 12px;
        }

        .message.other .message-content {
          background-color: #f0f0f0;
          color: #333;
          border-radius: 4px 12px 12px 12px;
        }

        .message-time {
          font-size: 0.75rem;
          color: #999;
          margin-top: 0.25rem;
          padding: 0 0.5rem;
        }

        .no-messages {
          text-align: center;
          color: #999;
          margin: auto;
        }

        .no-chat-selected {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #999;
          font-size: 1.2rem;
        }

        .message-form {
          padding: 1rem;
          border-top: 1px solid #eee;
          display: flex;
          gap: 0.75rem;
        }

        .message-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #ddd;
          border-radius: 24px;
          font-size: 1rem;
          font-family: inherit;
        }

        .message-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .send-btn {
          padding: 0.75rem 1.5rem;
          background-color: #667eea;
          color: white;
          border: none;
          border-radius: 24px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .send-btn:hover {
          background-color: #5568d3;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          width: 90%;
          max-width: 400px;
          max-height: 70vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .modal-header {
          padding: 1rem;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          color: #333;
        }

        .close-modal-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-modal-btn:hover {
          color: #333;
        }

        .modal-search-input {
          padding: 0.75rem 1rem;
          border: none;
          border-bottom: 1px solid #eee;
          font-size: 0.9rem;
          width: 100%;
        }

        .modal-search-input:focus {
          outline: none;
          background-color: #f9f9f9;
        }

        .users-list {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }

        .user-item {
          padding: 1rem;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .user-item:hover {
          background-color: #f9f9f9;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
          flex: 1;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .user-name {
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
          margin-bottom: 0.25rem;
        }

        .user-email {
          color: #999;
          font-size: 0.85rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .start-chat-btn {
          padding: 0.5rem 1rem;
          background-color: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
          white-space: nowrap;
        }

        .start-chat-btn:hover {
          background-color: #5568d3;
        }

        .loading-text,
        .no-results,
        .placeholder-text {
          padding: 2rem 1rem;
          text-align: center;
          color: #999;
        }

        @media (max-width: 768px) {
          .messages-container {
            grid-template-columns: 1fr;
          }

          .conversations-sidebar {
            display: none;
          }

          .message {
            max-width: 90%;
          }

          .modal-content {
            max-height: 80vh;
          }
        }
      `}</style>
    </div>
  );
}