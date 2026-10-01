import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AgreementConfirmation({ language }) {
  const navigate = useNavigate();

  const translations = {
    en: {
      success: 'Agreement Signed Successfully! ✓',
      confirmed: 'Your rental agreement has been confirmed.',
      details: 'A confirmation email with your signed agreement has been sent to your email address.',
      nextSteps: 'Next Steps:',
      step1: 'Wait for the equipment owner to confirm pickup details',
      step2: 'Check your messages for communication from the owner',
      step3: 'Arrange pickup time and location',
      step4: 'Return equipment in the same condition as received',
      dashboard: 'Go to Dashboard',
      browse: 'Browse More Equipment',
    },
    ka: {
      success: 'შეთანხმება წარმატებით ხელმოწერილი! ✓',
      confirmed: 'თქვენი ქირაობის შეთანხმება დადასტურებულია.',
      details: 'დასტურების ელფოსტა თქვენი ხელმოწერილი შეთანხმებით იქნა გამოგზავნილი თქვენი ელფოსტის მისამართზე.',
      nextSteps: 'შემდეგი ნაბიჯები:',
      step1: 'ელოდეთ აღჭურვილობის მფლობელის დასტურებას',
      step2: 'შეამოწმეთ თქვენი შეტყობინებები მფლობელთან კომუნიკაციისთვის',
      step3: 'მოაწყვეთ პიკაპის დრო და ადგილი',
      step4: 'დააბრუნეთ აღჭურვილობა იმავე მდგომარეობით',
      dashboard: 'დაფაზე წადით',
      browse: 'მეტი აღჭურვილობის ნახვა',
    },
    ru: {
      success: 'Соглашение подписано успешно! ✓',
      confirmed: 'Ваше договор аренды подтвержден.',
      details: 'Письмо с подтверждением и подписанным соглашением отправлено на ваш адрес электронной почты.',
      nextSteps: 'Следующие шаги:',
      step1: 'Дождитесь подтверждения владельца оборудования',
      step2: 'Проверьте ваши сообщения для связи с владельцем',
      step3: 'Согласуйте время и место доставки',
      step4: 'Верните оборудование в том же состоянии',
      dashboard: 'Перейти на панель',
      browse: 'Просмотреть больше оборудования',
    },
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        <div className="confirmation-card">
          <div className="success-icon">✓</div>
          
          <h1>{t.success}</h1>
          <p className="confirmed-text">{t.confirmed}</p>
          <p className="details-text">{t.details}</p>

          <div className="next-steps">
            <h3>{t.nextSteps}</h3>
            <ol className="steps-list">
              <li>{t.step1}</li>
              <li>{t.step2}</li>
              <li>{t.step3}</li>
              <li>{t.step4}</li>
            </ol>
          </div>

          <div className="confirmation-buttons">
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/dashboard')}
            >
              📊 {t.dashboard}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/equipment')}
            >
              🛍️ {t.browse}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .confirmation-page {
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .confirmation-container {
          width: 100%;
          max-width: 600px;
        }

        .confirmation-card {
          background: white;
          padding: 3rem;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          text-align: center;
        }

        .success-icon {
          width: 80px;
          height: 80px;
          background-color: #28a745;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          font-size: 3rem;
          color: white;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }

        h1 {
          color: #333;
          margin: 0 0 1rem 0;
          font-size: 1.8rem;
        }

        .confirmed-text {
          color: #666;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .details-text {
          color: #999;
          font-size: 0.95rem;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .next-steps {
          background-color: #f0f4ff;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          text-align: left;
        }

        .next-steps h3 {
          color: #667eea;
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
        }

        .steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .steps-list li {
          color: #666;
          margin-bottom: 0.75rem;
          padding-left: 1.5rem;
          position: relative;
          line-height: 1.5;
        }

        .steps-list li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #28a745;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .confirmation-buttons {
          display: flex;
          gap: 1rem;
          flex-direction: column;
        }

        .btn {
          padding: 1rem 2rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background-color: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background-color: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .btn-secondary {
          background-color: #f0f0f0;
          color: #333;
        }

        .btn-secondary:hover {
          background-color: #e0e0e0;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .confirmation-card {
            padding: 2rem;
          }

          h1 {
            font-size: 1.5rem;
          }

          .confirmation-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default AgreementConfirmation;