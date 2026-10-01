import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

const PLATFORM_COMMISSION_RATE = 0.10; // 10% commission to nkotomanidi@gmail.com

function CheckoutForm({ equipment, startDate, endDate, totalPrice, bookingId, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const commission = totalPrice * PLATFORM_COMMISSION_RATE;
  const ownerAmount = totalPrice - commission;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Create payment intent via Stripe backend route
      const intentRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/stripe/create-payment-intent`,
        {
          bookingId: bookingId,
          amount: totalPrice,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const { clientSecret } = intentRes.data;

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      // Confirm payment via backend
      const confirmRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/stripe/confirm-payment`,
        {
          bookingId: bookingId,
          paymentIntentId: paymentIntent.id,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      onSuccess({ 
        booking: confirmRes.data, 
        paymentId: paymentIntent.id,
        commission: commission,
        platformEmail: 'nkotomanidi@gmail.com'
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="price-breakdown">
        <h3>Price Breakdown</h3>
        <div className="breakdown-row">
          <span>Rental Total</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        <div className="breakdown-row commission">
          <span>Platform Fee (10%)</span>
          <span>${commission.toFixed(2)}</span>
        </div>
        <div className="breakdown-row owner-row">
          <span>Owner Receives (90%)</span>
          <span>${ownerAmount.toFixed(2)}</span>
        </div>
        <div className="breakdown-row total">
          <span><strong>You Pay</strong></span>
          <span><strong>${totalPrice.toFixed(2)}</strong></span>
        </div>
        <p className="platform-note">💳 Platform: nkotomanidi@gmail.com</p>
      </div>

      <div className="card-section">
        <label className="card-label">Card Details</label>
        <div className="card-element-wrapper">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1f2937',
                  '::placeholder': { color: '#6b7280' },
                },
                invalid: { color: '#dc2626' },
              },
            }}
          />
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <button type="submit" className="btn btn-primary pay-btn" disabled={!stripe || loading}>
        {loading ? 'Processing...' : `Pay $${totalPrice.toFixed(2)}`}
      </button>

      <p className="secure-note">🔒 Payments are securely processed by Stripe</p>
    </form>
  );
}

function BookingCalendar({ equipment, onSelectDates, startDate, endDate }) {
  const [bookedDates, setBookedDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookedDates();
  }, [equipment.id]);

  const fetchBookedDates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/bookings/equipment/${equipment.id}/availability`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookedDates(response.data.bookedDates || []);
    } catch (err) {
      console.error('Error fetching booked dates:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateBooked = (day) => {
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString()
      .split('T')[0];
    return bookedDates.includes(dateStr);
  };

  const isDateSelected = (day) => {
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString()
      .split('T')[0];
    
    if (!startDate || !endDate) return false;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    return current >= start && current <= end;
  };

  const handleDateClick = (day) => {
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString()
      .split('T')[0];

    if (isDateBooked(day)) return;

    if (!startDate) {
      onSelectDates(dateStr, '');
    } else if (!endDate) {
      if (dateStr > startDate) {
        onSelectDates(startDate, dateStr);
      } else {
        onSelectDates(dateStr, '');
      }
    } else {
      onSelectDates(dateStr, '');
    }
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const today = new Date();
  const isToday = (day) => {
    return (
      day &&
      currentMonth.getFullYear() === today.getFullYear() &&
      currentMonth.getMonth() === today.getMonth() &&
      day === today.getDate()
    );
  };

  const isPastDate = (day) => {
    if (!day) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date < today;
  };

  return (
    <div className="booking-calendar">
      <h3>Select Rental Dates</h3>
      <p className="calendar-subtitle">Click dates to select your rental period</p>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-box available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-box booked"></div>
          <span>Booked</span>
        </div>
        <div className="legend-item">
          <div className="legend-box selected"></div>
          <span>Selected</span>
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-header">
          <button onClick={prevMonth} className="nav-btn">←</button>
          <h4>{monthName}</h4>
          <button onClick={nextMonth} className="nav-btn">→</button>
        </div>

        <div className="weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="days-grid">
          {days.map((day, idx) => (
            <div
              key={idx}
              className={`day-cell ${isDateBooked(day) ? 'booked' : ''} ${
                isDateSelected(day) ? 'selected' : ''
              } ${isToday(day) ? 'today' : ''} ${isPastDate(day) ? 'past' : ''}`}
              onClick={() => handleDateClick(day)}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {startDate && (
        <div className="selected-dates-summary">
          <p>
            Start: <strong>{startDate}</strong>
            {endDate && <span> → End: <strong>{endDate}</strong></span>}
          </p>
        </div>
      )}
    </div>
  );
}

function Booking({ language }) {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [rentalDays, setRentalDays] = useState(0);
  const [error, setError] = useState('');
  const [step, setStep] = useState('calendar');
  const [bookingId, setBookingId] = useState(null);

  const translations = {
    en: {
      selectDates: 'Select Rental Dates',
      continuePayment: 'Continue to Payment',
      paymentDetails: 'Payment Details',
      backToDates: 'Back to Dates',
      loading: 'Loading...',
      notFound: 'Equipment not found',
      selectBoth: 'Please select both start and end dates',
      invalidDates: 'End date must be after start date',
      rentalSummary: 'Renting',
      days: 'days',
      day: 'day',
    },
    ka: {
      selectDates: 'ქირაობის თარიღების არჩევა',
      continuePayment: 'გადახდაზე გადასვლა',
      paymentDetails: 'გადახდის დეტალები',
      backToDates: 'თარიღებზე დაბრუნება',
      loading: 'იტვირთება...',
      notFound: 'აღჭურვილობა ნაპოვნი არ არის',
      selectBoth: 'გთხოვთ აირჩიეთ დაწყების და დასრულების თარიღი',
      invalidDates: 'დასრულების თარიღი უნდა იყოს დაწყების თარიღის შემდეგ',
      rentalSummary: 'ქირაობა',
      days: 'დღე',
      day: 'დღე',
    },
    ru: {
      selectDates: 'Выберите даты аренды',
      continuePayment: 'Перейти к платежу',
      paymentDetails: 'Детали платежа',
      backToDates: 'Вернуться к датам',
      loading: 'Загрузка...',
      notFound: 'Оборудование не найдено',
      selectBoth: 'Пожалуйста, выберите обе даты',
      invalidDates: 'Дата окончания должна быть позже даты начала',
      rentalSummary: 'Аренда',
      days: 'дней',
      day: 'день',
    },
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/equipment/${equipmentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEquipment(response.data);
      } catch (err) {
        setError(t.notFound);
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, [equipmentId, t.notFound]);

  useEffect(() => {
    if (startDate && endDate && equipment) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end - start;
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (days > 0) {
        setRentalDays(days);
        setTotalPrice(days * equipment.pricePerDay);
      } else {
        setRentalDays(0);
        setTotalPrice(0);
      }
    }
  }, [startDate, endDate, equipment]);

  const handleDateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!startDate || !endDate) {
      setError(t.selectBoth);
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError(t.invalidDates);
      return;
    }
    if (rentalDays <= 0) {
      setError(t.invalidDates);
      return;
    }

    // Create booking first
    try {
      const token = localStorage.getItem('token');
      const bookingRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/bookings`,
        {
          equipmentId: equipment.id,
          startDate,
          endDate,
          totalPrice,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setBookingId(bookingRes.data.id);
      setStep('payment');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    }
  };

  const handlePaymentSuccess = ({ booking, paymentId, commission, platformEmail }) => {
    navigate('/payment-confirmation', { 
      state: { 
        booking, 
        paymentId, 
        equipment,
        commission,
        platformEmail
      } 
    });
  };

  if (loading) return <div className="booking-page"><p>{t.loading}</p></div>;
  if (error && !equipment) return <div className="booking-page"><p className="error">{error}</p></div>;

  return (
    <div className="booking-page">
      <div className="booking-container">
        <div className="equipment-summary">
          <img
            src={equipment.imageUrl || 'https://via.placeholder.com/300'}
            alt={equipment.name}
            className="booking-equipment-img"
          />
          <div className="equipment-info">
            <h2>{equipment.name}</h2>
            <p className="booking-price">${equipment.pricePerDay}/day</p>
            <p className="booking-location">📍 {equipment.location}</p>
            {equipment.description && <p className="booking-desc">{equipment.description}</p>}
          </div>
        </div>

        <div className="booking-form-section">
          {step === 'calendar' && (
            <form onSubmit={handleDateSubmit} className="calendar-form">
              <BookingCalendar
                equipment={equipment}
                onSelectDates={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                }}
                startDate={startDate}
                endDate={endDate}
              />

              {rentalDays > 0 && (
                <div className="price-summary">
                  <p>
                    {rentalDays} {rentalDays === 1 ? t.day : t.days} × ${equipment.pricePerDay}/day
                    = <strong>${totalPrice.toFixed(2)}</strong>
                  </p>
                </div>
              )}

              {error && <p className="error">{error}</p>}

              <button type="submit" className="btn btn-primary" disabled={rentalDays <= 0}>
                {t.continuePayment}
              </button>
            </form>
          )}

          {step === 'payment' && bookingId && (
            <div className="payment-step">
              <button
                className="back-btn"
                onClick={() => setStep('calendar')}
              >
                ← {t.backToDates}
              </button>
              <h3>{t.paymentDetails}</h3>
              <p className="rental-summary">
                {t.rentalSummary} <strong>{equipment.name}</strong> {rentalDays}
                &nbsp;{rentalDays === 1 ? t.day : t.days}
                &nbsp;({startDate} → {endDate})
              </p>
              {stripePromise ? (
                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    equipment={equipment}
                    startDate={startDate}
                    endDate={endDate}
                    totalPrice={totalPrice}
                    bookingId={bookingId}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              ) : (
                <p className="error">
                  Payment is not configured. Please set the{' '}
                  <code>REACT_APP_STRIPE_PUBLISHABLE_KEY</code> environment variable to enable payments.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .booking-page {
          padding: 2rem;
          background-color: #f5f5f5;
          min-height: 100vh;
        }

        .booking-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .equipment-summary {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
        }

        .booking-equipment-img {
          width: 100%;
          height: 250px;
          object-fit: cover;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .equipment-info h2 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .booking-price {
          font-size: 1.5rem;
          color: #667eea;
          font-weight: bold;
          margin: 0.5rem 0;
        }

        .booking-location,
        .booking-desc {
          color: #666;
          margin: 0.5rem 0;
        }

        .booking-form-section {
          background: white;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .booking-calendar {
          width: 100%;
        }

        .booking-calendar h3 {
          margin-top: 0;
          color: #333;
          border-bottom: 2px solid #667eea;
          padding-bottom: 1rem;
        }

        .calendar-subtitle {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .calendar-legend {
          display: flex;
          gap: 2rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .legend-box {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }

        .legend-box.available {
          background-color: #fff;
          border-color: #ddd;
        }

        .legend-box.booked {
          background-color: #dc3545;
        }

        .legend-box.selected {
          background-color: #667eea;
        }

        .calendar-container {
          background: white;
          border-radius: 6px;
          padding: 1.5rem;
          border: 1px solid #eee;
          margin-bottom: 1.5rem;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .calendar-header h4 {
          margin: 0;
          color: #333;
          min-width: 150px;
          text-align: center;
        }

        .nav-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .nav-btn:hover {
          background: #5568d3;
        }

        .weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .weekday {
          text-align: center;
          font-weight: 600;
          color: #667eea;
          padding: 0.5rem 0;
        }

        .days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
        }

        .day-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          background: white;
          font-weight: 500;
          transition: all 0.3s;
        }

        .day-cell:not(.booked):not(.past):hover {
          background-color: #f0f0f0;
          border-color: #667eea;
        }

        .day-cell.booked {
          background-color: #dc3545;
          color: white;
          cursor: not-allowed;
        }

        .day-cell.selected {
          background-color: #667eea;
          color: white;
          border-color: #667eea;
        }

        .day-cell.today {
          font-weight: bold;
          border: 2px solid #667eea;
        }

        .day-cell.past {
          background-color: #f5f5f5;
          color: #ccc;
          cursor: not-allowed;
        }

        .selected-dates-summary {
          background: #e8eeff;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          border-left: 4px solid #667eea;
        }

        .selected-dates-summary p {
          margin: 0;
          color: #333;
        }

        .price-summary {
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .price-summary p {
          margin: 0;
          color: #666;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          width: 100%;
        }

        .btn-primary {
          background-color: #667eea;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #5568d3;
        }

        .btn-primary:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .back-btn {
          background: none;
          border: none;
          color: #667eea;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 1rem;
          padding: 0;
        }

        .back-btn:hover {
          text-decoration: underline;
        }

        .payment-step h3 {
          color: #333;
          margin-top: 0;
          border-bottom: 2px solid #667eea;
          padding-bottom: 1rem;
        }

        .rental-summary {
          background: #e8eeff;
          padding: 1rem;
          border-radius: 6px;
          color: #333;
          margin-bottom: 1.5rem;
        }

        .platform-note {
          font-size: 0.9rem;
          color: #666;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid #eee;
        }

        .checkout-form {
          width: 100%;
        }

        .price-breakdown {
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
        }

        .price-breakdown h3 {
          margin: 0 0 1rem 0;
          color: #333;
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          color: #666;
        }

        .breakdown-row.total {
          border-top: 2px solid #667eea;
          padding-top: 1rem;
          margin-top: 0.5rem;
          color: #333;
          font-size: 1.1rem;
        }

        .breakdown-row.commission {
          color: #667eea;
        }

        .breakdown-row.owner-row {
          color: #666;
        }

        .card-section {
          margin-bottom: 1.5rem;
        }

        .card-label {
          display: block;
          margin-bottom: 0.5rem;
          color: #333;
          font-weight: 600;
        }

        .card-element-wrapper {
          border: 1px solid #ddd;
          padding: 1rem;
          border-radius: 4px;
          background: white;
        }

        .error {
          background-color: #f8d7da;
          color: #721c24;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          border: 1px solid #f5c6cb;
        }

        .secure-note {
          text-align: center;
          color: #999;
          font-size: 0.9rem;
          margin-top: 1rem;
        }

        .pay-btn {
          margin-top: 1rem;
        }

        @media (max-width: 768px) {
          .booking-container {
            grid-template-columns: 1fr;
          }

          .weekdays,
          .days-grid {
            grid-template-columns: repeat(7, 1fr);
          }

          .calendar-legend {
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Booking;