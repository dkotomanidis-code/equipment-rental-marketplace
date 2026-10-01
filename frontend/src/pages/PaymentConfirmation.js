import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function PaymentConfirmation({ language }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingId, setBookingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const translations = {
    en: {
      processing: 'Processing payment...',
      redirecting: 'Redirecting to agreement...',
      error: 'Payment processing error',
      success: 'Payment successful!',
    },
    ka: {
      processing: 'გადახდა დამუშავებაში...',
      redirecting: 'შეთანხმებაზე გადამისამართება...',
      error: 'გადახდის დამუშავების შეცდომა',
      success: 'გადახდა წარმატებული!',
    },
    ru: {
      processing: 'Обработка платежа...',
      redirecting: 'Перенаправление на договор...',
      error: 'Ошибка обработки платежа',
      success: 'Платеж выполнен успешно!',
    },
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const bookingIdFromUrl = searchParams.get('bookingId');
    setBookingId(bookingIdFromUrl);

    if (bookingIdFromUrl) {
      // Redirect to rental agreement after 2 seconds
      const timer = setTimeout(() => {
        navigate(`/rental-agreement/${bookingIdFromUrl}`);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  return (
    <div className="payment-confirmation-page">
      <div className="confirmation-container">
        <div className="loader"></div>
        <h2>{t.success}</h2>
        <p>{t.redirecting}</p>
      </div>

      <style jsx>{`
        .payment-confirmation-page {
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .confirmation-container {
          background: white;
          padding: 3rem;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .loader {
          width: 50px;
          height: 50px;
          margin: 0 auto 1rem;
          border: 4px solid #f0f0f0;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        h2 {
          color: #333;
          margin: 0 0 0.5rem 0;
        }

        p {
          color: #999;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

export default PaymentConfirmation;