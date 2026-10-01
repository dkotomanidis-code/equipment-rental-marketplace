import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AgreementHistory({ language }) {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const translations = {
    en: {
      title: 'Rental Agreement History',
      noAgreements: 'No signed agreements yet',
      equipment: 'Equipment',
      rentalPeriod: 'Rental Period',
      totalPrice: 'Total Price',
      signedDate: 'Signed Date',
      owner: 'Owner',
      view: 'View Agreement',
      download: 'Download PDF',
      loading: 'Loading...',
      error: 'Error loading agreements',
    },
    ka: {
      title: 'ქირაობის შეთანხმების ისტორია',
      noAgreements: 'ხელმოწერილი შეთანხმება ჯერ არ არის',
      equipment: 'აღჭურვილობა',
      rentalPeriod: 'ქირაობის პერიოდი',
      totalPrice: 'სულ ფასი',
      signedDate: 'ხელმოწერილი თარიღი',
      owner: 'მფლობელი',
      view: 'შეთანხმების ნახვა',
      download: 'PDF-ის ჩამოტვირთვა',
      loading: 'იტვირთება...',
      error: 'შეთანხმებების ჩატვირთვის შეცდომა',
    },
    ru: {
      title: 'История договоров аренды',
      noAgreements: 'Подписанные договоры еще не имеются',
      equipment: 'Оборудование',
      rentalPeriod: 'Период аренды',
      totalPrice: 'Общая сумма',
      signedDate: 'Дата подписания',
      owner: 'Владелец',
      view: 'Просмотреть договор',
      download: 'Скачать PDF',
      loading: 'Загрузка...',
      error: 'Ошибка при загрузке договоров',
    },
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/agreements/history',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAgreements(response.data);
    } catch (err) {
      setError(t.error);
      console.error('Error fetching agreements:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="agreement-history-page">{t.loading}</div>;
  }

  return (
    <div className="agreement-history-page">
      <div className="history-container">
        <h1>{t.title}</h1>

        {agreements.length === 0 ? (
          <p className="no-agreements">{t.noAgreements}</p>
        ) : (
          <div className="agreements-table">
            <table>
              <thead>
                <tr>
                  <th>{t.equipment}</th>
                  <th>{t.owner}</th>
                  <th>{t.rentalPeriod}</th>
                  <th>{t.totalPrice}</th>
                  <th>{t.signedDate}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agreements.map((agreement) => (
                  <tr key={agreement.id}>
                    <td>
                      <div className="equipment-cell">
                        {agreement.image_url && (
                          <img src={agreement.image_url} alt={agreement.equipment_name} />
                        )}
                        <span>{agreement.equipment_name}</span>
                      </div>
                    </td>
                    <td>{agreement.first_name} {agreement.last_name}</td>
                    <td>{agreement.start_date} to {agreement.end_date}</td>
                    <td>${agreement.total_price}</td>
                    <td>{new Date(agreement.signed_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-small">{t.view}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>

      <style jsx>{`
        .agreement-history-page {
          padding: 2rem;
          background-color: #f5f5f5;
          min-height: 100vh;
        }

        .history-container {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        h1 {
          color: #333;
          margin-bottom: 2rem;
        }

        .no-agreements {
          text-align: center;
          color: #999;
          padding: 2rem;
          font-size: 1.1rem;
        }

        .agreements-table {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead {
          background-color: #f9f9f9;
        }

        th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #ddd;
        }

        td {
          padding: 1rem;
          border-bottom: 1px solid #eee;
          color: #666;
        }

        .equipment-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .equipment-cell img {
          width: 50px;
          height: 50px;
          border-radius: 4px;
          object-fit: cover;
        }

        .btn-small {
          padding: 0.5rem 1rem;
          background-color: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .btn-small:hover {
          background-color: #5568d3;
        }

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 1rem;
          border-radius: 4px;
          margin-top: 1rem;
          border: 1px solid #f5c6cb;
        }

        @media (max-width: 768px) {
          table {
            font-size: 0.9rem;
          }

          th, td {
            padding: 0.75rem;
          }

          .equipment-cell img {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
}

export default AgreementHistory;