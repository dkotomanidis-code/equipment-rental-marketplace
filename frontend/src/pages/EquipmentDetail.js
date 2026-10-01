import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Reviews from './Reviews';

function EquipmentDetail({ language }) {
  const { id } = useParams();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messagingLoading, setMessagingLoading] = useState(false);
  const navigate = useNavigate();

  const translations = {
    en: {
      loading: 'Loading...',
      notFound: 'Equipment not found',
      manufacturer: 'Manufacturer',
      model: 'Model',
      year: 'Year',
      condition: 'Condition',
      features: 'Features',
      location: 'Location',
      bookNow: 'Book Now',
      goBack: 'Back to Browse',
      messageSeller: 'Message Seller',
      startChat: 'Start Chat',
      loginToMessage: 'Please login to message the seller',
      error: 'Error starting conversation',
    },
    ka: {
      loading: 'იტვირთება...',
      notFound: 'აღჭურვილობა ნაპოვნი არ არის',
      manufacturer: 'მწარმოებელი',
      model: 'მოდელი',
      year: 'წელი',
      condition: 'მდგომარეობა',
      features: 'ფიჩარები',
      location: 'ადგილი',
      bookNow: 'დაჯავშვა',
      goBack: 'ნახვაზე დაბრუნება',
      messageSeller: 'გამყიდველის შეტყობინება',
      startChat: 'ჩატის დაწყება',
      loginToMessage: 'გთხოვთ შედით, რომ გამყიდველს შეტყობინება გაუგზავნოთ',
      error: 'კონვერსაციის დაწყებაში შეცდომა',
    },
    ru: {
      loading: 'Загрузка...',
      notFound: 'Оборудование не найдено',
      manufacturer: 'Производитель',
      model: 'Модель',
      year: 'Год',
      condition: 'Состояние',
      features: 'Характеристики',
      location: 'Местоположение',
      bookNow: 'Забронировать',
      goBack: 'Вернуться к просмотру',
      messageSeller: 'Сообщение продавцу',
      startChat: 'Начать чат',
      loginToMessage: 'Пожалуйста, войдите, чтобы написать продавцу',
      error: 'Ошибка при начале разговора',
    },
  };

  const t = translations[language] || translations['en'];

  useEffect(() => {
    fetchEquipment();
  }, [id]);

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/equipment/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEquipment(response.data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageSeller = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert(t.loginToMessage);
      navigate('/login');
      return;
    }

    setMessagingLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/messages/conversations/start',
        { recipientId: equipment.ownerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(`/messages/${response.data.conversationId}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert(t.error);
    } finally {
      setMessagingLoading(false);
    }
  };

  if (loading) {
    return <div className="equipment-detail-page">{t.loading}</div>;
  }

  if (!equipment) {
    return <div className="equipment-detail-page">{t.notFound}</div>;
  }

  return (
    <div className="equipment-detail-page">
      <Link to="/equipment" className="back-link">← {t.goBack}</Link>

      <div className="equipment-detail-container">
        <div className="detail-image">
          <img src={equipment.imageUrl || 'https://via.placeholder.com/500'} alt={equipment.name} />
        </div>

        <div className="detail-content">
          <h1>{equipment.name}</h1>
          <p className="category-badge">{equipment.category}</p>

          <div className="spec-grid">
            {equipment.manufacturer && (
              <div className="spec-item">
                <strong>{t.manufacturer}:</strong> {equipment.manufacturer}
              </div>
            )}
            {equipment.model && (
              <div className="spec-item">
                <strong>{t.model}:</strong> {equipment.model}
              </div>
            )}
            {equipment.year && (
              <div className="spec-item">
                <strong>{t.year}:</strong> {equipment.year}
              </div>
            )}
            {equipment.condition && (
              <div className="spec-item">
                <strong>{t.condition}:</strong> {equipment.condition}
              </div>
            )}
            {equipment.location && (
              <div className="spec-item">
                <strong>{t.location}:</strong> 📍 {equipment.location}
              </div>
            )}
          </div>

          <div className="description">
            <h3>Description</h3>
            <p>{equipment.description}</p>
          </div>

          {equipment.features && (
            <div className="features">
              <h3>{t.features}</h3>
              <p>{equipment.features}</p>
            </div>
          )}

          <div className="price-booking">
            <div className="price">${equipment.pricePerDay} / day</div>
            <div className="action-buttons">
              <Link to={`/booking/${equipment.id}`} className="btn btn-primary btn-book">
                {t.bookNow}
              </Link>
              <button 
                onClick={handleMessageSeller}
                disabled={messagingLoading}
                className="btn btn-secondary btn-message"
              >
                💬 {messagingLoading ? t.startChat : t.messageSeller}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Component */}
      <Reviews equipmentId={equipment.id} language={language} />

      <style jsx>{`
        .equipment-detail-page {
          padding: 2rem;
          background-color: #f5f5f5;
          min-height: 100vh;
        }

        .back-link {
          display: inline-block;
          margin-bottom: 1rem;
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .equipment-detail-container {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          padding: 2rem;
        }

        .detail-image img {
          width: 100%;
          height: auto;
          border-radius: 8px;
          object-fit: cover;
        }

        .detail-content {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }

        .detail-content h1 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 2rem;
        }

        .category-badge {
          display: inline-block;
          background-color: #667eea;
          color: white;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 1rem;
          width: fit-content;
        }

        .spec-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background: #f9f9f9;
          border-radius: 6px;
        }

        .spec-item {
          color: #666;
          font-size: 0.95rem;
        }

        .spec-item strong {
          color: #333;
        }

        .description,
        .features {
          margin-bottom: 2rem;
        }

        .description h3,
        .features h3 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .description p,
        .features p {
          margin: 0;
          color: #666;
          line-height: 1.6;
        }

        .price-booking {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: #f9f9f9;
          border-radius: 6px;
          margin-top: auto;
        }

        .price {
          font-size: 1.8rem;
          font-weight: bold;
          color: #667eea;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          text-decoration: none;
          display: inline-block;
        }

        .btn-primary {
          background-color: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background-color: #5568d3;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #5a6268;
        }

        .btn-secondary:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .btn-book,
        .btn-message {
          padding: 0.75rem 1.25rem;
          font-size: 0.95rem;
        }

        @media (max-width: 768px) {
          .equipment-detail-container {
            grid-template-columns: 1fr;
            padding: 1rem;
          }

          .detail-content h1 {
            font-size: 1.5rem;
          }

          .spec-grid {
            grid-template-columns: 1fr;
          }

          .price-booking {
            flex-direction: column;
            gap: 1rem;
          }

          .action-buttons {
            flex-direction: column;
            width: 100%;
          }

          .btn-book,
          .btn-message {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

export default EquipmentDetail;