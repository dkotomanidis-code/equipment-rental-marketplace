import React, { useState } from 'react';
import axios from 'axios';

function TaxTermsModal({ equipmentId, onAccept, onDecline, language }) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const translations = {
    en: {
      taxTerms: 'Platform Tax Terms & Conditions',
      taxRate: '0.5% Platform Tax',
      description: 'A 0.5% platform tax is applied to all equipment rentals.',
      termsTitle: 'You agree to the following:',
      term1: '0.5% tax is calculated on the rental subtotal',
      term2: 'Tax is collected at the time of booking payment',
      term3: 'Tax is shown separately in the payment breakdown',
      term4: 'You understand this tax helps maintain platform services',
      term5: 'The tax is non-refundable',
      term6: 'By accepting, you cannot dispute this tax later',
      checkboxLabel: 'I understand and accept the 0.5% platform tax on all rentals',
      accept: 'Accept Terms & List Equipment',
      decline: 'Decline Terms',
      accepting: 'Accepting...',
      declining: 'Declining...',
      error: 'Error processing your request',
    },
    ka: {
      taxTerms: 'პლატფორმის ტაქსის პირობები',
      taxRate: '0.5% პლატფორმის ტაქსი',
      description: 'ყველა აღჭურვილობის ქირაობაზე გამოიყენება 0.5% პლატფორმის ტაქსი.',
      termsTitle: 'თქვენ ეთანხმებით შემდეგს:',
      term1: '0.5% ტაქსი გამოითვლება ქირაობის ქვე-სულიდან',
      term2: 'ტაქსი ენიჭება დაჯავშვის გადახდის დროს',
      term3: 'ტაქსი ცალკე ჩვენება გადახდის დაშლაში',
      term4: 'თქვენ გესმით, რომ ეს ტაქსი ხელმძღვანელობს პლატფორმის სერვისებს',
      term5: 'ტაქსი უბრუნებელია',
      term6: 'ეთანხმებით, თქვენ არ შეგიძლიათ დაეჭვება ამ ტაქსზე',
      checkboxLabel: 'მე ვიცი და ვეთანხმები 0.5% პლატფორმის ტაქსზე ყველა ქირაობაზე',
      accept: 'პირობების მიღება და აღჭურვილობის გამოთვლა',
      decline: 'პირობების უარყოფა',
      accepting: 'მიღება...',
      declining: 'უარყოფა...',
      error: 'შეცდომა თქვენი მოთხოვნის დამუშავებისას',
    },
    ru: {
      taxTerms: 'Условия налога платформы',
      taxRate: '0.5% Налог платформы',
      description: 'К аренде всего оборудования применяется 0.5% налог платформы.',
      termsTitle: 'Вы согласны со следующим:',
      term1: '0.5% налог рассчитывается на сумму аренды',
      term2: 'Налог взимается во время оплаты бронирования',
      term3: 'Налог показывается отдельно в разбивке платежа',
      term4: 'Вы понимаете, что этот налог помогает поддерживать услуги платформы',
      term5: 'Налог невозвратен',
      term6: 'Приняв это, вы не можете оспаривать этот налог',
      checkboxLabel: 'Я понимаю и принимаю 0.5% налог платформы на все аренды',
      accept: 'Принять условия и список оборудования',
      decline: 'Отклонить условия',
      accepting: 'Принимается...',
      declining: 'Отклонение...',
      error: 'Ошибка при обработке вашего запроса',
    },
  };

  const t = translations[language] || translations.en;

  const handleAccept = async () => {
    if (!accepted) {
      setError('Please check the box to accept the terms');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/tax/accept-terms',
        { equipmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setError('');
      if (onAccept) onAccept();
    } catch (err) {
      setError(err.response?.data?.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/tax/decline-terms',
        { equipmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setError('');
      if (onDecline) onDecline();
    } catch (err) {
      setError(err.response?.data?.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tax-modal-overlay">
      <div className="tax-modal">
        <div className="modal-header">
          <h2>{t.taxTerms}</h2>
          <div className="tax-badge">{t.taxRate}</div>
        </div>

        <div className="modal-content">
          <p className="description">{t.description}</p>

          <div className="terms-section">
            <h3>{t.termsTitle}</h3>
            <ul className="terms-list">
              <li>✓ {t.term1}</li>
              <li>✓ {t.term2}</li>
              <li>✓ {t.term3}</li>
              <li>✓ {t.term4}</li>
              <li>✓ {t.term5}</li>
              <li>✓ {t.term6}</li>
            </ul>
          </div>

          <div className="checkbox-section">
            <label>
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => {
                  setAccepted(e.target.checked);
                  setError('');
                }}
              />
              {t.checkboxLabel}
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-buttons">
            <button
              className="btn btn-accept"
              onClick={handleAccept}
              disabled={loading || !accepted}
            >
              ✓ {loading ? t.accepting : t.accept}
            </button>
            <button
              className="btn btn-decline"
              onClick={handleDecline}
              disabled={loading}
            >
              ✗ {loading ? t.declining : t.decline}
            </button>
          </div>

          <p className="legal-notice">
            By clicking "Accept Terms", you are entering into a legal agreement. This action cannot be undone and you accept full responsibility for the 0.5% platform tax on all future rentals of this equipment.
          </p>
        </div>
      </div>

      <style jsx>{`
        .tax-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .tax-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          overflow-y: auto;
          max-height: 90vh;
        }

        .modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .tax-badge {
          background-color: rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .modal-content {
          padding: 2rem;
        }

        .description {
          color: #666;
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .terms-section {
          background-color: #f9f9f9;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border-left: 4px solid #667eea;
        }

        .terms-section h3 {
          margin: 0 0 1rem 0;
          color: #333;
        }

        .terms-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .terms-list li {
          margin-bottom: 0.75rem;
          color: #666;
          line-height: 1.6;
          padding-left: 1rem;
        }

        .checkbox-section {
          background-color: #fff3cd;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border: 2px solid #ffc107;
        }

        .checkbox-section label {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          cursor: pointer;
          color: #856404;
          font-weight: 600;
          line-height: 1.5;
        }

        .checkbox-section input {
          width: 24px;
          height: 24px;
          margin-top: 2px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          border: 1px solid #f5c6cb;
        }

        .modal-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .btn {
          flex: 1;
          padding: 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-accept {
          background-color: #28a745;
          color: white;
        }

        .btn-accept:hover:not(:disabled) {
          background-color: #218838;
          transform: translateY(-2px);
        }

        .btn-accept:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .btn-decline {
          background-color: #dc3545;
          color: white;
        }

        .btn-decline:hover:not(:disabled) {
          background-color: #c82333;
          transform: translateY(-2px);
        }

        .btn-decline:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .legal-notice {
          text-align: center;
          font-size: 0.85rem;
          color: #999;
          margin: 0;
          font-style: italic;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }

        @media (max-width: 600px) {
          .modal-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .modal-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default TaxTermsModal;