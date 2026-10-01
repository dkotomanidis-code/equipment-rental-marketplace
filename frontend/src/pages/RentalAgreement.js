import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SignatureCanvas from 'react-signature-canvas';

function RentalAgreement({ language }) {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const signatureRef = React.useRef();

  const translations = {
    en: {
      rentalAgreement: 'Equipment Rental Agreement',
      loading: 'Loading...',
      error: 'Error loading booking details',
      agreementTitle: 'EQUIPMENT RENTAL & SERVICE AGREEMENT',
      date: 'Date',
      renterInfo: 'RENTER INFORMATION',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      equipmentInfo: 'EQUIPMENT INFORMATION',
      equipmentName: 'Equipment Name',
      rentalPeriod: 'Rental Period',
      rentalFee: 'Rental Fee',
      termsTitle: 'TERMS & CONDITIONS',
      term1Title: '1. Rental Period',
      term1: 'The renter agrees to rent the equipment for the specified period. Late returns will incur additional charges at 1.5x the daily rate.',
      term2Title: '2. Payment Terms',
      term2: 'Full payment is due upon booking confirmation. Payment is non-refundable unless cancelled 48 hours before rental start date.',
      term3Title: '3. Equipment Condition',
      term3: 'The equipment is rented in "as-is" condition. The renter acknowledges receiving the equipment in good working condition.',
      term4Title: '4. Renter Responsibilities',
      term4: 'The renter is responsible for safe operation, proper storage, and regular maintenance during the rental period. Equipment must be returned clean and in the same condition as received.',
      term5Title: '5. Insurance & Liability',
      term5: 'The renter is liable for any damage, loss, or theft of the equipment during the rental period. We recommend obtaining rental insurance.',
      term6Title: '6. Prohibited Uses',
      term6: 'The equipment cannot be used for commercial purposes (unless agreed), rented to third parties, or used beyond its intended design specifications.',
      term7Title: '7. Cancellation Policy',
      term7: 'Cancellations made 48+ hours before rental start: Full refund. Cancellations made within 48 hours: No refund.',
      damagePolicyTitle: 'DAMAGE POLICY',
      damageIntro: 'The following damage fee schedule applies:',
      minorDamage: 'Minor Damage (scratches, small dents): 10-25% of rental fee',
      moderateDamage: 'Moderate Damage (functional issues, visible damage): 25-50% of rental fee',
      severeDamage: 'Severe Damage (non-functional, requires repair): 50-100% of rental fee',
      totalLoss: 'Total Loss (destroyed/stolen): 100% + replacement cost',
      damageProcess: 'Damage Assessment: Equipment condition will be documented upon return. Disputes must be raised within 24 hours of return.',
      signatureTitle: 'DIGITAL SIGNATURE',
      signatureInstructions: 'Please sign below to confirm agreement with all terms and conditions:',
      clearSignature: 'Clear Signature',
      agreeCheckbox: 'I agree to all terms and conditions outlined in this rental agreement',
      sign: 'Sign Agreement',
      signing: 'Signing...',
      signatureRequired: 'Please provide your signature',
      agreementRequired: 'You must agree to the terms and conditions',
      success: 'Agreement signed successfully!',
      printPDF: 'Print/Save as PDF',
      to: 'to',
    },
    ka: {
      rentalAgreement: 'აღჭურვილობის ქირაობის შეთანხმება',
      loading: 'იტვირთება...',
      error: 'შეცდომა დაჯავშვის დეტალების ჩატვირთვაში',
      agreementTitle: 'აღჭურვილობის ქირაობის და სერვისის შეთანხმება',
      date: 'თარიღი',
      renterInfo: 'ქირაიდის ინფორმაცია',
      name: 'სახელი',
      email: 'ელფოსტა',
      phone: 'ტელეფონი',
      equipmentInfo: 'აღჭურვილობის ინფორმაცია',
      equipmentName: 'აღჭურვილობის სახელი',
      rentalPeriod: 'ქირაობის პერიოდი',
      rentalFee: 'ქირაობის ფასი',
      termsTitle: 'პირობები და წესები',
      term1Title: '1. ქირაობის პერიოდი',
      term1: 'ქირაიდი ეთანხმება აღჭურვილობის ქირაობას მითითებული პერიოდის განმავლობაში. გვიან დაბრუნება გამოიწვევს დამატებით გადასახადებს 1.5x დღიური განაკვეთით.',
      term2Title: '2. გადახდის პირობები',
      term2: 'სრული გადახდა ხდება დაჯავშვის დადასტურების დროს. გადახდა უბრუნებელია, გარდა იმ შემთხვევისა, თუ ქირაობა გაუქმდა ქირაობის დაწყებამდე 48 საათით ადრე.',
      term3Title: '3. აღჭურვილობის მდგომარეობა',
      term3: 'აღჭურვილობა ქირაობს "როგორი იყო" პირობით. ქირაიდი აღიარებს აღჭურვილობის მიღებას კარგი მდგომარეობით.',
      term4Title: '4. ქირაიდის პასუხისმგებლობა',
      term4: 'ქირაიდი პასუხისმგებელია უსაფრთხო ოპერაციისთვის, სათანადო შენახვისთვის და რეგულარული მოვლისთვის ქირაობის პერიოდში. აღჭურვილობა უნდა დაბრუნდეს სუფთა და იმავე მდგომარეობით.',
      term5Title: '5. დაზღვევა და პასუხისმგებლობა',
      term5: 'ქირაიდი პასუხისმგებელია აღჭურვილობის რაიმე ზიანისთვის, დაკარგვისთვის ან ქურდობისთვის ქირაობის პერიოდში.',
      term6Title: '6. აკრძალული გამოყენება',
      term6: 'აღჭურვილობა არ შეიძლება გამოყენებული იყოს კომერციული მიზნით, დაქირავებული მესამე მხარეებზე, ან გამოყენებული მის დანიშვულებაზე გარე.',
      term7Title: '7. გაუქმების პოლიტიკა',
      term7: 'გაუქმებები 48+ საათით დაჯავშვის დაწყებამდე: სრული დაბრუნება. გაუქმებები 48 საათში: რეფუნდი არ არის.',
      damagePolicyTitle: 'ზიანის პოლიტიკა',
      damageIntro: 'ზიანის შემდეგი განრიგი გამოიყენება:',
      minorDamage: 'მცირე ზიანი (გაწმენდა, მცირე მოჭეჭილობა): ქირაობის ფასის 10-25%',
      moderateDamage: 'საშუალო ზიანი (ფუნქციური პრობლემები, ხილული ზიანი): ქირაობის ფასის 25-50%',
      severeDamage: 'მძიმე ზიანი (არა ფუნქციური, მოითხოვს შეკეთებას): ქირაობის ფასის 50-100%',
      totalLoss: 'სრული დაკარგვა (ნგრეული/გაკრადული): 100% + ჩანაცვლების ღირებულება',
      damageProcess: 'ზიანის შეფასება: აღჭურვილობის მდგომარეობა დოკუმენტირებული იქნება დაბრუნებაზე.',
      signatureTitle: 'ციფრული ხელმოწერა',
      signatureInstructions: 'გთხოვთ ხელი მოაწეროთ ქვემოთ ყველა პირობის დადასტურებისთვის:',
      clearSignature: 'ხელმოწერის გასუფთავება',
      agreeCheckbox: 'ვეთანხმები ამ ქირაობის შეთანხმებაში ჩამოთვლილ ყველა პირობას',
      sign: 'შეთანხმებაზე ხელი მოაწერე',
      signing: 'ხელმოწერა...',
      signatureRequired: 'გთხოვთ მიაწოდოთ თქვენი ხელმოწერა',
      agreementRequired: 'თქვენ უნდა დაეთანხმოთ პირობებს',
      success: 'შეთანხმება წარმატებით ხელმოწერილი!',
      printPDF: 'ამობეჭდვა/შენახვა PDF-ად',
      to: 'დან',
    },
    ru: {
      rentalAgreement: 'Договор аренды оборудования',
      loading: 'Загрузка...',
      error: 'Ошибка при загрузке данных бронирования',
      agreementTitle: 'ДОГОВОР АРЕНДЫ И ОБСЛУЖИВАНИЯ ОБОРУДОВАНИЯ',
      date: 'Дата',
      renterInfo: 'ИНФОРМАЦИЯ О АРЕНДАТОРЕ',
      name: 'Имя',
      email: 'Email',
      phone: 'Телефон',
      equipmentInfo: 'ИНФОРМАЦИЯ ОБ ОБОРУДОВАНИИ',
      equipmentName: 'Название оборудования',
      rentalPeriod: 'Период аренды',
      rentalFee: 'Арендная плата',
      termsTitle: 'УСЛОВИЯ И ПОЛОЖЕНИЯ',
      term1Title: '1. Период аренды',
      term1: 'Арендатор соглашается арендовать оборудование в течение указанного периода. Возврат позже предусмотренного времени будет взиматься в размере 1,5x дневного тарифа.',
      term2Title: '2. Условия оплаты',
      term2: 'Полная оплата должна быть произведена при подтверждении бронирования. Платеж невозвратен, если аренда не отменена за 48 часов до даты начала аренды.',
      term3Title: '3. Состояние оборудования',
      term3: 'Оборудование арендуется в состоянии "как есть". Арендатор подтверждает получение оборудования в хорошем рабочем состоянии.',
      term4Title: '4. Ответственность арендатора',
      term4: 'Арендатор несет ответственность за безопасную работу, надлежащее хранение и регулярное обслуживание в течение периода аренды. Оборудование должно быть возвращено чистым и в том же состоянии.',
      term5Title: '5. Страховка и ответственность',
      term5: 'Арендатор несет ответственность за любой ущерб, потерю или кражу оборудования в течение периода аренды.',
      term6Title: '6. Запрещенные использования',
      term6: 'Оборудование нельзя использовать в коммерческих целях, передавать третьим лицам или использовать за пределами его предназначения.',
      term7Title: '7. Политика отмены',
      term7: 'Отмена за 48+ часов до начала аренды: полный возврат. Отмена в течение 48 часов: возврат не производится.',
      damagePolicyTitle: 'ПОЛИТИКА ПОВРЕЖДЕНИЙ',
      damageIntro: 'Применяется следующий график платежей за повреждения:',
      minorDamage: 'Незначительное повреждение (царапины, небольшие вмятины): 10-25% от стоимости аренды',
      moderateDamage: 'Умеренное повреждение (функциональные проблемы, видимые повреждения): 25-50% от стоимости аренды',
      severeDamage: 'Серьезное повреждение (нефункциональное, требует ремонта): 50-100% от стоимости аренды',
      totalLoss: 'Полная потеря (разрушено/украдено): 100% + стоимость замены',
      damageProcess: 'Оценка повреждений: состояние оборудования будет документировано при возврате.',
      signatureTitle: 'ЦИФРОВАЯ ПОДПИСЬ',
      signatureInstructions: 'Пожалуйста, подпишитесь ниже для подтверждения согласия со всеми условиями:',
      clearSignature: 'Очистить подпись',
      agreeCheckbox: 'Я согласен со всеми условиями, указанными в этом договоре аренды',
      sign: 'Подписать договор',
      signing: 'Подпись...',
      signatureRequired: 'Пожалуйста, предоставьте вашу подпись',
      agreementRequired: 'Вы должны согласиться с условиями',
      success: 'Договор успешно подписан!',
      printPDF: 'Печать/Сохранить как PDF',
      to: 'до',
    },
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/bookings/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBooking(response.data.booking);
      setEquipment(response.data.equipment);
      setUser(response.data.user);
    } catch (err) {
      setError(t.error);
      console.error('Error fetching booking details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSignature = () => {
    signatureRef.current.clear();
    setSignatureImage(null);
  };

  const handleSaveSignature = () => {
    const canvas = signatureRef.current.getCanvas();
    setSignatureImage(canvas.toDataURL());
  };

  const handleSubmit = async () => {
    if (!signatureImage) {
      alert(t.signatureRequired);
      return;
    }

    if (!agreed) {
      alert(t.agreementRequired);
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/agreements/sign`,
        {
          bookingId,
          signature: signatureImage,
          agreedToTerms: true,
          signedAt: new Date(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(t.success);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error signing agreement');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="rental-agreement-page">{t.loading}</div>;
  }

  if (error && !booking) {
    return <div className="rental-agreement-page"><p className="error">{error}</p></div>;
  }

  return (
    <div className="rental-agreement-page">
      <div className="agreement-container">
        <button className="print-btn" onClick={() => window.print()}>
          🖨️ {t.printPDF}
        </button>

        {/* Header */}
        <div className="agreement-header">
          <h1>{t.agreementTitle}</h1>
          <p className="date">{t.date}: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Renter Information */}
        <div className="section">
          <h2>{t.renterInfo}</h2>
          {user && (
            <div className="info-grid">
              <div className="info-item">
                <label>{t.name}:</label>
                <p>{user.firstName} {user.lastName}</p>
              </div>
              <div className="info-item">
                <label>{t.email}:</label>
                <p>{user.email}</p>
              </div>
              <div className="info-item">
                <label>{t.phone}:</label>
                <p>{user.phone || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Equipment Information */}
        <div className="section">
          <h2>{t.equipmentInfo}</h2>
          {equipment && booking && (
            <div className="info-grid">
              <div className="info-item">
                <label>{t.equipmentName}:</label>
                <p>{equipment.name}</p>
              </div>
              <div className="info-item">
                <label>{t.rentalPeriod}:</label>
                <p>{booking.startDate} {t.to} {booking.endDate}</p>
              </div>
              <div className="info-item">
                <label>{t.rentalFee}:</label>
                <p>${booking.totalPrice}</p>
              </div>
            </div>
          )}
        </div>

        {/* Terms & Conditions */}
        <div className="section">
          <h2>{t.termsTitle}</h2>
          <div className="terms-list">
            <div className="term">
              <h3>{t.term1Title}</h3>
              <p>{t.term1}</p>
            </div>
            <div className="term">
              <h3>{t.term2Title}</h3>
              <p>{t.term2}</p>
            </div>
            <div className="term">
              <h3>{t.term3Title}</h3>
              <p>{t.term3}</p>
            </div>
            <div className="term">
              <h3>{t.term4Title}</h3>
              <p>{t.term4}</p>
            </div>
            <div className="term">
              <h3>{t.term5Title}</h3>
              <p>{t.term5}</p>
            </div>
            <div className="term">
              <h3>{t.term6Title}</h3>
              <p>{t.term6}</p>
            </div>
            <div className="term">
              <h3>{t.term7Title}</h3>
              <p>{t.term7}</p>
            </div>
          </div>
        </div>

        {/* Damage Policy */}
        <div className="section damage-policy">
          <h2>{t.damagePolicyTitle}</h2>
          <p>{t.damageIntro}</p>
          <ul className="damage-list">
            <li><strong>{t.minorDamage}</strong></li>
            <li><strong>{t.moderateDamage}</strong></li>
            <li><strong>{t.severeDamage}</strong></li>
            <li><strong>{t.totalLoss}</strong></li>
          </ul>
          <p className="damage-note">{t.damageProcess}</p>
        </div>

        {/* Digital Signature */}
        <div className="section signature-section">
          <h2>{t.signatureTitle}</h2>
          <p>{t.signatureInstructions}</p>

          <div className="signature-canvas-wrapper">
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                width: 500,
                height: 200,
                className: 'signature-canvas',
              }}
            />
          </div>

          <button
            className="clear-btn"
            onClick={handleClearSignature}
          >
            🔄 {t.clearSignature}
          </button>

          <button
            className="save-btn"
            onClick={handleSaveSignature}
          >
            ✓ Save Signature
          </button>

          {signatureImage && (
            <div className="signature-preview">
              <p>✓ Signature captured</p>
            </div>
          )}
        </div>

        {/* Agreement Checkbox */}
        <div className="section agreement-checkbox-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            {t.agreeCheckbox}
          </label>
        </div>

        {/* Submit Button */}
        <div className="section submit-section">
          <button
            className="btn btn-primary sign-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? t.signing : t.sign}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      <style jsx>{`
        .rental-agreement-page {
          padding: 2rem;
          background-color: #f5f5f5;
          min-height: 100vh;
        }

        .agreement-container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          padding: 3rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          line-height: 1.6;
        }

        .print-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          padding: 0.5rem 1rem;
          background-color: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .print-btn:hover {
          background-color: #5568d3;
        }

        .agreement-header {
          text-align: center;
          margin-bottom: 2rem;
          border-bottom: 2px solid #667eea;
          padding-bottom: 1rem;
        }

        .agreement-header h1 {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 1.8rem;
        }

        .agreement-header .date {
          margin: 0;
          color: #999;
          font-size: 0.9rem;
        }

        .section {
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #eee;
        }

        .section h2 {
          color: #667eea;
          font-size: 1.3rem;
          margin: 0 0 1rem 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .info-item {
          background-color: #f9f9f9;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #eee;
        }

        .info-item label {
          font-weight: 600;
          color: #333;
          display: block;
          margin-bottom: 0.5rem;
        }

        .info-item p {
          margin: 0;
          color: #666;
        }

        .terms-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .term {
          background-color: #f9f9f9;
          padding: 1.5rem;
          border-radius: 6px;
          border-left: 4px solid #667eea;
        }

        .term h3 {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 1rem;
        }

        .term p {
          margin: 0;
          color: #666;
          line-height: 1.6;
        }

        .damage-policy {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
        }

        .damage-policy h2 {
          color: #856404;
        }

        .damage-list {
          background: white;
          padding: 1.5rem;
          border-radius: 6px;
          margin: 1rem 0;
        }

        .damage-list li {
          margin-bottom: 0.75rem;
          color: #666;
          line-height: 1.6;
        }

        .damage-note {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          color: #666;
          font-size: 0.95rem;
        }

        .signature-section {
          background-color: #e8eeff;
          border-left: 4px solid #667eea;
          padding: 2rem;
        }

        .signature-canvas-wrapper {
          border: 2px solid #667eea;
          border-radius: 6px;
          overflow: hidden;
          background: white;
          margin: 1.5rem 0;
        }

        .signature-canvas {
          display: block;
          width: 100%;
          cursor: crosshair;
        }

        .clear-btn,
        .save-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          margin-right: 0.5rem;
          margin-bottom: 1rem;
        }

        .clear-btn {
          background-color: #999;
          color: white;
        }

        .clear-btn:hover {
          background-color: #777;
        }

        .save-btn {
          background-color: #28a745;
          color: white;
        }

        .save-btn:hover {
          background-color: #218838;
        }

        .signature-preview {
          background-color: #d4edda;
          color: #155724;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #c3e6cb;
          margin-bottom: 1rem;
        }

        .agreement-checkbox-section {
          background-color: #f0f0f0;
          padding: 1.5rem;
          border-radius: 6px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          font-weight: 600;
          color: #333;
        }

        .checkbox-label input {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .submit-section {
          text-align: center;
          border-bottom: none;
        }

        .sign-btn {
          padding: 1rem 3rem;
          font-size: 1.1rem;
          min-width: 200px;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background-color: #667eea;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #5568d3;
          transform: translateY(-2px);
        }

        .btn-primary:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 1rem;
          border-radius: 4px;
          margin-top: 1rem;
          border: 1px solid #f5c6cb;
        }

        .error {
          color: #dc3545;
          padding: 2rem;
          text-align: center;
        }

        @media print {
          .print-btn,
          .clear-btn,
          .save-btn,
          .sign-btn,
          .submit-section,
          .agreement-checkbox-section {
            display: none;
          }

          .agreement-container {
            box-shadow: none;
            padding: 0;
          }
        }

        @media (max-width: 768px) {
          .agreement-container {
            padding: 1.5rem;
          }

          .agreement-header h1 {
            font-size: 1.3rem;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .signature-canvas-wrapper {
            max-width: 100%;
          }

          .clear-btn,
          .save-btn {
            width: 100%;
            margin-right: 0;
            margin-bottom: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default RentalAgreement;